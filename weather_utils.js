// weather_utils.js — Shared weather calculation & CWA/Open-Meteo fetch helpers
// Loaded by both background.js (via importScripts) and popup.js (via <script>).
// No chrome.* or DOM access here so it works in both the service worker and popup contexts.

const CWA_API_BASE = "https://opendata.cwa.gov.tw/api/v1/rest/datastore";

// ── Apparent temperature (heat index approximation used by CWA) ────────────────
function calculateApparentTemp(temp, rh, windSpeed) {
  const t = parseFloat(temp);
  const h = parseFloat(rh);
  const ws = parseFloat(windSpeed);
  if (isNaN(t) || isNaN(h) || isNaN(ws)) return null;
  const e = (h / 100) * 6.105 * Math.exp((17.27 * t) / (237.7 + t));
  const at = t + 0.33 * e - 0.7 * ws - 4.0;
  return Math.round(at);
}

// ── Wind degree → 16-point cardinal direction (Traditional Chinese) ────────────
function windDegreeToCardinal(deg) {
  const d = parseFloat(deg);
  if (isNaN(d) || d < 0) return "--";
  const index = Math.round(d / 22.5) % 16;
  const directions = [
    "北風", "偏東北風", "東北風", "偏東北風",
    "東風", "偏東南風", "東南風", "偏東南風",
    "南風", "偏西南風", "西南風", "偏西南風",
    "西風", "偏西北風", "西北風", "偏西北風"
  ];
  return directions[index] || "--";
}

// ── Pull a value out of a CWA ElementValue array, trying keys in order ─────────
function extractElementValue(elementValue, ...keys) {
  if (!elementValue || !elementValue[0]) return null;
  const obj = elementValue[0];
  for (const key of keys) { if (obj[key] !== undefined) return obj[key]; }
  const vals = Object.values(obj);
  return vals.length > 0 ? vals[0] : null;
}

// ── Find the closest CWA station to a township (by coords, fallback to name match) ─
function findNearestStation(stations, township, coords) {
  const countyOrAllPool = stations;
  let bestStation = null;

  if (coords) {
    let minDist = Infinity;
    countyOrAllPool.forEach(s => {
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
    bestStation = countyOrAllPool.find(s => (s.GeoInfo?.TownName || "").includes(townBase)) || countyOrAllPool[0];
  }

  return bestStation || null;
}

function filterStationsByCounty(stations, county) {
  const countyStations = stations.filter(s => (s.GeoInfo?.CountyName || "") === county);
  return countyStations.length > 0 ? countyStations : stations;
}

// ── Raw rainfall value → display string ("0.0" / "微量" / "12.3") ──────────────
function parseRainfallValue(raw) {
  if (raw === undefined || raw === null || raw === -99 || raw === "-99" || raw === "X" || raw === "x") return "0.0";
  if (raw === -98 || raw === "-98") return "0.0";
  if (raw === "T" || raw === "t") return "微量";
  const val = parseFloat(raw);
  if (isNaN(val) || val < 0) return "0.0";
  return (Math.round(val * 10) / 10).toFixed(1);
}

// ── Raw observation value → number, filtering CWA's "no data" sentinels ────────
function parseObservationValue(val) {
  if (val === undefined || val === null) return null;
  const fVal = parseFloat(val);
  if (isNaN(fVal)) return null;
  if (fVal === -99 || fVal === -999 || fVal === -9900.0) return null;
  return fVal;
}

// ── Fetch current rainfall (O-A0002-001) for the nearest station ───────────────
async function fetchRainAmount(county, township, apiKey, coords) {
  try {
    const url = `${CWA_API_BASE}/O-A0002-001?Authorization=${apiKey}&format=JSON`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Rain API error: ${res.status}`);
    const json = await res.json();

    const stations = json?.records?.Station;
    if (!Array.isArray(stations) || stations.length === 0) throw new Error("No rain station records");

    const pool = filterStationsByCounty(stations, county);
    const bestStation = findNearestStation(pool, township, coords);
    if (!bestStation) return null;

    const nowRaw   = bestStation.RainfallElement?.Now?.Precipitation;
    const past1Raw = bestStation.RainfallElement?.Past1hr?.Precipitation;

    return {
      now:     parseRainfallValue(nowRaw),
      past1hr: parseRainfallValue(past1Raw)
    };
  } catch (err) {
    console.warn("[weather_utils] fetchRainAmount failed:", err.message);
    return null;
  }
}

// ── Fetch current observation (O-A0003-001) for the nearest station ────────────
async function fetchRealTimeObservation(county, township, apiKey, coords) {
  try {
    const url = `${CWA_API_BASE}/O-A0003-001?Authorization=${apiKey}&format=JSON`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Observation API error: ${res.status}`);
    const json = await res.json();

    const stations = json?.records?.Station || json?.records?.location;
    if (!Array.isArray(stations) || stations.length === 0) throw new Error("No weather station records");

    const pool = filterStationsByCounty(stations, county);
    const bestStation = findNearestStation(pool, township, coords);
    if (!bestStation) return null;

    const weatherEl = bestStation.WeatherElement;
    if (!weatherEl) return null;

    const temp = parseObservationValue(weatherEl.AirTemperature);
    const rh = parseObservationValue(weatherEl.RelativeHumidity);
    const windSpeed = parseObservationValue(weatherEl.WindSpeed);
    const windGust = parseObservationValue(weatherEl.GustInfo?.PeakGustSpeed);
    const windDirDeg = parseObservationValue(weatherEl.WindDirection);
    const wx = weatherEl.Weather || null;

    return {
      temp: temp !== null ? String(Math.round(temp)) : null,
      humidity: rh !== null ? String(Math.round(rh)) : null,
      windSpeed: windSpeed,
      windGust: windGust,
      windDirection: windDirDeg !== null ? windDegreeToCardinal(windDirDeg) : null,
      wx: (wx && wx !== "-99" && wx !== "-999" && wx !== "X" && wx !== "x") ? wx : null
    };
  } catch (err) {
    console.warn("[weather_utils] fetchRealTimeObservation failed:", err.message);
    return null;
  }
}

// ── Open-Meteo daily PoP (used to fill gaps past CWA's 3-day window) ───────────
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
    console.warn("[weather_utils] fetchOpenMeteoPoP failed:", err.message);
    return null;
  }
}

