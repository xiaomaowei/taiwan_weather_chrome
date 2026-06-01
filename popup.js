// Taiwan Weather Chrome Extension — Popup Logic v2

// ── Constants & Storage Keys ──────────────────────────────────────────────────
const CACHE_KEY     = "weatherCache";
const LOCATIONS_KEY = "savedLocations";
const SETTINGS_KEY  = "settings";
const MAX_FAVORITES = 5;

const DEFAULT_SETTINGS = {
  apiKey: "CWA-3E823709-E043-4F98-AC95-A1A2986B328F",
  cacheTtlMinutes: 60,
  demoMode: false,
  theme: "cute-light-theme"
};

const DEFAULT_LOCATIONS = [
  { county: "臺北市", township: "北投區", isPrimary: true }
];

// ── State ─────────────────────────────────────────────────────────────────────
let currentSettings  = { ...DEFAULT_SETTINGS };
let savedLocations   = [...DEFAULT_LOCATIONS];
let activeLocationIdx = 0; // index in savedLocations being displayed

// ── DOM References ────────────────────────────────────────────────────────────
const favoritesBar       = document.getElementById("favorites-bar");
const settingsToggleBtn  = document.getElementById("settings-toggle-btn");
const settingsOverlay    = document.getElementById("settings-overlay");
const settingsCloseBtn   = document.getElementById("settings-close-btn");
const settingsSaveBtn    = document.getElementById("settings-save-btn");
const apiKeyInput        = document.getElementById("api-key-input");
const toggleKeyVisibility= document.getElementById("toggle-key-visibility");
const demoModeSwitch     = document.getElementById("demo-mode-switch");
const cacheTtlSelect     = document.getElementById("cache-ttl-select");
const themeBtnLight      = document.getElementById("theme-btn-light");
const themeBtnDark       = document.getElementById("theme-btn-dark");

const loadingPanel       = document.getElementById("loading-panel");
const errorPanel         = document.getElementById("error-panel");
const weatherContent     = document.getElementById("weather-content");
const errorRetryBtn      = document.getElementById("error-retry-btn");
const errorMessageEl     = document.getElementById("error-message");

const locationDisplay    = document.getElementById("location-display");
const cacheAgeContainer  = document.getElementById("cache-age-container");
const cacheAgeBadge      = document.getElementById("cache-age-badge");
const refreshBtn         = document.getElementById("refresh-btn");

const currentTempEl      = document.getElementById("current-temp");
const currentWxEl        = document.getElementById("current-wx");
const currentIconEl      = document.getElementById("current-icon");
const apparentTempEl     = document.getElementById("detail-apparent-temp");
const humidityEl         = document.getElementById("detail-humidity");
const rainProbEl         = document.getElementById("detail-rain-prob");
const windScaleEl        = document.getElementById("detail-wind-scale");
const windDirEl          = document.getElementById("detail-wind-dir");
const forecastListEl     = document.getElementById("forecast-list");
const demoModeBanner     = document.getElementById("demo-mode-banner");

const locationSearchPanel = document.getElementById("location-search-panel");
const locationSearchInput = document.getElementById("location-search-input");
const searchResults       = document.getElementById("search-results");

// ── Storage Helpers ────────────────────────────────────────────────────────────
const storage = {
  get: (keys, cb) => {
    if (typeof chrome !== "undefined" && chrome.storage?.local) {
      chrome.storage.local.get(keys, cb);
    } else {
      const result = {};
      Object.keys(keys).forEach(k => {
        const v = localStorage.getItem(k);
        result[k] = v !== null ? JSON.parse(v) : keys[k];
      });
      cb(result);
    }
  },
  set: (items, cb) => {
    if (typeof chrome !== "undefined" && chrome.storage?.local) {
      chrome.storage.local.set(items, cb);
    } else {
      Object.keys(items).forEach(k => localStorage.setItem(k, JSON.stringify(items[k])));
      if (cb) cb();
    }
  }
};

// ── Cache Helpers ──────────────────────────────────────────────────────────────
function makeCacheKey(county, township) { return `${county}_${township}`; }

function isCacheValid(entry) {
  if (!entry || !entry.fetchedAt) return false;
  const ttlMs = (currentSettings.cacheTtlMinutes || 60) * 60 * 1000;
  return Date.now() - entry.fetchedAt < ttlMs;
}

function getCacheAge(entry) {
  if (!entry?.fetchedAt) return "";
  const mins = Math.floor((Date.now() - entry.fetchedAt) / 60000);
  if (mins < 1) return "剛剛更新";
  if (mins < 60) return `${mins} 分鐘前`;
  return `${Math.floor(mins / 60)} 小時前`;
}

async function readFromCache(county, township) {
  return new Promise(resolve => {
    storage.get({ [CACHE_KEY]: {} }, result => {
      const cache = result[CACHE_KEY];
      resolve(cache[makeCacheKey(county, township)] || null);
    });
  });
}

