// Taiwan Weather Chrome Extension — Popup Logic v2.2 (i18n)

// ── Constants & Storage Keys ──────────────────────────────────────────────────
const CACHE_KEY     = "weatherCache";
const LOCATIONS_KEY = "savedLocations";
const SETTINGS_KEY  = "settings";
const MAX_FAVORITES = 5;

const DEFAULT_SETTINGS = {
  apiKey: "",
  moenvApiKey: "",
  cacheTtlMinutes: 60,
  demoMode: false,
  theme: "cute-light-theme",
  lang: "auto"
};

const DEFAULT_LOCATIONS = [
  { county: "臺北市", township: "北投區", isPrimary: true }
];

// ── i18n State ────────────────────────────────────────────────────────────────
// Active UI language: "zh_TW" or "en"
let activeUILang = "zh_TW";

// Get a localized message string.
// Falls back to chrome.i18n if available, otherwise uses our own lookup table.
const I18N_STRINGS = {
  zh_TW: {
    settingsTitle: "設定", settingsAriaLabel: "設定", settingsPageTitle: "設定頁面",
    settingsClose: "關閉", settingsSave: "儲存設定", settingsSaved: "已儲存！✨",
    searchPlaceholder: "搜尋縣市或鄉鎮…", loadingText: "正在讀取天氣資料...",
    loadingDefault: "載入中", errorRetry: "重新嘗試", errorDefault: "糟糕！連線失敗了。",
    errorReadFailed: "讀取失敗，請檢查連線或 API Key。",
    errorNoLocation: "請先新增一個收藏位置。",
    errorApiKey: "未輸入 CWA API 授權碼，請在設定中填寫，或開啟「示範模式」。",
    errorInvalidApiKey: "無效的 API 授權碼，請重新檢查設定。",
    errorApiFailed: "氣象署 API 回傳失敗。",
    errorFetchFailed: "天氣資料抓取失敗。請確認 API 授權碼是否正確，或開啟示範模式。",
    cacheJustUpdated: "剛剛更新", cacheAgeBadgeDefault: "快取中",
    refreshTitle: "強制更新", refreshAria: "強制更新",
    labelApparentTemp: "體感溫度", labelHumidity: "相對濕度",
    labelRainProb: "降雨機率", labelDailyRain: "今日累積", labelHourlyRain: "時雨量",
    labelWindScale: "風力級別", labelWindScaleUnit: "級", labelWindDir: "風向",
    forecastTitle: "一週天氣預報", forecastToday: "今天", forecastTomorrow: "明天",
    forecastSun: "週日", forecastMon: "週一", forecastTue: "週二",
    forecastWed: "週三", forecastThu: "週四", forecastFri: "週五", forecastSat: "週六",
    demoBanner: "目前處於「示範模式」，請至設定輸入 API Key 以獲取即時天氣。",
    apiKeyLabel: "中央氣象署 API 授權碼", apiKeyApply: "申請授權碼",
    apiKeyPlaceholder: "請貼上 CWA-XXXXXX 授權碼",
    apiKeyShow: "顯示", apiKeyHide: "隱藏",
    moenvApiKeyLabel: "環境部 API 授權碼（空氣品質）", moenvApiKeyApply: "申請授權碼",
    moenvApiKeyPlaceholder: "請貼上環境部 API Key",
    cacheTtlLabel: "資料更新頻率",
    cacheTtl1h: "每 1 小時更新", cacheTtl3h: "每 3 小時更新",
    cacheTtl6h: "每 6 小時更新", cacheTtl12h: "每 12 小時更新",
    demoModeLabel: "示範模式 (使用模擬資料)",
    themeLabel: "選擇主題配色", themeLightBtn: "可愛粉白 (Light)", themeDarkBtn: "舒適灰藍 (Dark)",
    languageLabel: "語言", langAuto: "自動偵測", langZhTW: "繁體中文", langEn: "English",
    favStarPrimaryTitle: "目前預設", favStarTitle: "設為預設", favRemoveTitle: "移除",
    favMaxAlert: "最多只能收藏 5 個位置！", favSaved: "已收藏",
    aqiNoKeyHint: "🌿 點此設定環境部 API 金鑰以顯示空氣品質",
    aqiStationNotFound: "找不到該縣市的測站", aqiStationSuffix: "測站",
    aqiStationSimSuffix: "測站（模擬）", aqiFetchFailed: "空氣品質資料讀取失敗",
    aqiGood: "良好", aqiModerate: "普通", aqiSensitive: "對敏感族群不健康",
    aqiUnhealthy: "對所有族群不健康", aqiVeryUnhealthy: "非常不健康", aqiHazardous: "危害",
  },
  en: {
    settingsTitle: "Settings", settingsAriaLabel: "Settings", settingsPageTitle: "Settings",
    settingsClose: "Close", settingsSave: "Save Settings", settingsSaved: "Saved! ✨",
    searchPlaceholder: "Search city or township…", loadingText: "Loading weather data...",
    loadingDefault: "Loading", errorRetry: "Retry", errorDefault: "Oops! Connection failed.",
    errorReadFailed: "Failed to load. Please check your connection or API key.",
    errorNoLocation: "Please add a saved location first.",
    errorApiKey: "CWA API key not set. Please add it in Settings, or enable Demo Mode.",
    errorInvalidApiKey: "Invalid API key. Please check your settings.",
    errorApiFailed: "CWA API returned an error.",
    errorFetchFailed: "Failed to fetch weather data. Please verify your API key or enable Demo Mode.",
    cacheJustUpdated: "Just updated", cacheAgeBadgeDefault: "Cached",
    refreshTitle: "Force refresh", refreshAria: "Force refresh",
    labelApparentTemp: "Feels Like", labelHumidity: "Humidity",
    labelRainProb: "Rain Prob.", labelDailyRain: "Daily Total", labelHourlyRain: "Hourly Rain",
    labelWindScale: "Wind Scale", labelWindScaleUnit: "", labelWindDir: "Wind Direction",
    forecastTitle: "7-Day Forecast", forecastToday: "Today", forecastTomorrow: "Tomorrow",
    forecastSun: "Sun", forecastMon: "Mon", forecastTue: "Tue",
    forecastWed: "Wed", forecastThu: "Thu", forecastFri: "Fri", forecastSat: "Sat",
    demoBanner: "Demo Mode is active. Enter your API Key in Settings to get live weather.",
    apiKeyLabel: "CWA API Authorization Key", apiKeyApply: "Apply for key",
    apiKeyPlaceholder: "Paste your CWA-XXXXXX key here",
    apiKeyShow: "Show", apiKeyHide: "Hide",
    moenvApiKeyLabel: "MOENV API Key (Air Quality)", moenvApiKeyApply: "Apply for key",
    moenvApiKeyPlaceholder: "Paste your MOENV API Key here",
    cacheTtlLabel: "Update Frequency",
    cacheTtl1h: "Every 1 hour", cacheTtl3h: "Every 3 hours",
    cacheTtl6h: "Every 6 hours", cacheTtl12h: "Every 12 hours",
    demoModeLabel: "Demo Mode (use simulated data)",
    themeLabel: "Color Theme", themeLightBtn: "Cute Pink (Light)", themeDarkBtn: "Cool Grey-Blue (Dark)",
    languageLabel: "Language", langAuto: "Auto-detect", langZhTW: "繁體中文", langEn: "English",
    favStarPrimaryTitle: "Current default", favStarTitle: "Set as default", favRemoveTitle: "Remove",
    favMaxAlert: "You can only save up to 5 locations!", favSaved: "Saved",
    aqiNoKeyHint: "🌿 Click to set MOENV API key for air quality data",
    aqiStationNotFound: "No station found for this area", aqiStationSuffix: " Station",
    aqiStationSimSuffix: " Station (Demo)", aqiFetchFailed: "Failed to load air quality data",
    aqiGood: "Good", aqiModerate: "Moderate", aqiSensitive: "Unhealthy for Sensitive Groups",
    aqiUnhealthy: "Unhealthy", aqiVeryUnhealthy: "Very Unhealthy", aqiHazardous: "Hazardous",
  }
};

