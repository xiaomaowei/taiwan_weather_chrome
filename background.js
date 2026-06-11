// background.js — Taiwan Weather Chrome Extension Service Worker
// Handles: periodic cache refresh, toolbar icon temperature display

// Import shared data (includes CITY_COUNTY_DATA and TOWNSHIP_COORDS)
try { importScripts('city_county_data.js'); } catch(e) { console.warn('[BG] importScripts failed:', e.message); }

const CWA_API_BASE = "https://opendata.cwa.gov.tw/api/v1/rest/datastore";
const ALARM_NAME = "weatherRefresh";
const CACHE_KEY = "weatherCache";
const LOCATIONS_KEY = "savedLocations";
const SETTINGS_KEY = "settings";

const DEFAULT_SETTINGS = {
  apiKey: "",
  moenvApiKey: "",
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

async function fetchRainAmountBG(county, township, apiKey) {
  try {
    const url = `${CWA_API_BASE}/O-A0002-001?Authorization=${apiKey}&format=JSON`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Rain API error: ${res.status}`);
    const json = await res.json();

    const stations = json?.records?.Station;
    if (!Array.isArray(stations) || stations.length === 0) throw new Error("No rain station records");

    const countyStations = stations.filter(s => (s.GeoInfo?.CountyName || "") === county);
    const pool = countyStations.length > 0 ? countyStations : stations;

    const coordsKey = `${county}_${township}`;
    const coords = (typeof TOWNSHIP_COORDS !== 'undefined') ? TOWNSHIP_COORDS[coordsKey] : null;

    let bestStation = null;

    if (coords) {
      let minDist = Infinity;
      pool.forEach(s => {
        const coordArr = s.GeoInfo?.Coordinates;
        if (!coordArr) return;
        const wgs = Array.isArray(coordArr)
          ? coordArr.find(c => (c.CoordinateName || "").includes("WGS84")) || coordArr[0]
          : coordArr;
        const lat = parseFloat(wgs?.StationLatitude);
        const lon = parseFloat(wgs?.StationLongitude);
        if (isNaN(lat) || isNaN(lon)) return;
        const dist = (lat - coords.lat) ** 2 + (lon - coords.lon) ** 2;
        if (dist < minDist) { minDist = dist; bestStation = s; }
      });
    } else {
      const townBase = township.replace(/[區鄉鎮市村]$/g, "");
      bestStation = pool.find(s => (s.GeoInfo?.TownName || "").includes(townBase)) || pool[0];
    }

    if (!bestStation) return null;

    function parseRaw(raw) {
      if (raw === undefined || raw === null || raw === -99 || raw === "-99" || raw === "X" || raw === "x") return "0.0";
      if (raw === -98 || raw === "-98") return "0.0";
      if (raw === "T" || raw === "t") return "微量";
      const val = parseFloat(raw);
      if (isNaN(val) || val < 0) return "0.0";
      return (Math.round(val * 10) / 10).toFixed(1);
    }

    const nowRaw    = bestStation.RainfallElement?.Now?.Precipitation;
    const past1Raw  = bestStation.RainfallElement?.Past1hr?.Precipitation;

    return {
      now:     parseRaw(nowRaw),
      past1hr: parseRaw(past1Raw)
    };
  } catch (err) {
    console.warn("[BG] fetchRainAmountBG failed:", err.message);
    return null;
  }
}

async function fetchAndCacheWeather(county, township, apiKey) {
  const datasetId = COUNTY_DATASET_MAP[county];
  if (!datasetId) throw new Error(`Unknown county: ${county}`);

  const url = `${CWA_API_BASE}/${datasetId}?Authorization=${apiKey}&locationName=${encodeURIComponent(township)}`;
  const [res, rainAmount] = await Promise.all([
    fetch(url),
    fetchRainAmountBG(county, township, apiKey)
  ]);
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
    wx:            getVal(wxT,    "Weather")                || "多雲",
    rainAmount:    rainAmount
  };

  // Build 7-day forecast
  const wxTimes   = getTimes(elMap["天氣現象"]);
  const maxTTimes = getTimes(elMap["最高溫度"]);
  const minTTimes = getTimes(elMap["最低溫度"]);
  const popTimes  = getTimes(elMap["12小時降雨機率"]);
  const forecastMap = {};
  const todayDate = new Date().toISOString().split("T")[0];

  wxTimes.forEach((t, idx) => {
    const startStr = t.StartTime || t.startTime || "";
    const dateKey  = startStr.includes("T") ? startStr.split("T")[0] : startStr.split(" ")[0];
    if (!dateKey) return;
    const dateObj = new Date(dateKey + "T00:00:00");
    const dayOfWeek = dateObj.getDay(); // 0=Sun, 1=Mon, ... 6=Sat
    const hourPart = startStr.includes("T") ? parseInt(startStr.split("T")[1].slice(0,2)) : 0;
    const isDay = hourPart >= 6 && hourPart < 18;

    if (!forecastMap[dateKey]) {
      // Store dayOfWeek (number) instead of Chinese string — popup.js localizes at render time
      forecastMap[dateKey] = { date: dateKey, dayOfWeek, minT: 999, maxT: -999, maxPop: null, dayWx: "", nightWx: "", wx: "" };
    }
    const wxVal = getVal(t, "Weather") || "";
    if (isDay) forecastMap[dateKey].dayWx = wxVal; else forecastMap[dateKey].nightWx = wxVal;

    const maxTVal = parseInt(getVal(maxTTimes[idx], "MaxTemperature") || "NaN");
    if (!isNaN(maxTVal) && maxTVal > forecastMap[dateKey].maxT) forecastMap[dateKey].maxT = maxTVal;
    const minTVal = parseInt(getVal(minTTimes[idx], "MinTemperature") || "NaN");
    if (!isNaN(minTVal) && minTVal < forecastMap[dateKey].minT) forecastMap[dateKey].minT = minTVal;
    
    if (popTimes && popTimes[idx]) {
      const popVal  = parseInt(getVal(popTimes[idx],  "ProbabilityOfPrecipitation") || "NaN");
      if (!isNaN(popVal)) {
        if (forecastMap[dateKey].maxPop === null || popVal > forecastMap[dateKey].maxPop) {
          forecastMap[dateKey].maxPop = popVal;
        }
      }
    }
  });

  const forecast = Object.values(forecastMap)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 7)
    .map((day) => {
      day.wx = day.dayWx || day.nightWx || "多雲";
      // dayIndex: computed from date diff — popup.js uses this for localized day label
      const dayDiff = Math.round((new Date(day.date + "T00:00:00") - new Date(todayDate + "T00:00:00")) / 86400000);
      day.dayIndex = dayDiff;
      // Do NOT store displayName here — popup.js localizes based on dayIndex + dayOfWeek
      if (day.minT === 999)  day.minT = 20;
      if (day.maxT === -999) day.maxT = 28;
      return day;
    });

  await supplementMissingPoPBG(forecast, county, township);
  const data = { current, forecast };
  await setCacheEntry(`${county}_${township}`, data);
  return data;
}

// ── Open-Meteo PoP Supplement (mirrors popup.js logic) ────────────────────
async function fetchOpenMeteoPoPBG(lat, lon) {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
                `&daily=precipitation_probability_max&timezone=Asia%2FTaipei&forecast_days=7`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Open-Meteo error: ${res.status}`);
    const json = await res.json();
    const dates = json?.daily?.time;
    const pops  = json?.daily?.precipitation_probability_max;
    if (!dates || !pops || dates.length !== pops.length) return null;
    return dates.map((date, i) => ({ date, pop: pops[i] }));
  } catch (err) {
    console.warn("[BG] Open-Meteo fetch failed:", err.message);
    return null;
  }
}