async function writeToCache(county, township, data) {
  return new Promise(resolve => {
    storage.get({ [CACHE_KEY]: {} }, result => {
      const cache = result[CACHE_KEY];
      cache[makeCacheKey(county, township)] = { fetchedAt: Date.now(), data };
      storage.set({ [CACHE_KEY]: cache }, resolve);
    });
  });
}

// ── Mock Data (Demo Mode) ──────────────────────────────────────────────────────
function getSeedRandom(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return function() { hash = Math.sin(hash) * 10000; return hash - Math.floor(hash); };
}

function getMockWeatherData(county, township) {
  const rand = getSeedRandom(county + township);
  let baseTemp = 24;
  if (["臺北市","新北市","基隆市","宜蘭縣"].includes(county)) baseTemp = 21;
  else if (["高雄市","屏東縣","臺南市","雲林縣"].includes(county)) baseTemp = 27;
  else if (["連江縣","金門縣","澎湖縣"].includes(county)) baseTemp = 18;
  if (/阿里山|和平|信義|仁愛|那瑪夏|茂林|桃源|大同|南澳/.test(township)) baseTemp -= 8;

  const weatherTypes = [
    { wx:"晴天",type:"sunny"}, {wx:"多雲時晴",type:"cloudy"}, {wx:"多雲",type:"cloudy"},
    { wx:"陰天",type:"overcast"}, {wx:"多雲短暫雨",type:"rainy"}, {wx:"陰短暫雨",type:"rainy"},
    { wx:"雷陣雨",type:"thunderstorm"}
  ];
  const windDirs = ["偏北風","偏東北風","偏東風","偏東南風","偏南風","偏西南風","偏西風","偏西北風"];

  const idx = Math.floor(rand() * weatherTypes.length);
  const wx  = weatherTypes[idx];
  const temp = Math.round(baseTemp + (rand() * 6 - 3));

  const current = {
    temp: temp.toString(),
    apparentTemp: Math.round(temp + (wx.type==="rainy"?-2:1) + (rand()*2-1)).toString(),
    humidity: Math.round(65 + rand() * 25).toString(),
    rainProb: wx.type==="rainy" ? Math.round(50+rand()*50).toString() : wx.type==="thunderstorm" ? "85" : wx.type==="cloudy" ? "20" : "0",
    windScale: String(Math.ceil(rand() * 5)),
    windDirection: windDirs[Math.floor(rand() * windDirs.length)],
    wx: wx.wx
  };

  const daysOfWeek = ["週日","週一","週二","週三","週四","週五","週六"];
  const today = new Date();
  const forecast = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(today); d.setDate(today.getDate() + i);
    const dr = getSeedRandom(county + township + i);
    const wi = Math.floor(dr() * weatherTypes.length);
    const wo = weatherTypes[wi];
    const maxT = Math.round(baseTemp + (dr()*4+1));
    const minT = Math.round(baseTemp - (dr()*4+2));
    forecast.push({
      date: d.toISOString().split("T")[0],
      dayName: daysOfWeek[d.getDay()],
      displayName: i===0?"今天": i===1?"明天": daysOfWeek[d.getDay()],
      minT, maxT, wx: wo.wx,
      rainProb: wo.type==="rainy"?Math.round(50+dr()*50): wo.type==="thunderstorm"?80: wo.type==="cloudy"?20:0
    });
  }
  return { current, forecast };
}

// ── Weather Icons ─────────────────────────────────────────────────────────────
function getWeatherIconKey(wxText) {
  if (!wxText) return "cloudy";
  if (wxText.includes("晴") && !wxText.includes("雨") && !wxText.includes("雲")) return "sunny";
  if (wxText.includes("晴") && wxText.includes("雲")) return "cloudy";
  if (wxText.includes("多雲") && !wxText.includes("雨")) return "cloudy";
  if (wxText.includes("陰") && !wxText.includes("雨")) return "overcast";
  if (wxText.includes("雷")) return "thunderstorm";
  if (wxText.includes("雨") || wxText.includes("落水")) return "rainy";
  if (wxText.includes("雪")) return "snowy";
  if (wxText.includes("風") || wxText.includes("霧") || wxText.includes("霾")) return "windy";
  return "cloudy";
}

