// background.js — Taiwan Weather Chrome Extension Service Worker
// Handles: periodic cache refresh, toolbar icon temperature display

const CWA_API_BASE = "https://opendata.cwa.gov.tw/api/v1/rest/datastore";
const ALARM_NAME = "weatherRefresh";
const CACHE_KEY = "weatherCache";
const LOCATIONS_KEY = "savedLocations";
const SETTINGS_KEY = "settings";

const DEFAULT_SETTINGS = {
  apiKey: "CWA-3E823709-E043-4F98-AC95-A1A2986B328F",
  cacheTtlMinutes: 60,
  demoMode: false,
  theme: "cute-light-theme"
};

// ── Utility: get stored settings ──────────────────────────────────────────────
async function getSettings() {
  return new Promise(resolve => {
    chrome.storage.local.get({ [SETTINGS_KEY]: DEFAULT_SETTINGS }, result => {
      resolve({ ...DEFAULT_SETTINGS, ...result[SETTINGS_KEY] });
    });
  });
}

// ── Utility: get saved locations ──────────────────────────────────────────────
async function getSavedLocations() {
  return new Promise(resolve => {
    chrome.storage.local.get({ [LOCATIONS_KEY]: [] }, result => {
      resolve(result[LOCATIONS_KEY]);
    });
  });
}

// ── Utility: read cache ────────────────────────────────────────────────────────
async function getCache() {
  return new Promise(resolve => {
    chrome.storage.local.get({ [CACHE_KEY]: {} }, result => {
      resolve(result[CACHE_KEY]);
    });
  });
}

// ── Utility: write single cache entry ─────────────────────────────────────────
async function setCacheEntry(cacheKey, data) {
  const cache = await getCache();
  cache[cacheKey] = { fetchedAt: Date.now(), data };
  return new Promise(resolve => {
    chrome.storage.local.set({ [CACHE_KEY]: cache }, resolve);
  });
}

// ── Dataset ID map (county → 7-day forecast dataset ID) ──────────────────────
// Loaded from city_county_data.js in popup context; here we hardcode the map.
const COUNTY_DATASET_MAP = {
  "宜蘭縣": "F-D0047-003", "桃園市": "F-D0047-007", "新竹縣": "F-D0047-011",
  "苗栗縣": "F-D0047-015", "彰化縣": "F-D0047-019", "南投縣": "F-D0047-023",
  "雲林縣": "F-D0047-027", "嘉義縣": "F-D0047-031", "屏東縣": "F-D0047-035",
  "臺東縣": "F-D0047-039", "花蓮縣": "F-D0047-043", "澎湖縣": "F-D0047-047",
  "基隆市": "F-D0047-051", "新竹市": "F-D0047-055", "嘉義市": "F-D0047-059",
  "臺北市": "F-D0047-063", "高雄市": "F-D0047-067", "新北市": "F-D0047-071",
  "臺中市": "F-D0047-075", "臺南市": "F-D0047-079", "連江縣": "F-D0047-083",
  "金門縣": "F-D0047-087"
};

// ── CWA API fetch + parse (minimal, for background context) ───────────────────
function safeGetVal(ev, ...keys) {
  if (!ev || !ev[0]) return null;
  const obj = ev[0];
  for (const k of keys) { if (obj[k] !== undefined) return obj[k]; }
  const vals = Object.values(obj);
  return vals.length > 0 ? vals[0] : null;
}

