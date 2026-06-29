// background.js — Taiwan Weather Chrome Extension Service Worker
// Handles: periodic cache refresh, toolbar icon temperature display

// Import shared data (includes CITY_COUNTY_DATA and TOWNSHIP_COORDS)
try { importScripts('city_county_data.js'); } catch(e) { console.warn('[BG] importScripts failed:', e.message); }
// Import shared weather calculation & fetch helpers (also used by popup.js)
try { importScripts('weather_utils.js'); } catch(e) { console.warn('[BG] importScripts weather_utils failed:', e.message); }

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

// calculateApparentTemp, windDegreeToCardinal are defined in weather_utils.js

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

// fetchRainAmount, fetchRealTimeObservation, fetchOpenMeteoPoP, supplementMissingPoP,
// parseCWAForecastData are all defined in weather_utils.js

async function fetchAndCacheWeather(county, township, apiKey) {
  const datasetId = COUNTY_DATASET_MAP[county];
  if (!datasetId) throw new Error(`Unknown county: ${county}`);

  const coords = (typeof TOWNSHIP_COORDS !== 'undefined') ? TOWNSHIP_COORDS[`${county}_${township}`] : null;

  const url = `${CWA_API_BASE}/${datasetId}?Authorization=${apiKey}&locationName=${encodeURIComponent(township)}`;
  const [res, rainAmount, realTimeObs, hourlyRain] = await Promise.all([
    fetch(url),
    fetchRainAmount(county, township, apiKey, coords),
    fetchRealTimeObservation(county, township, apiKey, coords),
    coords ? fetchOpenMeteoHourlyRain(coords.lat, coords.lon) : Promise.resolve(null)
  ]);
  if (!res.ok) throw new Error(`API error: ${res.status}`);

  const json = await res.json();
  if (json.success !== "true" || !json.records) throw new Error("API returned failure");

  const { current, forecast } = parseCWAForecastData(json, township);
  current.rainAmount = rainAmount;

  if (realTimeObs) {
    if (realTimeObs.temp !== null) current.temp = realTimeObs.temp;
    if (realTimeObs.humidity !== null) current.humidity = realTimeObs.humidity;
    if (realTimeObs.windSpeed !== null) current.windSpeed = String(realTimeObs.windSpeed);
    if (realTimeObs.windGust !== null) current.windGust = String(realTimeObs.windGust);
    if (realTimeObs.windDirection !== null) current.windDirection = realTimeObs.windDirection;
    if (realTimeObs.wx !== null) current.wx = realTimeObs.wx;
    if (realTimeObs.temp !== null && realTimeObs.humidity !== null && realTimeObs.windSpeed !== null) {
      const at = calculateApparentTemp(realTimeObs.temp, realTimeObs.humidity, realTimeObs.windSpeed);
      if (at !== null) current.apparentTemp = String(at);
    }
  }

  await supplementMissingPoP(forecast, county, township, coords);
  const data = { current, forecast, hourlyRain };
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

  await chrome.alarms.clear(ALARM_NAME);
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
    fetchOpenMeteoPoP(msg.lat, msg.lon)
      .then(data => sendResponse({ ok: true, data }))
      .catch(err => sendResponse({ ok: false, error: err.message }));
    return true;
  }
  if (msg.type === "FETCH_OPEN_METEO_HOURLY_RAIN") {
    fetchOpenMeteoHourlyRain(msg.lat, msg.lon)
      .then(data => sendResponse({ ok: true, data }))
      .catch(err => sendResponse({ ok: false, error: err.message }));
    return true;
  }
});