const WEATHER_SVGS = {
  sunny: `
    <svg class="animated-icon sun" viewBox="0 0 100 100">
      <line x1="50" y1="8" x2="50" y2="18" stroke="var(--border-color)" stroke-width="4.5" stroke-linecap="round" />
      <line x1="50" y1="82" x2="50" y2="92" stroke="var(--border-color)" stroke-width="4.5" stroke-linecap="round" />
      <line x1="8" y1="50" x2="18" y2="50" stroke="var(--border-color)" stroke-width="4.5" stroke-linecap="round" />
      <line x1="82" y1="50" x2="92" y2="50" stroke="var(--border-color)" stroke-width="4.5" stroke-linecap="round" />
      <line x1="20" y1="20" x2="27" y2="27" stroke="var(--border-color)" stroke-width="4.5" stroke-linecap="round" />
      <line x1="73" y1="73" x2="80" y2="80" stroke="var(--border-color)" stroke-width="4.5" stroke-linecap="round" />
      <line x1="80" y1="20" x2="73" y2="27" stroke="var(--border-color)" stroke-width="4.5" stroke-linecap="round" />
      <line x1="27" y1="73" x2="20" y2="80" stroke="var(--border-color)" stroke-width="4.5" stroke-linecap="round" />
      <circle cx="50" cy="50" r="23" fill="var(--accent-secondary)" stroke="var(--border-color)" stroke-width="4" />
      <circle cx="42" cy="46" r="2.5" fill="var(--border-color)" />
      <circle cx="58" cy="46" r="2.5" fill="var(--border-color)" />
      <circle cx="35" cy="52" r="3.5" fill="#ffaab3" opacity="0.85" />
      <circle cx="65" cy="52" r="3.5" fill="#ffaab3" opacity="0.85" />
      <path d="M45 54 Q50 59 55 54" stroke="var(--border-color)" stroke-width="3" fill="none" stroke-linecap="round" />
    </svg>`,
  cloudy: `
    <svg class="animated-icon cloud-bounce" viewBox="0 0 100 100">
      <circle cx="64" cy="36" r="16" fill="var(--accent-secondary)" stroke="var(--border-color)" stroke-width="3.5" />
      <line x1="64" y1="12" x2="64" y2="16" stroke="var(--border-color)" stroke-width="3.5" stroke-linecap="round" />
      <line x1="81" y1="19" x2="78" y2="22" stroke="var(--border-color)" stroke-width="3.5" stroke-linecap="round" />
      <line x1="88" y1="36" x2="84" y2="36" stroke="var(--border-color)" stroke-width="3.5" stroke-linecap="round" />
      <path fill="#ffffff" stroke="var(--border-color)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"
        d="M 26 64 c -6 0 -11 -5 -11 -11 c 0 -5 3 -9 8 -10 c 1 -6 6 -10 12 -10 c 4 0 8 2 10 5 c 3 -6 9 -10 16 -10 c 9 0 16 7 16 16 c 0 1 0 2 0 3 c 4 1 7 5 7 10 c 0 6 -5 12 -11 12 Z" />
      <circle cx="40" cy="50" r="2.5" fill="var(--border-color)" />
      <circle cx="54" cy="50" r="2.5" fill="var(--border-color)" />
      <circle cx="34" cy="55" r="3" fill="#ffaab3" opacity="0.8" />
      <circle cx="60" cy="55" r="3" fill="#ffaab3" opacity="0.8" />
      <path d="M 43 56 Q 47 59 51 56" stroke="var(--border-color)" stroke-width="2.5" fill="none" stroke-linecap="round" />
    </svg>`,
  overcast: `
    <svg class="animated-icon cloud-bounce" viewBox="0 0 100 100">
      <path fill="var(--accent-blue)" stroke="var(--border-color)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"
        d="M 28 62 c -6 0 -11 -5 -11 -11 c 0 -5 3 -9 8 -10 c 1 -6 6 -10 12 -10 c 4 0 8 2 10 5 c 3 -6 9 -10 16 -10 c 9 0 16 7 16 16 c 0 1 0 2 0 3 c 4 1 7 5 7 10 c 0 6 -5 12 -11 12 Z" />
      <circle cx="42" cy="48" r="2.5" fill="var(--border-color)" />
      <circle cx="56" cy="48" r="2.5" fill="var(--border-color)" />
      <circle cx="36" cy="53" r="3.5" fill="#ffaab3" opacity="0.85" />
      <circle cx="62" cy="53" r="3.5" fill="#ffaab3" opacity="0.85" />
      <path d="M 45 54 Q 49 57 53 54" stroke="var(--border-color)" stroke-width="2.5" fill="none" stroke-linecap="round" />
    </svg>`,
  rainy: `
    <svg class="animated-icon rain-fall" viewBox="0 0 100 100">
      <path fill="#b3c5d7" stroke="var(--border-color)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"
        d="M 28 58 c -6 0 -11 -5 -11 -11 c 0 -5 3 -9 8 -10 c 1 -6 6 -10 12 -10 c 4 0 8 2 10 5 c 3 -6 9 -10 16 -10 c 9 0 16 7 16 16 c 0 1 0 2 0 3 c 4 1 7 5 7 10 c 0 6 -5 12 -11 12 Z" />
      <circle cx="42" cy="44" r="2.5" fill="var(--border-color)" />
      <circle cx="56" cy="44" r="2.5" fill="var(--border-color)" />
      <path d="M 46 49 Q 49 52 52 49" stroke="var(--border-color)" stroke-width="2.5" fill="none" stroke-linecap="round" />
      <g class="rain-drops">
        <path class="rain-drop" d="M28 66 v8" stroke="var(--accent-blue)" stroke-width="3" stroke-linecap="round" style="animation-delay: 0s" />
        <path class="rain-drop" d="M42 66 v8" stroke="var(--accent-blue)" stroke-width="3" stroke-linecap="round" style="animation-delay: 0.3s" />
        <path class="rain-drop" d="M56 66 v8" stroke="var(--accent-blue)" stroke-width="3" stroke-linecap="round" style="animation-delay: 0.6s" />
        <path class="rain-drop" d="M70 66 v8" stroke="var(--accent-blue)" stroke-width="3" stroke-linecap="round" style="animation-delay: 0.15s" />
      </g>
    </svg>`,
  thunderstorm: `
    <svg class="animated-icon rain-fall" viewBox="0 0 100 100">
      <path fill="#8e9bb0" stroke="var(--border-color)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"
        d="M 28 58 c -6 0 -11 -5 -11 -11 c 0 -5 3 -9 8 -10 c 1 -6 6 -10 12 -10 c 4 0 8 2 10 5 c 3 -6 9 -10 16 -10 c 9 0 16 7 16 16 c 0 1 0 2 0 3 c 4 1 7 5 7 10 c 0 6 -5 12 -11 12 Z" />
      <circle cx="41" cy="43" r="2.5" fill="var(--border-color)" />
      <circle cx="57" cy="43" r="2.5" fill="var(--border-color)" />
      <circle cx="49" cy="49" r="3.5" fill="var(--border-color)" />
      <polygon points="46,58 37,73 45,73 42,88 56,69 47,69" fill="var(--accent-secondary)" stroke="var(--border-color)" stroke-width="2" stroke-linejoin="round" />
      <g class="rain-drops">
        <path class="rain-drop" d="M25 66 v8" stroke="var(--accent-blue)" stroke-width="3" stroke-linecap="round" style="animation-delay: 0.1s" />
        <path class="rain-drop" d="M62 66 v8" stroke="var(--accent-blue)" stroke-width="3" stroke-linecap="round" style="animation-delay: 0.4s" />
        <path class="rain-drop" d="M72 66 v8" stroke="var(--accent-blue)" stroke-width="3" stroke-linecap="round" style="animation-delay: 0.7s" />
      </g>
    </svg>`,
  snowy: `
    <svg class="animated-icon cloud-bounce" viewBox="0 0 100 100">
      <path fill="#f4f8fb" stroke="var(--border-color)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"
        d="M 28 58 c -6 0 -11 -5 -11 -11 c 0 -5 3 -9 8 -10 c 1 -6 6 -10 12 -10 c 4 0 8 2 10 5 c 3 -6 9 -10 16 -10 c 9 0 16 7 16 16 c 0 1 0 2 0 3 c 4 1 7 5 7 10 c 0 6 -5 12 -11 12 Z" />
      <path d="M 39 43 Q 42 39 45 43" stroke="var(--border-color)" stroke-width="2.5" fill="none" stroke-linecap="round" />
      <path d="M 53 43 Q 56 39 59 43" stroke="var(--border-color)" stroke-width="2.5" fill="none" stroke-linecap="round" />
      <path d="M 46 48 Q 49 51 52 48" stroke="var(--border-color)" stroke-width="2" fill="none" stroke-linecap="round" />
      <circle cx="28" cy="70" r="3.5" fill="#ffffff" stroke="var(--border-color)" stroke-width="1.5" />
      <circle cx="48" cy="73" r="3.5" fill="#ffffff" stroke="var(--border-color)" stroke-width="1.5" />
      <circle cx="68" cy="69" r="3.5" fill="#ffffff" stroke="var(--border-color)" stroke-width="1.5" />
    </svg>`,
  windy: `
    <svg class="animated-icon cloud-bounce" viewBox="0 0 100 100">
      <path d="M15 36 Q38 24 60 36 T90 32" fill="none" stroke="var(--border-color)" stroke-width="4.5" stroke-linecap="round" />
      <path d="M28 48 Q50 60 72 48 T95 52" fill="none" stroke="var(--border-color)" stroke-width="4.5" stroke-linecap="round" />
      <path d="M10 62 Q32 50 54 62 T78 57" fill="none" stroke="var(--border-color)" stroke-width="4.5" stroke-linecap="round" />
      <path d="M85 27 A5 5 0 1 1 80 32" fill="none" stroke="var(--border-color)" stroke-width="4" stroke-linecap="round" />
      <path d="M90 47 A4 4 0 1 0 86 51" fill="none" stroke="var(--border-color)" stroke-width="4" stroke-linecap="round" />
    </svg>`
};