function t(key) {
  const strings = I18N_STRINGS[activeUILang] || I18N_STRINGS["zh_TW"];
  return strings[key] !== undefined ? strings[key] : (I18N_STRINGS["zh_TW"][key] || key);
}

// Resolve active UI language from settings
function resolveUILang(settings) {
  const pref = settings.lang || "auto";
  if (pref === "auto") {
    // Use chrome.i18n to detect browser UI language
    if (typeof chrome !== "undefined" && chrome.i18n?.getUILanguage) {
      const uiLang = chrome.i18n.getUILanguage();
      if (uiLang && uiLang.toLowerCase().startsWith("zh")) return "zh_TW";
      if (uiLang && uiLang.toLowerCase().startsWith("en")) return "en";
    }
    return "zh_TW"; // default fallback
  }
  if (pref === "en") return "en";
  return "zh_TW";
}

// Apply i18n to all DOM elements with data-i18n-* attributes
function applyI18nDOM() {
  // data-i18n="key" → sets textContent
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    el.textContent = t(key);
  });
  // data-i18n-placeholder="key" → sets placeholder
  document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
    const key = el.getAttribute("data-i18n-placeholder");
    el.placeholder = t(key);
  });
  // data-i18n-title="key" → sets title
  document.querySelectorAll("[data-i18n-title]").forEach(el => {
    const key = el.getAttribute("data-i18n-title");
    el.title = t(key);
  });
  // data-i18n-aria-label="key" → sets aria-label
  document.querySelectorAll("[data-i18n-aria-label]").forEach(el => {
    const key = el.getAttribute("data-i18n-aria-label");
    el.setAttribute("aria-label", t(key));
  });
  // Update html lang attribute
  document.documentElement.lang = activeUILang === "en" ? "en" : "zh-TW";
}

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
const langSelect         = document.getElementById("lang-select");

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
const rainItemEl         = document.getElementById("detail-rain-item");
const rainLabelEl        = document.getElementById("detail-rain-label");
const rainAmountEl       = document.getElementById("detail-rain-amount");
const windScaleEl        = document.getElementById("detail-wind-scale");
const windDirEl          = document.getElementById("detail-wind-dir");
const forecastListEl     = document.getElementById("forecast-list");
const demoModeBanner     = document.getElementById("demo-mode-banner");