async function supplementMissingPoPBG(forecast, county, township) {
  const missingIdx = forecast.map((d, i) => i).filter(i => forecast[i].maxPop === null);
  if (missingIdx.length === 0) return;

  // TOWNSHIP_COORDS is available via importScripts; fall back gracefully if not
  const coords = (typeof TOWNSHIP_COORDS !== 'undefined')
    ? TOWNSHIP_COORDS[`${county}_${township}`]
    : null;
  if (!coords) {
    console.warn(`[BG] No coords for ${county} ${township}`);
    return;
  }

  const omData = await fetchOpenMeteoPoPBG(coords.lat, coords.lon);
  if (!omData) return;

  const omMap = {};
  omData.forEach(({ date, pop }) => { omMap[date] = pop; });

  missingIdx.forEach(i => {
    const day = forecast[i];
    if (day.maxPop === null && omMap[day.date] !== undefined) {
      day.maxPop = omMap[day.date];
      day.popSource = "open-meteo";
    }
  });
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

    // Temperature number (no degree symbol to maximize font size and legibility)
    const tempStr = temp !== "--" ? `${temp}` : "--";
    ctx.fillStyle = textColor;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Dynamically adjust font size to make text as large as possible
    let fontSize = 84;
    if (tempStr.length === 1) {
      fontSize = 96;
    } else if (tempStr.length === 2) {
      fontSize = 88;
    } else if (tempStr.length >= 3) {
      fontSize = 64;
    }
    ctx.font = `bold ${fontSize}px "Segoe UI", Arial, sans-serif`;
    ctx.fillText(tempStr, size / 2, size / 2 + (fontSize * 0.05));

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
  if (msg.type === "FETCH_OPEN_METEO_POP") {
    fetchOpenMeteoPoPBG(msg.lat, msg.lon)
      .then(data => sendResponse({ ok: true, data }))
      .catch(err => sendResponse({ ok: false, error: err.message }));
    return true;
  }
});