function getSVGIconHtml(wxText) {
  return WEATHER_SVGS[getWeatherIconKey(wxText)] || WEATHER_SVGS.cloudy;
}

// ── CWA API Parser ─────────────────────────────────────────────────────────────
function getElVal(elementValue, ...keyNames) {
  if (!elementValue || !elementValue[0]) return null;
  const obj = elementValue[0];
  for (const key of keyNames) { if (obj[key] !== undefined) return obj[key]; }
  return Object.values(obj)[0] ?? null;
}

function parseCWAWeatherData(data, townshipName) {
  const records = data?.records;
  if (!records) throw new Error("氣象署 API 回傳格式錯誤：找不到 records 欄位。");

  const locsArray = records.Locations || records.locations;
  if (!locsArray || !Array.isArray(locsArray) || locsArray.length === 0) {
    throw new Error("氣象署 API 回傳格式錯誤：Locations 欄位為空或非陣列。");
  }

  const firstLoc = locsArray[0];
  if (!firstLoc) {
    throw new Error("氣象署 API 回傳格式錯誤：Locations[0] 為空。");
  }

  const locationList = firstLoc.Location || firstLoc.location;
  if (!locationList || !Array.isArray(locationList) || locationList.length === 0) {
    throw new Error("氣象署 API 回傳格式錯誤：找不到任何鄉鎮資料。");
  }

  const townData = locationList.find(loc =>
    (loc?.LocationName || loc?.locationName) === townshipName
  );
  if (!townData) {
    throw new Error(`在 API 回傳中找不到「${townshipName}」的資料。`);
  }

  const elements = townData.WeatherElement || townData.weatherElement;
  if (!elements || !Array.isArray(elements)) {
    throw new Error(`在「${townshipName}」的天氣資料中找不到 WeatherElement 欄位。`);
  }

  const elMap = {};
  elements.forEach(el => {
    if (el) {
      const name = el.ElementName || el.elementName;
      if (name) elMap[name] = el;
    }
  });

  const getTimes = el => el ? (el.Time || el.time || []) : [];
  const getTV    = (ts, ...keys) => {
    if (!ts) return null;
    const ev = ts.ElementValue || ts.elementValue;
    return getElVal(ev, ...keys);
  };

  const wxTimes    = getTimes(elMap["天氣現象"]);
  const tempTimes  = getTimes(elMap["平均溫度"]);
  const maxTTimes  = getTimes(elMap["最高溫度"]);
  const minTTimes  = getTimes(elMap["最低溫度"]);
  const rhTimes    = getTimes(elMap["平均相對濕度"]);
  const maxATTimes = getTimes(elMap["最高體感溫度"]);
  const minATTimes = getTimes(elMap["最低體感溫度"]);
  const popTimes   = getTimes(elMap["12小時降雨機率"]);
  const windTimes  = getTimes(elMap["風速"]);
  const windDTimes = getTimes(elMap["風向"]);

  if (!wxTimes.length || !tempTimes.length) {
    throw new Error("氣象署 API 回傳的時間序列資料（天氣現象或平均溫度）為空。");
  }

  const current = {
    temp:          getTV(tempTimes[0],  "Temperature",             "value") || "--",
    apparentTemp:  getTV(maxATTimes[0], "MaxApparentTemperature",  "value") || getTV(minATTimes[0], "MinApparentTemperature", "value") || "--",
    humidity:      getTV(rhTimes[0],    "RelativeHumidity",        "value") || "--",
    rainProb:      getTV(popTimes[0],   "ProbabilityOfPrecipitation","value") || "0",
    windScale:     getTV(windTimes[0],  "BeaufortScale",           "value") || "--",
    windDirection: getTV(windDTimes[0], "WindDirection",           "value") || "--",
    wx:            getTV(wxTimes[0],    "Weather",                 "value") || "多雲"
  };

  const forecastMap = {};
  const daysOfWeek = ["週日","週一","週二","週三","週四","週五","週六"];

  wxTimes.forEach((t, idx) => {
    if (!t) return;
    const startStr = t.StartTime || t.startTime || "";
    const dateKey  = startStr.includes("T") ? startStr.split("T")[0] : startStr.split(" ")[0];
    if (!dateKey) return;
    const dateObj  = new Date(dateKey + "T00:00:00");
    const dayName  = daysOfWeek[dateObj.getDay()];
    const hourPart = startStr.includes("T") ? parseInt(startStr.split("T")[1].slice(0,2)) : 0;
    const isDay    = hourPart >= 6 && hourPart < 18;

    if (!forecastMap[dateKey]) {
      forecastMap[dateKey] = { date:dateKey, dayName, minT:999, maxT:-999, maxPop:null, dayWx:"", nightWx:"", wx:"" };
    }
    const wxVal = getTV(t, "Weather", "value") || "";
    if (isDay) forecastMap[dateKey].dayWx = wxVal; else forecastMap[dateKey].nightWx = wxVal;

    const maxTVal = parseInt(getTV(maxTTimes[idx], "MaxTemperature", "value") || "NaN");
    if (!isNaN(maxTVal) && maxTVal > forecastMap[dateKey].maxT) forecastMap[dateKey].maxT = maxTVal;
    const minTVal = parseInt(getTV(minTTimes[idx], "MinTemperature", "value") || "NaN");
    if (!isNaN(minTVal) && minTVal < forecastMap[dateKey].minT) forecastMap[dateKey].minT = minTVal;
    
    if (popTimes && popTimes[idx]) {
      const popVal  = parseInt(getTV(popTimes[idx],  "ProbabilityOfPrecipitation", "value") || "NaN");
      if (!isNaN(popVal)) {
        if (forecastMap[dateKey].maxPop === null || popVal > forecastMap[dateKey].maxPop) {
          forecastMap[dateKey].maxPop = popVal;
        }
      }
    }
    const tempVal = parseInt(getTV(tempTimes[idx], "Temperature", "value") || "NaN");
    if (!isNaN(tempVal)) {
      if (forecastMap[dateKey].maxT === -999) forecastMap[dateKey].maxT = tempVal;
      if (forecastMap[dateKey].minT === 999)  forecastMap[dateKey].minT = tempVal;
    }
  });

  const forecast = Object.values(forecastMap).sort((a,b) => a.date.localeCompare(b.date)).slice(0,7).map((day,i) => {
    day.wx          = day.dayWx || day.nightWx || "多雲";
    day.displayName = i===0?"今天":i===1?"明天":day.dayName;
    if (day.minT === 999)  day.minT = 20;
    if (day.maxT === -999) day.maxT = 28;
    return day;
  });

  return { current, forecast };
}