async function fetchAndCacheWeather(county, township, apiKey) {
  const datasetId = COUNTY_DATASET_MAP[county];
  if (!datasetId) throw new Error(`Unknown county: ${county}`);

  const url = `${CWA_API_BASE}/${datasetId}?Authorization=${apiKey}&locationName=${encodeURIComponent(township)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API error: ${res.status}`);

  const json = await res.json();
  if (json.success !== "true" || !json.records) throw new Error("API returned failure");

  const locsArray = json.records.Locations || json.records.locations;
  if (!locsArray || !Array.isArray(locsArray) || locsArray.length === 0) {
    throw new Error("Locations field is empty or invalid in CWA response");
  }

  const firstLoc = locsArray[0];
  if (!firstLoc) throw new Error("Locations[0] is empty");

  const locationList = firstLoc.Location || firstLoc.location;
  if (!locationList || !Array.isArray(locationList) || locationList.length === 0) {
    throw new Error("Location list is empty in CWA response");
  }

  const townData = locationList.find(loc =>
    (loc?.LocationName || loc?.locationName) === township
  );
  if (!townData) throw new Error(`Township not found in CWA response: ${township}`);

  const elements = townData.WeatherElement || townData.weatherElement;
  if (!elements || !Array.isArray(elements)) {
    throw new Error("WeatherElement list is missing or invalid in CWA response");
  }

  const elMap = {};
  elements.forEach(el => {
    if (el) {
      const name = el.ElementName || el.elementName;
      if (name) elMap[name] = el;
    }
  });

  const getTimes = el => el ? (el.Time || el.time || []) : [];
  const getVal = (timeSlot, ...keys) => {
    if (!timeSlot) return null;
    return safeGetVal(timeSlot.ElementValue || timeSlot.elementValue, ...keys);
  };

  const tempT   = getTimes(elMap["平均溫度"])[0];
  const maxATT  = getTimes(elMap["最高體感溫度"])[0];
  const minATT  = getTimes(elMap["最低體感溫度"])[0];
  const rhT     = getTimes(elMap["平均相對濕度"])[0];
  const popT    = getTimes(elMap["12小時降雨機率"])[0];
  const wxT     = getTimes(elMap["天氣現象"])[0];
  const windT   = getTimes(elMap["風速"])[0];
  const windDT  = getTimes(elMap["風向"])[0];

  const current = {
    temp:          getVal(tempT,  "Temperature")           || "--",
    apparentTemp:  getVal(maxATT, "MaxApparentTemperature") || getVal(minATT, "MinApparentTemperature") || "--",
    humidity:      getVal(rhT,    "RelativeHumidity")       || "--",
    rainProb:      getVal(popT,   "ProbabilityOfPrecipitation") || "0",
    windScale:     getVal(windT,  "BeaufortScale")          || "--",
    windDirection: getVal(windDT, "WindDirection")          || "--",
    wx:            getVal(wxT,    "Weather")                || "多雲"
  };

  // Build 7-day forecast
  const wxTimes   = getTimes(elMap["天氣現象"]);
  const maxTTimes = getTimes(elMap["最高溫度"]);
  const minTTimes = getTimes(elMap["最低溫度"]);
  const popTimes  = getTimes(elMap["12小時降雨機率"]);
  const forecastMap = {};
  const daysOfWeek = ["週日","週一","週二","週三","週四","週五","週六"];

  wxTimes.forEach((t, idx) => {
    const startStr = t.StartTime || t.startTime || "";
    const dateKey  = startStr.includes("T") ? startStr.split("T")[0] : startStr.split(" ")[0];
    if (!dateKey) return;
    const dateObj = new Date(dateKey + "T00:00:00");
    const dayName = daysOfWeek[dateObj.getDay()];
    const hourPart = startStr.includes("T") ? parseInt(startStr.split("T")[1].slice(0,2)) : 0;
    const isDay = hourPart >= 6 && hourPart < 18;

    if (!forecastMap[dateKey]) {
      forecastMap[dateKey] = { date: dateKey, dayName, minT: 999, maxT: -999, maxPop: 0, dayWx: "", nightWx: "", wx: "" };
    }
    const wxVal = getVal(t, "Weather") || "";
    if (isDay) forecastMap[dateKey].dayWx = wxVal; else forecastMap[dateKey].nightWx = wxVal;

    const maxTVal = parseInt(getVal(maxTTimes[idx], "MaxTemperature") || "NaN");
    if (!isNaN(maxTVal) && maxTVal > forecastMap[dateKey].maxT) forecastMap[dateKey].maxT = maxTVal;
    const minTVal = parseInt(getVal(minTTimes[idx], "MinTemperature") || "NaN");
    if (!isNaN(minTVal) && minTVal < forecastMap[dateKey].minT) forecastMap[dateKey].minT = minTVal;
    const popVal  = parseInt(getVal(popTimes[idx],  "ProbabilityOfPrecipitation") || "NaN");
    if (!isNaN(popVal)  && popVal  > forecastMap[dateKey].maxPop)  forecastMap[dateKey].maxPop  = popVal;
  });

  const forecast = Object.values(forecastMap)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 7)
    .map((day, i) => {
      day.wx          = day.dayWx || day.nightWx || "多雲";
      day.displayName = i === 0 ? "今天" : i === 1 ? "明天" : day.dayName;
      if (day.minT === 999)  day.minT = 20;
      if (day.maxT === -999) day.maxT = 28;
      return day;
    });

  const data = { current, forecast };
  await setCacheEntry(`${county}_${township}`, data);
  return data;
}