// AQI DOM references
const airQualityCard     = document.getElementById("air-quality-card");
const aqiValueEl         = document.getElementById("aqi-value");
const pm25ValueEl        = document.getElementById("pm25-value");
const aqiStatusBadge     = document.getElementById("aqi-status-badge");
const aqiStationNameEl   = document.getElementById("aqi-station-name");
const aqiNoKeyHint       = document.getElementById("aqi-no-key-hint");
const moenvApiKeyInput   = document.getElementById("moenv-api-key-input");
const toggleMoenvKeyVis  = document.getElementById("toggle-moenv-key-visibility");

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
  if (mins < 1) return t("cacheJustUpdated");
  if (mins < 60) return `${mins} ${activeUILang === "en" ? "min ago" : "分鐘前"}`;
  return `${Math.floor(mins / 60)} ${activeUILang === "en" ? "hr ago" : "小時前"}`;
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

  // Weather types stored as internal type codes; translated at render time
  const weatherTypes = [
    { wx:"晴天",type:"sunny"}, {wx:"多雲時晴",type:"cloudy"}, {wx:"多雲",type:"cloudy"},
    { wx:"陰天",type:"overcast"}, {wx:"多雲短暫雨",type:"rainy"}, {wx:"陰短暫雨",type:"rainy"},
    { wx:"雷陣雨",type:"thunderstorm"}
  ];
  const windDirs = ["偏北風","偏東北風","偏東風","偏東南風","偏南風","偏西南風","偏西風","偏西北風"];

  const idx = Math.floor(rand() * weatherTypes.length);
  const wx  = weatherTypes[idx];
  const temp = Math.round(baseTemp + (rand() * 6 - 3));

  const mockRainAmount = (() => {
    if (wx.type === "thunderstorm") {
      const past1hr = rand() < 0.4
        ? parseFloat((rand() * 50 + 30).toFixed(1))
        : parseFloat((rand() * 15 + 2).toFixed(1));
      const now = parseFloat((past1hr + rand() * 30).toFixed(1));
      return { now: now.toFixed(1), past1hr: past1hr.toFixed(1) };
    }
    if (wx.type === "rainy") {
      const v = rand();
      if (v < 0.08) return { now: "微量", past1hr: "0.0" };
      const now = parseFloat((v * 25 + 1).toFixed(1));
      const past1hr = parseFloat((now * 0.15 + rand() * 2).toFixed(1));
      return { now: now.toFixed(1), past1hr: past1hr.toFixed(1) };
    }
    return { now: "0.0", past1hr: "0.0" };
  })();

  const current = {
    temp: temp.toString(),
    apparentTemp: Math.round(temp + (wx.type==="rainy"?-2:1) + (rand()*2-1)).toString(),
    humidity: Math.round(65 + rand() * 25).toString(),
    rainProb: wx.type==="rainy" ? Math.round(50+rand()*50).toString() : wx.type==="thunderstorm" ? "85" : wx.type==="cloudy" ? "20" : "0",
    rainAmount: mockRainAmount,
    windScale: String(Math.ceil(rand() * 5)),
    windDirection: windDirs[Math.floor(rand() * windDirs.length)],
    wx: wx.wx
  };

  // Forecast: store raw date strings only; day labels computed dynamically at render time
  const today = new Date();
  const forecast = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(today); d.setDate(today.getDate() + i);
    const dr = getSeedRandom(county + township + i);
    const wi = Math.floor(dr() * weatherTypes.length);
    const wo = weatherTypes[wi];
    const maxT = Math.round(baseTemp + (dr()*4+1));
    const minT = Math.round(baseTemp - (dr()*4+2));
    // Store date only; displayName is computed in renderWeather()
    forecast.push({
      date: d.toISOString().split("T")[0],
      dayOfWeek: d.getDay(), // 0=Sun,1=Mon,...,6=Sat
      dayIndex: i,
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
  if (wxText.includes("雨") || wxText.includes("落水") || wxText.includes("暴")) return "rainy";
  if (wxText.includes("雪")) return "snowy";
  if (wxText.includes("風") || wxText.includes("霧") || wxText.includes("霾") || wxText.includes("颱") || wxText.includes("颶")) return "windy";
  // Also handle English wx strings (for display, icon key detection uses original Chinese)
  if (wxText === "Sunny") return "sunny";
  if (wxText === "Partly Cloudy" || wxText === "Cloudy") return "cloudy";
  if (wxText === "Overcast") return "overcast";
  if (wxText === "Thunderstorm") return "thunderstorm";
  if (wxText === "Rainy") return "rainy";
  if (wxText === "Snowy") return "snowy";
  if (wxText === "Windy") return "windy";
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

  wxTimes.forEach((t, idx) => {
    if (!t) return;
    const startStr = t.StartTime || t.startTime || "";
    const dateKey  = startStr.includes("T") ? startStr.split("T")[0] : startStr.split(" ")[0];
    if (!dateKey) return;
    const dateObj  = new Date(dateKey + "T00:00:00");
    const dayOfWeek = dateObj.getDay(); // 0=Sun
    const hourPart = startStr.includes("T") ? parseInt(startStr.split("T")[1].slice(0,2)) : 0;
    const isDay    = hourPart >= 6 && hourPart < 18;

    if (!forecastMap[dateKey]) {
      forecastMap[dateKey] = { date:dateKey, dayOfWeek, minT:999, maxT:-999, maxPop:null, dayWx:"", nightWx:"", wx:"" };
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

  const todayDate = new Date().toISOString().split("T")[0];
  const forecast = Object.values(forecastMap).sort((a,b) => a.date.localeCompare(b.date)).slice(0,7).map((day, i) => {
    day.wx = day.dayWx || day.nightWx || "多雲";
    // dayIndex: 0=today, 1=tomorrow, 2+=day-of-week
    day.dayIndex = day.date === todayDate ? 0 : (i === 1 && Object.values(forecastMap).sort((a,b) => a.date.localeCompare(b.date))[1]?.date > todayDate ? 1 : i);
    // Recalculate dayIndex by date comparison
    const dayDiff = Math.round((new Date(day.date + "T00:00:00") - new Date(todayDate + "T00:00:00")) / 86400000);
    day.dayIndex = dayDiff;
    if (day.minT === 999)  day.minT = 20;
    if (day.maxT === -999) day.maxT = 28;
    return day;
  });

  return { current, forecast };
}

// ── Dynamic Forecast Day Label ─────────────────────────────────────────────────
// Returns localized day label based on dayIndex (0=today, 1=tomorrow, 2+=day of week)
const DAY_OF_WEEK_KEYS = ["forecastSun","forecastMon","forecastTue","forecastWed","forecastThu","forecastFri","forecastSat"];

function getForecastDayLabel(dayIndex, dayOfWeek) {
  if (dayIndex === 0) return t("forecastToday");
  if (dayIndex === 1) return t("forecastTomorrow");
  return t(DAY_OF_WEEK_KEYS[dayOfWeek]);
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
  errorMessageEl.textContent = msg || t("errorReadFailed");
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
  // Translate Wx text based on active language
  currentWxEl.textContent    = (typeof translateWx === "function")
    ? translateWx(current.wx, activeUILang)
    : current.wx;
  currentIconEl.innerHTML    = getSVGIconHtml(current.wx);
  apparentTempEl.textContent = `${current.apparentTemp}°C`;
  humidityEl.textContent     = `${current.humidity}%`;
  rainProbEl.textContent     = `${current.rainProb}%`;

  // ── Rain amount with heavy-rain alert logic ──────────────────────────────
  const rain = current.rainAmount;
  const HEAVY_RAIN_THRESHOLD = 30.0;

  function formatRainVal(v) {
    if (v === null || v === undefined) return "-- mm";
    if (v === "微量") return activeUILang === "en" ? "Trace" : "微量";
    return `${v} mm`;
  }

  if (rain && typeof rain === "object") {
    const past1hrNum = parseFloat(rain.past1hr);
    const isHeavy = !isNaN(past1hrNum) && past1hrNum >= HEAVY_RAIN_THRESHOLD;

    if (isHeavy) {
      rainLabelEl.textContent = t("labelHourlyRain");
      rainAmountEl.textContent = formatRainVal(rain.past1hr);
      rainItemEl.classList.add("heavy-rain-alert");
    } else {
      rainLabelEl.textContent = t("labelDailyRain");
      rainAmountEl.textContent = formatRainVal(rain.now);
      rainItemEl.classList.remove("heavy-rain-alert");
    }
  } else {
    rainLabelEl.textContent = t("labelDailyRain");
    rainAmountEl.textContent = "-- mm";
    rainItemEl.classList.remove("heavy-rain-alert");
  }
  // ─────────────────────────────────────────────────────────────────────────

  // Wind scale display
  if (current.windScale !== "--") {
    const unit = t("labelWindScaleUnit");
    windScaleEl.textContent = unit ? `${current.windScale} ${unit}` : `${current.windScale}`;
  } else {
    windScaleEl.textContent = "--";
  }

  // Wind direction translated
  const translatedWindDir = (typeof translateWindDir === "function")
    ? translateWindDir(current.windDirection, activeUILang)
    : current.windDirection;
  windDirEl.textContent = translatedWindDir || "--";

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
    // Translate forecast Wx
    const dayWxDisplay = (typeof translateWx === "function")
      ? translateWx(day.wx, activeUILang)
      : day.wx;
    // Compute day label dynamically
    const dayLabel = getForecastDayLabel(day.dayIndex !== undefined ? day.dayIndex : idx, day.dayOfWeek !== undefined ? day.dayOfWeek : 0);
    col.innerHTML = `
      <span class="forecast-day-label">${dayLabel}</span>
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

  // Fetch air quality data alongside weather
  const loc = savedLocations[activeLocationIdx];
  if (loc) fetchAirQuality(loc.county, loc.township);
}

// ── Air Quality (AQI & PM2.5) ─────────────────────────────────────────────────
function getAqiLevel(aqi) {
  const val = parseInt(aqi);
  if (isNaN(val)) return { className: "aqi-level-unknown", label: "--" };
  if (val <= 50)  return { className: "aqi-level-good",           label: t("aqiGood") };
  if (val <= 100) return { className: "aqi-level-moderate",       label: t("aqiModerate") };
  if (val <= 150) return { className: "aqi-level-sensitive",      label: t("aqiSensitive") };
  if (val <= 200) return { className: "aqi-level-unhealthy",      label: t("aqiUnhealthy") };
  if (val <= 300) return { className: "aqi-level-very-unhealthy", label: t("aqiVeryUnhealthy") };
  return { className: "aqi-level-hazardous", label: t("aqiHazardous") };
}

function renderAirQuality(aqi, pm25, stationName) {
  aqiNoKeyHint.classList.add("hidden");

  aqiValueEl.textContent = aqi || "--";
  pm25ValueEl.innerHTML = pm25 ? `${pm25} <small>μg/m³</small>` : `-- <small>μg/m³</small>`;
  aqiStationNameEl.textContent = stationName ? `📍 ${stationName}` : "";

  const level = getAqiLevel(aqi);
  aqiStatusBadge.className = "aqi-status-badge " + level.className;
  aqiStatusBadge.textContent = level.label;
}

function findBestStation(records, county, township) {
  const townBase = township.replace(/[區鄉鎮市村]$/g, "");
  const countyRecords = records.filter(r => (r.county || r.County) === county);
  if (countyRecords.length === 0) return null;

  const getName = r => r.sitename || r.SiteName || "";
  const exactMatch = countyRecords.find(r => getName(r) === townBase);
  if (exactMatch) return exactMatch;

  const partialMatch = countyRecords.find(r =>
    getName(r).includes(townBase) || townBase.includes(getName(r))
  );
  if (partialMatch) return partialMatch;

  return countyRecords[0];
}

function getMockAqiData(county, township) {
  const rand = getSeedRandom(county + township + "aqi");
  let baseAqi = 35;
  if (["高雄市","屏東縣","雲林縣","嘉義縣","嘉義市","臺南市"].includes(county)) baseAqi = 55;
  else if (["花蓮縣","臺東縣","宜蘭縣"].includes(county)) baseAqi = 25;
  else if (["澎湖縣","金門縣","連江縣"].includes(county)) baseAqi = 40;

  const aqi = Math.round(baseAqi + (rand() * 30 - 10));
  const pm25 = Math.round(aqi * 0.35 + rand() * 5);
  const townBase = township.replace(/[區鄉鎮市村]$/g, "");
  const simSuffix = t("aqiStationSimSuffix");
  return { aqi: String(Math.max(0, aqi)), pm25: String(Math.max(0, pm25)), stationName: `${townBase}${simSuffix}` };
}

async function fetchAirQuality(county, township) {
  if (currentSettings.demoMode) {
    const mock = getMockAqiData(county, township);
    renderAirQuality(mock.aqi, mock.pm25, mock.stationName);
    return;
  }

  const moenvKey = currentSettings.moenvApiKey?.trim();
  if (!moenvKey) {
    aqiNoKeyHint.classList.remove("hidden");
    return;
  }

  aqiNoKeyHint.classList.add("hidden");

  try {
    const url = `https://data.moenv.gov.tw/api/v2/aqx_p_432?format=json&api_key=${moenvKey}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`MOENV API error: ${res.status}`);

    const json = await res.json();
    const records = Array.isArray(json) ? json : (json.records || []);
    if (records.length === 0) throw new Error("MOENV API returned no records");

    const station = findBestStation(records, county, township);
    if (!station) {
      renderAirQuality("--", "--", t("aqiStationNotFound"));
      return;
    }

    const stationName = station.sitename || station.SiteName || "--";
    const aqiVal = station.aqi || station.AQI || "--";
    const pm25Val = station["pm2.5"] || station["PM2.5"] || "--";
    const stationSuffix = t("aqiStationSuffix");
    renderAirQuality(aqiVal, pm25Val, `${stationName}${stationSuffix}`);
  } catch (err) {
    console.warn("AQI fetch error:", err.message);
    renderAirQuality("--", "--", t("aqiFetchFailed"));
  }
}

// ── Favorites Bar ─────────────────────────────────────────────────────────────
function renderFavoritesBar() {
  favoritesBar.innerHTML = "";
  savedLocations.forEach((loc, i) => {
    const chip = document.createElement("button");
    chip.className = "fav-chip" + (i === activeLocationIdx ? " active" : "") + (loc.isPrimary ? " primary" : "");
    chip.title = formatLocationDisplay(loc.county, loc.township, activeUILang);

    const starTitle   = loc.isPrimary ? t("favStarPrimaryTitle") : t("favStarTitle");
    const removeTitle = t("favRemoveTitle");
    const chipLabel   = formatChipLabel(loc.county, loc.township, activeUILang);
    const starHtml = loc.isPrimary 
      ? `<span class="fav-star primary" title="${starTitle}">⭐</span>` 
      : `<span class="fav-star" title="${starTitle}">☆</span>`;
    chip.innerHTML = `${starHtml}<span class="fav-label">${chipLabel}</span><span class="fav-remove" data-idx="${i}" title="${removeTitle}">✕</span>`;

    chip.addEventListener("click", (e) => {
      if (e.target.classList.contains("fav-remove") || e.target.classList.contains("fav-star")) return;
      switchToLocation(i);
    });

    chip.querySelector(".fav-star").addEventListener("click", (e) => {
      e.stopPropagation();
      if (!loc.isPrimary) {
        setPrimaryLocation(i);
      }
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

function setPrimaryLocation(idx) {
  savedLocations.forEach((loc, i) => {
    loc.isPrimary = (i === idx);
  });
  activeLocationIdx = idx;
  saveFavorites(() => {
    renderFavoritesBar();
    fetchWeather();
    if (typeof chrome !== "undefined" && chrome.runtime?.sendMessage) {
      chrome.runtime.sendMessage({ type: "RESET_ALARM" });
    }
  });
}

function removeLocation(idx) {
  savedLocations.splice(idx, 1);
  const wasPrimary = !savedLocations.find(l => l.isPrimary);
  if (savedLocations.length > 0 && wasPrimary) {
    savedLocations[0].isPrimary = true;
  }
  if (activeLocationIdx >= savedLocations.length) activeLocationIdx = 0;
  saveFavorites(() => {
    renderFavoritesBar();
    if (savedLocations.length > 0) {
      fetchWeather();
      if (wasPrimary && typeof chrome !== "undefined" && chrome.runtime?.sendMessage) {
        chrome.runtime.sendMessage({ type: "RESET_ALARM" });
      }
    } else {
      showError(t("errorNoLocation"));
    }
  });
}

function addLocation(county, township) {
  if (savedLocations.length >= MAX_FAVORITES) {
    alert(t("favMaxAlert"));
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
  if (loc) locationDisplay.textContent = formatLocationDisplay(loc.county, loc.township, activeUILang);
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

  // Use unified bilingual search from i18n_data.js
  const results = (typeof searchGeoData === "function")
    ? searchGeoData(q)
    : (() => {
        // Fallback: Chinese-only search
        const r = [];
        CITY_COUNTY_DATA.forEach(city => {
          const countyMatch = city.cityName.includes(q);
          city.townships.forEach(town => {
            if (countyMatch || town.includes(q)) {
              r.push({ county: city.cityName, township: town });
            }
          });
        });
        return r;
      })();

  if (results.length === 0) {
    const noResultMsg = activeUILang === "en"
      ? `No results found for "${q}"`
      : `找不到「${q}」的相關地點`;
    searchResults.innerHTML = `<div class="search-no-result">${noResultMsg}</div>`;
  } else {
    searchResults.innerHTML = "";
    results.slice(0, 8).forEach(r => {
      const item = document.createElement("div");
      item.className = "search-result-item";
      const alreadySaved = savedLocations.some(l => l.county === r.county && l.township === r.township);
      const countyDisplay   = activeUILang === "en" ? (typeof getCountyNameEn === "function" ? getCountyNameEn(r.county) : r.county) : r.county;
      const townshipDisplay = activeUILang === "en" ? (typeof getTownshipNameEn === "function" ? getTownshipNameEn(r.county, r.township) : r.township) : r.township;
      item.innerHTML = `
        <span class="result-county">${countyDisplay}</span>
        <span class="result-township">${townshipDisplay}</span>
        ${alreadySaved ? `<span class="result-saved">${t("favSaved")}</span>` : ''}
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

// ── Open-Meteo PoP Supplement ────────────────────────────────────────────────
async function fetchOpenMeteoPoP(lat, lon) {
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
    console.warn("[Popup] Open-Meteo fetch failed:", err.message);
    return null;
  }
}

async function supplementMissingPoP(forecast, county, township) {
  const missingIdx = forecast.map((d, i) => i).filter(i => forecast[i].maxPop === null);
  if (missingIdx.length === 0) return;

  const coords = TOWNSHIP_COORDS[`${county}_${township}`];
  if (!coords) {
    console.warn(`[Popup] No coords for ${county} ${township}, skipping Open-Meteo.`);
    return;
  }

  const omData = await fetchOpenMeteoPoP(coords.lat, coords.lon);
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

// ── Fetch Current Rain Amount from CWA O-A0002-001 ─────────────────────────
async function fetchRainAmount(county, township, apiKey) {
  try {
    const url = `https://opendata.cwa.gov.tw/api/v1/rest/datastore/O-A0002-001?Authorization=${apiKey}&format=JSON`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Rain API error: ${res.status}`);
    const json = await res.json();

    const stations = json?.records?.Station;
    if (!Array.isArray(stations) || stations.length === 0) throw new Error("No rain station records");

    const countyStations = stations.filter(s => (s.GeoInfo?.CountyName || "") === county);
    const pool = countyStations.length > 0 ? countyStations : stations;

    const coordsKey = `${county}_${township}`;
    const targetCoords = TOWNSHIP_COORDS[coordsKey];

    let bestStation = null;

    if (targetCoords) {
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
        const dist = (lat - targetCoords.lat) ** 2 + (lon - targetCoords.lon) ** 2;
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
    console.warn("[Popup] fetchRainAmount failed:", err.message);
    return null;
  }
}

// ── Fetch Weather (cache-first) ───────────────────────────────────────────────
async function fetchWeather(force = false) {
  if (savedLocations.length === 0) { showError(t("errorNoLocation")); return; }

  const loc = savedLocations[activeLocationIdx];
  if (!loc) return;

  updateLocationLabel();
  showLoading(true);

  // Demo mode: use mock data
  if (currentSettings.demoMode) {
    demoModeBanner.classList.remove("hidden");
    setTimeout(() => {
      try { renderWeather(getMockWeatherData(loc.county, loc.township), false, t("cacheJustUpdated")); }
      catch (e) { showError(t("errorFetchFailed")); }
    }, 350);
    return;
  }

  demoModeBanner.classList.add("hidden");

  if (!currentSettings.apiKey?.trim()) {
    showError(t("errorApiKey"));
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
      if (res.status === 401) throw new Error(t("errorInvalidApiKey"));
      throw new Error(`${activeUILang === "en" ? "Connection error, status:" : "連線錯誤，狀態碼:"} ${res.status}`);
    }

    const json = await res.json();
    if (json.success !== "true" || !json.records) throw new Error(t("errorApiFailed"));

    const parsedData = parseCWAWeatherData(json, loc.township);
    const [_, rainAmount] = await Promise.all([
      supplementMissingPoP(parsedData.forecast, loc.county, loc.township),
      fetchRainAmount(loc.county, loc.township, currentSettings.apiKey)
    ]);
    parsedData.current.rainAmount = rainAmount;
    await writeToCache(loc.county, loc.township, parsedData);
    renderWeather(parsedData, false, t("cacheJustUpdated"));
  } catch (err) {
    console.error("CWA API Error:", err);
    const cacheEntry = await readFromCache(loc.county, loc.township);
    if (cacheEntry?.data) {
      const age = getCacheAge(cacheEntry);
      renderWeather(cacheEntry.data, true, `⚠ ${activeUILang === "en" ? "Cache" : "快取"}(${age})`);
    } else {
      showError(err.message || t("errorFetchFailed"));
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
  const moenvKey   = moenvApiKeyInput.value.trim();
  const demo       = demoModeSwitch.checked;
  const ttl        = parseInt(cacheTtlSelect.value) || 60;
  const newLang    = langSelect.value;

  const langChanged = newLang !== currentSettings.lang;

  currentSettings.apiKey           = key;
  currentSettings.moenvApiKey      = moenvKey;
  currentSettings.demoMode         = demo;
  currentSettings.cacheTtlMinutes  = ttl;
  currentSettings.lang             = newLang;

  storage.set({ [SETTINGS_KEY]: currentSettings }, () => {
    // If language changed, re-resolve and re-apply UI
    if (langChanged) {
      activeUILang = resolveUILang(currentSettings);
      applyI18nDOM();
    }

    const origText = settingsSaveBtn.textContent;
    settingsSaveBtn.textContent = t("settingsSaved");
    settingsSaveBtn.style.backgroundColor = "var(--accent-secondary)";
    setTimeout(() => {
      settingsSaveBtn.textContent = t("settingsSave");
      settingsSaveBtn.style.backgroundColor = "";
      settingsOverlay.classList.add("hidden");
      if (typeof chrome !== "undefined" && chrome.runtime?.sendMessage) {
        chrome.runtime.sendMessage({ type: "RESET_ALARM" });
      }
      // Re-render with new language
      renderFavoritesBar();
      updateLocationLabel();
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

  // Settings open
  settingsToggleBtn.addEventListener("click", () => {
    apiKeyInput.value  = currentSettings.apiKey;
    moenvApiKeyInput.value = currentSettings.moenvApiKey || "";
    demoModeSwitch.checked = currentSettings.demoMode;
    cacheTtlSelect.value = String(currentSettings.cacheTtlMinutes || 60);
    langSelect.value = currentSettings.lang || "auto";
    settingsOverlay.classList.remove("hidden");
  });
  settingsCloseBtn.addEventListener("click", () => settingsOverlay.classList.add("hidden"));
  settingsOverlay.addEventListener("click", e => { if (e.target === settingsOverlay) settingsOverlay.classList.add("hidden"); });
  settingsSaveBtn.addEventListener("click", saveSettings);

  // API key visibility
  toggleKeyVisibility.addEventListener("click", () => {
    const isPass = apiKeyInput.type === "password";
    apiKeyInput.type = isPass ? "text" : "password";
    toggleKeyVisibility.textContent = isPass ? t("apiKeyHide") : t("apiKeyShow");
  });

  // MOENV API key visibility
  toggleMoenvKeyVis.addEventListener("click", () => {
    const isPass = moenvApiKeyInput.type === "password";
    moenvApiKeyInput.type = isPass ? "text" : "password";
    toggleMoenvKeyVis.textContent = isPass ? t("apiKeyHide") : t("apiKeyShow");
  });

  // AQI no-key hint: open settings
  aqiNoKeyHint.addEventListener("click", () => {
    apiKeyInput.value  = currentSettings.apiKey;
    moenvApiKeyInput.value = currentSettings.moenvApiKey || "";
    demoModeSwitch.checked = currentSettings.demoMode;
    cacheTtlSelect.value = String(currentSettings.cacheTtlMinutes || 60);
    langSelect.value = currentSettings.lang || "auto";
    settingsOverlay.classList.remove("hidden");
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

      const primaryIdx = savedLocations.findIndex(l => l.isPrimary);
      activeLocationIdx = primaryIdx !== -1 ? primaryIdx : 0;

      // Resolve language first, then apply i18n to DOM
      activeUILang = resolveUILang(currentSettings);
      applyI18nDOM();

      applyTheme(currentSettings.theme || "cute-light-theme");
      renderFavoritesBar();
      fetchWeather();
    }
  );
}

document.addEventListener("DOMContentLoaded", init);