// ── UI State Helpers ──────────────────────────────────────────────────────────
function showLoading(on) {
  loadingPanel.classList.toggle("hidden", !on);
  if (on) { weatherContent.classList.add("hidden"); errorPanel.classList.add("hidden"); }
}

function showError(msg) {
  loadingPanel.classList.add("hidden");
  weatherContent.classList.add("hidden");
  errorPanel.classList.remove("hidden");
  errorMessageEl.textContent = msg || "讀取失敗，請檢查連線或 API Key。";
}

function showWeatherContent() {
  loadingPanel.classList.add("hidden");
  errorPanel.classList.add("hidden");
  weatherContent.classList.remove("hidden");
}

// ── Render Weather Data ────────────────────────────────────────────────────────
function renderWeather(weatherData, fromCache = false, cacheAge = "") {
  const { current, forecast } = weatherData;

  currentTempEl.textContent  = `${current.temp}°`;
  currentWxEl.textContent    = current.wx;
  currentIconEl.innerHTML    = getSVGIconHtml(current.wx);
  apparentTempEl.textContent = `${current.apparentTemp}°C`;
  humidityEl.textContent     = `${current.humidity}%`;
  rainProbEl.textContent     = `${current.rainProb}%`;
  windScaleEl.textContent    = current.windScale !== "--" ? `${current.windScale} 級` : "--";
  windDirEl.textContent      = current.windDirection || "--";

  if (cacheAge) {
    cacheAgeBadge.textContent = cacheAge;
    cacheAgeContainer.classList.remove("hidden");
  } else {
    cacheAgeContainer.classList.add("hidden");
  }

  // 7-column forecast grid
  forecastListEl.innerHTML = "";
  forecast.forEach((day, idx) => {
    const col = document.createElement("div");
    col.className = "forecast-col" + (idx === 0 ? " today" : "");
    const hasPop = day.rainProb !== undefined ? true : (day.maxPop !== null && day.maxPop !== undefined);
    const popVal = day.rainProb !== undefined ? day.rainProb : day.maxPop;
    const rainProbStr = hasPop ? `💧${popVal}%` : `💧--`;
    col.innerHTML = `
      <span class="forecast-day-label">${day.displayName}</span>
      <span class="forecast-col-icon">${getSVGIconHtml(day.wx)}</span>
      <span class="forecast-temp-max">${day.maxT}°</span>
      <span class="forecast-temp-min">${day.minT}°</span>
      <span class="forecast-pop">${rainProbStr}</span>
    `;
    forecastListEl.appendChild(col);
  });

  showWeatherContent();

  // Tell background to update the toolbar icon
  if (typeof chrome !== "undefined" && chrome.runtime?.sendMessage) {
    chrome.runtime.sendMessage({ type: "UPDATE_ICON", temp: current.temp, wx: current.wx });
  }
}