// ── Open-Meteo hourly precipitation (past + forecast) for the rain-trend strip ─
// Returns an array of { time: "YYYY-MM-DDTHH:00" (Asia/Taipei), precip: mm } or null.
// past_days=1 gives the actual (reanalysis) hours behind us; forecast_days=2 the ahead ones.
async function fetchOpenMeteoHourlyRain(lat, lon) {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
                `&hourly=precipitation&timezone=Asia%2FTaipei&past_days=1&forecast_days=2`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Open-Meteo hourly error: ${res.status}`);
    const json = await res.json();
    const times = json?.hourly?.time;
    const precs = json?.hourly?.precipitation;
    if (!Array.isArray(times) || !Array.isArray(precs) || times.length !== precs.length) return null;
    return times.map((time, i) => ({ time, precip: precs[i] }));
  } catch (err) {
    console.warn("[weather_utils] fetchOpenMeteoHourlyRain failed:", err.message);
    return null;
  }
}

// ── Fill in days with missing PoP using Open-Meteo, given a fetcher fn ─────────
// fetchPoPFn lets callers swap in a message-passing wrapper (e.g. popup → background)
// while still sharing the rest of this logic; defaults to the direct fetch above.
async function supplementMissingPoP(forecast, county, township, coords, fetchPoPFn = fetchOpenMeteoPoP) {
  const missingIdx = forecast.map((d, i) => i).filter(i => forecast[i].maxPop === null);
  if (missingIdx.length === 0) return;

  if (!coords) {
    console.warn(`[weather_utils] No coords for ${county} ${township}, skipping Open-Meteo.`);
    return;
  }

  const omData = await fetchPoPFn(coords.lat, coords.lon);
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

// ── Parse CWA F-D0047-xxx forecast payload into { current, forecast[] } ────────
// `current` here excludes rainAmount/realTimeObs merging — callers layer those on.
function parseCWAForecastData(json, township) {
  const records = json?.records;
  if (!records) throw new Error("氣象署 API 回傳格式錯誤：找不到 records 欄位。");

  const locsArray = records.Locations || records.locations;
  if (!locsArray || !Array.isArray(locsArray) || locsArray.length === 0) {
    throw new Error("氣象署 API 回傳格式錯誤：Locations 欄位為空或非陣列。");
  }

  const firstLoc = locsArray[0];
  if (!firstLoc) throw new Error("氣象署 API 回傳格式錯誤：Locations[0] 為空。");

  const locationList = firstLoc.Location || firstLoc.location;
  if (!locationList || !Array.isArray(locationList) || locationList.length === 0) {
    throw new Error("氣象署 API 回傳格式錯誤：找不到任何鄉鎮資料。");
  }

  const townData = locationList.find(loc =>
    (loc?.LocationName || loc?.locationName) === township
  );
  if (!townData) throw new Error(`在 API 回傳中找不到「${township}」的資料。`);

  const elements = townData.WeatherElement || townData.weatherElement;
  if (!elements || !Array.isArray(elements)) {
    throw new Error(`在「${township}」的天氣資料中找不到 WeatherElement 欄位。`);
  }

  const elMap = {};
  elements.forEach(el => {
    if (el) {
      const name = el.ElementName || el.elementName;
      if (name) elMap[name] = el;
    }
  });

  const getTimes = el => el ? (el.Time || el.time || []) : [];
  const getTV = (ts, ...keys) => {
    if (!ts) return null;
    return extractElementValue(ts.ElementValue || ts.elementValue, ...keys);
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
    temp:          getTV(tempTimes[0],  "Temperature",              "value") || "--",
    apparentTemp:  getTV(maxATTimes[0], "MaxApparentTemperature",   "value") || getTV(minATTimes[0], "MinApparentTemperature", "value") || "--",
    humidity:      getTV(rhTimes[0],    "RelativeHumidity",         "value") || "--",
    rainProb:      getTV(popTimes[0],   "ProbabilityOfPrecipitation","value") || "0",
    windSpeed:     getTV(windTimes[0],  "WindSpeed",                "value") || "--",
    windGust:      "--",
    windDirection: getTV(windDTimes[0], "WindDirection",            "value") || "--",
    wx:            getTV(wxTimes[0],    "Weather",                  "value") || "多雲"
  };

  const forecastMap = {};

  wxTimes.forEach((t, idx) => {
    if (!t) return;
    const startStr = t.StartTime || t.startTime || "";
    const dateKey  = startStr.includes("T") ? startStr.split("T")[0] : startStr.split(" ")[0];
    if (!dateKey) return;
    const dateObj   = new Date(dateKey + "T00:00:00");
    const dayOfWeek = dateObj.getDay(); // 0=Sun
    const hourPart  = startStr.includes("T") ? parseInt(startStr.split("T")[1].slice(0, 2)) : 0;
    const isDay     = hourPart >= 6 && hourPart < 18;

    if (!forecastMap[dateKey]) {
      forecastMap[dateKey] = { date: dateKey, dayOfWeek, minT: 999, maxT: -999, maxPop: null, dayWx: "", nightWx: "", wx: "" };
    }
    const wxVal = getTV(t, "Weather", "value") || "";
    if (isDay) forecastMap[dateKey].dayWx = wxVal; else forecastMap[dateKey].nightWx = wxVal;

    const maxTVal = parseInt(getTV(maxTTimes[idx], "MaxTemperature", "value") || "NaN");
    if (!isNaN(maxTVal) && maxTVal > forecastMap[dateKey].maxT) forecastMap[dateKey].maxT = maxTVal;
    const minTVal = parseInt(getTV(minTTimes[idx], "MinTemperature", "value") || "NaN");
    if (!isNaN(minTVal) && minTVal < forecastMap[dateKey].minT) forecastMap[dateKey].minT = minTVal;

    if (popTimes && popTimes[idx]) {
      const popVal = parseInt(getTV(popTimes[idx], "ProbabilityOfPrecipitation", "value") || "NaN");
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
  const forecast = Object.values(forecastMap)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 7)
    .map((day) => {
      day.wx = day.dayWx || day.nightWx || "多雲";
      const dayDiff = Math.round((new Date(day.date + "T00:00:00") - new Date(todayDate + "T00:00:00")) / 86400000);
      day.dayIndex = dayDiff;
      if (day.minT === 999)  day.minT = 20;
      if (day.maxT === -999) day.maxT = 28;
      return day;
    });

  return { current, forecast };
}