// ── Toolbar Icon: draw temperature on OffscreenCanvas ─────────────────────────
function tempToColor(temp) {
  const t = parseInt(temp);
  if (isNaN(t)) return { bg: "#7ec8e3", text: "#1a3a4a" };
  if (t <= 10)  return { bg: "#74b9ff", text: "#2d3436" };  // cold blue
  if (t <= 18)  return { bg: "#55efc4", text: "#2d3436" };  // cool teal
  if (t <= 26)  return { bg: "#ffeaa7", text: "#2d3436" };  // warm yellow
  if (t <= 32)  return { bg: "#fd79a8", text: "#ffffff" };  // hot pink
  return { bg: "#e17055", text: "#ffffff" };                 // very hot orange
}

async function updateToolbarIcon(temp, wx) {
  try {
    const size = 128;
    const canvas = new OffscreenCanvas(size, size);
    const ctx = canvas.getContext("2d");

    const { bg, text: textColor } = tempToColor(temp);

    // Background circle
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.fill();

    // Temperature number
    const tempStr = temp !== "--" ? `${temp}°` : "--";
    ctx.fillStyle = textColor;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Extra large font for temp only
    ctx.font = `bold ${tempStr.length >= 4 ? 54 : 64}px Arial`;
    ctx.fillText(tempStr, size / 2, size / 2 + 4);

    const imageData = ctx.getImageData(0, 0, size, size);
    await chrome.action.setIcon({ imageData });
  } catch (e) {
    console.warn("[BG] setIcon failed:", e.message);
  }
}

// ── Alarm: periodic refresh of primary location ───────────────────────────────
async function refreshPrimaryLocation() {
  const settings = await getSettings();
  if (settings.demoMode || !settings.apiKey) return;

  const locations = await getSavedLocations();
  const primary = locations.find(l => l.isPrimary) || locations[0];
  if (!primary) return;

  try {
    console.log(`[BG] Refreshing primary: ${primary.county} ${primary.township}`);
    const data = await fetchAndCacheWeather(primary.county, primary.township, settings.apiKey);
    await updateToolbarIcon(data.current.temp, data.current.wx);
    console.log("[BG] Refresh OK, temp:", data.current.temp);
  } catch (e) {
    console.warn("[BG] Refresh failed:", e.message);
  }
}

// ── Setup alarm with current TTL setting ──────────────────────────────────────
async function setupAlarm() {
  const settings = await getSettings();
  const periodMinutes = settings.cacheTtlMinutes || 60;

  await chrome.alarms.clearAll();
  chrome.alarms.create(ALARM_NAME, {
    delayInMinutes: periodMinutes,
    periodInMinutes: periodMinutes
  });
  console.log(`[BG] Alarm set: every ${periodMinutes} min`);
}

// ── Event Listeners ────────────────────────────────────────────────────────────

// On install / update: setup alarm and do first fetch
chrome.runtime.onInstalled.addListener(async () => {
  console.log("[BG] Extension installed/updated");
  await setupAlarm();
  await refreshPrimaryLocation();
});

// On browser startup
chrome.runtime.onStartup.addListener(async () => {
  console.log("[BG] Browser started");
  await setupAlarm();
  await refreshPrimaryLocation();
});

// On alarm trigger
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === ALARM_NAME) {
    await refreshPrimaryLocation();
  }
});

// Message listener: popup can ask for manual refresh or alarm reset
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === "REFRESH_NOW") {
    refreshPrimaryLocation().then(() => sendResponse({ ok: true })).catch(e => sendResponse({ ok: false, error: e.message }));
    return true; // keep channel open for async response
  }
  if (msg.type === "RESET_ALARM") {
    setupAlarm().then(() => sendResponse({ ok: true })).catch(e => sendResponse({ ok: false, error: e.message }));
    return true;
  }
  if (msg.type === "UPDATE_ICON") {
    updateToolbarIcon(msg.temp, msg.wx).then(() => sendResponse({ ok: true }));
    return true;
  }
});