// ── Favorites Bar ─────────────────────────────────────────────────────────────
function renderFavoritesBar() {
  favoritesBar.innerHTML = "";
  savedLocations.forEach((loc, i) => {
    const chip = document.createElement("button");
    chip.className = "fav-chip" + (i === activeLocationIdx ? " active" : "") + (loc.isPrimary ? " primary" : "");
    chip.title = `${loc.county} ${loc.township}`;

    // Label: show township name (short), star for primary
    const label = loc.isPrimary ? `⭐ ${loc.township}` : loc.township;
    chip.innerHTML = `<span class="fav-label">${label}</span><span class="fav-remove" data-idx="${i}" title="移除">✕</span>`;

    chip.addEventListener("click", (e) => {
      if (e.target.classList.contains("fav-remove")) return;
      switchToLocation(i);
    });

    chip.querySelector(".fav-remove").addEventListener("click", (e) => {
      e.stopPropagation();
      removeLocation(i);
    });

    favoritesBar.appendChild(chip);
  });
}

function switchToLocation(idx) {
  activeLocationIdx = idx;
  renderFavoritesBar();
  fetchWeather();
}

function removeLocation(idx) {
  savedLocations.splice(idx, 1);
  // Ensure one primary exists
  if (savedLocations.length > 0 && !savedLocations.find(l => l.isPrimary)) {
    savedLocations[0].isPrimary = true;
  }
  if (activeLocationIdx >= savedLocations.length) activeLocationIdx = 0;
  saveFavorites(() => {
    renderFavoritesBar();
    if (savedLocations.length > 0) fetchWeather();
    else showError("請先新增一個收藏位置。");
  });
}

function addLocation(county, township) {
  if (savedLocations.length >= MAX_FAVORITES) {
    alert(`最多只能收藏 ${MAX_FAVORITES} 個位置！`);
    return;
  }
  const exists = savedLocations.findIndex(l => l.county === county && l.township === township);
  if (exists !== -1) {
    switchToLocation(exists);
    return;
  }
  const newLoc = { county, township, isPrimary: savedLocations.length === 0 };
  savedLocations.push(newLoc);
  activeLocationIdx = savedLocations.length - 1;
  saveFavorites(() => {
    renderFavoritesBar();
    fetchWeather();
    // Tell background to refresh alarm for new primary if needed
    if (typeof chrome !== "undefined" && chrome.runtime?.sendMessage) {
      chrome.runtime.sendMessage({ type: "RESET_ALARM" });
    }
  });
}

function saveFavorites(cb) {
  storage.set({ [LOCATIONS_KEY]: savedLocations }, cb);
}

// Update location label above weather card
function updateLocationLabel() {
  if (savedLocations.length === 0) { locationDisplay.textContent = "--"; return; }
  const loc = savedLocations[activeLocationIdx];
  if (loc) locationDisplay.textContent = `${loc.county} ${loc.township}`;
}

// ── Search Panel ──────────────────────────────────────────────────────────────
let searchDebounceTimer = null;

function closeSearchPanel() {
  locationSearchInput.value = "";
  searchResults.classList.add("hidden");
}

function performSearch(query) {
  const q = query.trim();
  if (q.length === 0) { searchResults.classList.add("hidden"); return; }

  const results = [];
  CITY_COUNTY_DATA.forEach(city => {
    const countyMatch = city.cityName.includes(q);
    city.townships.forEach(town => {
      if (countyMatch || town.includes(q)) {
        results.push({ county: city.cityName, township: town });
      }
    });
  });

  if (results.length === 0) {
    searchResults.innerHTML = `<div class="search-no-result">找不到「${q}」的相關地點</div>`;
  } else {
    searchResults.innerHTML = "";
    results.slice(0, 8).forEach(r => {
      const item = document.createElement("div");
      item.className = "search-result-item";
      const alreadySaved = savedLocations.some(l => l.county === r.county && l.township === r.township);
      item.innerHTML = `
        <span class="result-county">${r.county}</span>
        <span class="result-township">${r.township}</span>
        ${alreadySaved ? '<span class="result-saved">已收藏</span>' : ''}
      `;
      item.addEventListener("click", () => {
        addLocation(r.county, r.township);
        closeSearchPanel();
      });
      searchResults.appendChild(item);
    });
  }
  searchResults.classList.remove("hidden");
}

// ── Fetch Weather (cache-first) ───────────────────────────────────────────────
async function fetchWeather(force = false) {
  if (savedLocations.length === 0) { showError("請先新增一個收藏位置。"); return; }

  const loc = savedLocations[activeLocationIdx];
  if (!loc) return;

  updateLocationLabel();
  showLoading(true);

  // Demo mode: use mock data
  if (currentSettings.demoMode) {
    demoModeBanner.classList.remove("hidden");
    setTimeout(() => {
      try { renderWeather(getMockWeatherData(loc.county, loc.township), false, "剛剛更新"); }
      catch (e) { showError("模擬資料生成失敗。"); }
    }, 350);
    return;
  }

  demoModeBanner.classList.add("hidden");

  if (!currentSettings.apiKey?.trim()) {
    showError("未輸入 CWA API 授權碼，請在設定中填寫，或開啟「示範模式」。");
    return;
  }

  // Try cache first
  if (!force) {
    const cacheEntry = await readFromCache(loc.county, loc.township);
    if (cacheEntry && isCacheValid(cacheEntry)) {
      const age = getCacheAge(cacheEntry);
      renderWeather(cacheEntry.data, true, age);
      return;
    }
  }

  // Cache miss / expired: fetch from API
  try {
    const cityInfo = CITY_COUNTY_DATA.find(c => c.cityName === loc.county);
    if (!cityInfo) throw new Error(`不支援該縣市：${loc.county}`);

    const url = `https://opendata.cwa.gov.tw/api/v1/rest/datastore/${cityInfo.datasetId}?Authorization=${currentSettings.apiKey}&locationName=${encodeURIComponent(loc.township)}`;
    const res = await fetch(url);
    if (!res.ok) {
      if (res.status === 401) throw new Error("無效的 API 授權碼，請重新檢查設定。");
      throw new Error(`連線錯誤，狀態碼: ${res.status}`);
    }

    const json = await res.json();
    if (json.success !== "true" || !json.records) throw new Error("氣象署 API 回傳失敗。");

    const parsedData = parseCWAWeatherData(json, loc.township);
    await writeToCache(loc.county, loc.township, parsedData);
    renderWeather(parsedData, false, "剛剛更新");
  } catch (err) {
    console.error("CWA API Error:", err);
    // If cache exists but stale, still show it with a warning
    const cacheEntry = await readFromCache(loc.county, loc.township);
    if (cacheEntry?.data) {
      const age = getCacheAge(cacheEntry);
      renderWeather(cacheEntry.data, true, `⚠ 快取(${age})`);
    } else {
      showError(err.message || "天氣資料抓取失敗。請確認 API 授權碼是否正確，或開啟示範模式。");
    }
  }
}

// ── Settings ──────────────────────────────────────────────────────────────────
function applyTheme(themeClass) {
  document.body.className = themeClass;
  themeBtnLight.classList.toggle("active", themeClass === "cute-light-theme");
  themeBtnDark.classList.toggle("active", themeClass === "cute-dark-theme");
}

function saveSettings() {
  const key        = apiKeyInput.value.trim();
  const demo       = demoModeSwitch.checked;
  const ttl        = parseInt(cacheTtlSelect.value) || 60;

  currentSettings.apiKey           = key;
  currentSettings.demoMode         = demo;
  currentSettings.cacheTtlMinutes  = ttl;

  storage.set({ [SETTINGS_KEY]: currentSettings }, () => {
    const orig = settingsSaveBtn.textContent;
    settingsSaveBtn.textContent = "已儲存！✨";
    settingsSaveBtn.style.backgroundColor = "var(--accent-secondary)";
    setTimeout(() => {
      settingsSaveBtn.textContent = orig;
      settingsSaveBtn.style.backgroundColor = "";
      settingsOverlay.classList.add("hidden");
      // Reset alarm interval in background
      if (typeof chrome !== "undefined" && chrome.runtime?.sendMessage) {
        chrome.runtime.sendMessage({ type: "RESET_ALARM" });
      }
      fetchWeather();
    }, 800);
  });
}

// ── Event Bindings ────────────────────────────────────────────────────────────
function bindEvents() {
  // Search panel
  locationSearchInput.addEventListener("input", () => {
    clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(() => performSearch(locationSearchInput.value), 150);
  });

  // Refresh button
  refreshBtn.addEventListener("click", async () => {
    if (refreshBtn.classList.contains("spinning")) return;
    refreshBtn.classList.add("spinning");
    try {
      await fetchWeather(true);
    } catch (e) {
      console.error(e);
    } finally {
      setTimeout(() => {
        refreshBtn.classList.remove("spinning");
      }, 500);
    }
  });

  // Settings
  settingsToggleBtn.addEventListener("click", () => {
    apiKeyInput.value  = currentSettings.apiKey;
    demoModeSwitch.checked = currentSettings.demoMode;
    cacheTtlSelect.value = String(currentSettings.cacheTtlMinutes || 60);
    settingsOverlay.classList.remove("hidden");
  });
  settingsCloseBtn.addEventListener("click", () => settingsOverlay.classList.add("hidden"));
  settingsOverlay.addEventListener("click", e => { if (e.target === settingsOverlay) settingsOverlay.classList.add("hidden"); });
  settingsSaveBtn.addEventListener("click", saveSettings);

  // API key visibility
  toggleKeyVisibility.addEventListener("click", () => {
    const isPass = apiKeyInput.type === "password";
    apiKeyInput.type = isPass ? "text" : "password";
    toggleKeyVisibility.textContent = isPass ? "隱藏" : "顯示";
  });

  // Theme
  themeBtnLight.addEventListener("click", () => {
    currentSettings.theme = "cute-light-theme";
    applyTheme("cute-light-theme");
    storage.set({ [SETTINGS_KEY]: currentSettings });
  });
  themeBtnDark.addEventListener("click", () => {
    currentSettings.theme = "cute-dark-theme";
    applyTheme("cute-dark-theme");
    storage.set({ [SETTINGS_KEY]: currentSettings });
  });

  // Error retry
  errorRetryBtn.addEventListener("click", fetchWeather);
}

// ── Initialization ────────────────────────────────────────────────────────────
function init() {
  bindEvents();

  storage.get(
    { [SETTINGS_KEY]: DEFAULT_SETTINGS, [LOCATIONS_KEY]: DEFAULT_LOCATIONS },
    result => {
      currentSettings = { ...DEFAULT_SETTINGS, ...(result[SETTINGS_KEY] || {}) };
      savedLocations  = result[LOCATIONS_KEY]?.length ? result[LOCATIONS_KEY] : [...DEFAULT_LOCATIONS];

      applyTheme(currentSettings.theme || "cute-light-theme");
      renderFavoritesBar();
      fetchWeather();
    }
  );
}

document.addEventListener("DOMContentLoaded", init);
