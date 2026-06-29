# 🌦️ Taiwan Weather Chrome Extension (台灣天氣可愛手繪風 Chrome 擴充功能)

English | [繁體中文](./README.md)

> **Current Version**: v2.3.12

This is a Chrome browser weather extension tailored for Taiwan. Featuring a **warm and cute hand-drawn illustration style**, it supports real-time weather and weekly forecasts detailed down to the **township/district level**, allowing you to check weather conditions all over Taiwan at any time while browsing the web!

<img width="360" height="600" alt="image" src="https://github.com/user-attachments/assets/cacfaa40-ab0f-4390-abfa-ee116a55c765" />



---

## ✨ Key Features

* 🌐 **Multi-language Support (i18n)**: Fully supports **Traditional Chinese (繁體中文)** and **English (英文)**. Auto-detects browser language, with manual override in settings.
* 🔍 **Bilingual Search & Dynamic Translation**: Fuzzy search by Chinese or Pinyin for any township. All weather data (Wx, wind, AQI, etc.) is provided with high-quality bilingual translation.
* 📍 **Fine-grained Location**: All 22 counties/cities and every township/district in Taiwan.
* 🌦️ **Real-time Weather**: Temperature, apparent temperature, humidity, precipitation probability, wind speed/direction.
* 🌧️ **Rainfall Alert**: Integrates CWA rain gauge API to display daily cumulative rainfall and hourly rainfall warnings (triggers a red breathing light alert when hourly rainfall ≥ 30 mm).
* 📈 **12-Hour Rainfall Trend**: An hourly rainfall bar chart at the bottom of the popup, centered on "Now", showing the past 6 hours (actual observations) through the next 6 hours (forecast), with the period's cumulative total. Past and future hours are color-coded; data is sourced from Open-Meteo hourly precipitation.
* 🔔 **Official Weather Alerts**: Fetches live official warnings (heavy rain, strong wind, typhoon, etc.) and displays a prominent warning banner.
* 📊 **Intelligent Daily Summary**: Auto-generates a one-line summary based on current parameters and alerts, letting you grasp today's highlights at a glance.
* 🌿 **Real-time Air Quality (AQI & PM2.5)**: Matches the nearest monitoring station, shown as an inline strip at the bottom of the weather card with AQI and PM2.5, a colored status badge, and the station name.
* 📅 **Weekly Forecast**: 7-day forecast with highlighted tomorrow's card, color-coded precipitation probability, and clear data source badges.
* 🎨 **Healing Hand-drawn Design**: Warm light and dark chalkboard themes with hand-drawn borders and micro-animations.
* 🏷️ **Quick Area Switch**: Fuzzy search + one-click saving of frequently visited townships.
* 🌡️ **Real-time Temperature Icon**: Extension toolbar icon shows live temperature and changes background color accordingly.
* ⚡ **Caching & Performance**: Service Worker background caching and background proxy fetch to optimize API requests and bypass Manifest V3 limitations.

> 💡 For detailed version updates and history, please refer to [Change Log (CHANGELOG.en.md)](./CHANGELOG.en.md).

---

## 🛠️ Architecture

* **Frontend Core**: HTML5, JavaScript (ES6+), Vanilla CSS (utilizing hand-drawn card layouts and responsive designs)
* **Extension Standard**: Chrome Extension Manifest V3
* **Background Services**: Service Worker (`background.js`), Chrome Alarms API, Chrome Storage API
* **Weather Data Source**: Central Weather Administration (CWA) Open Data API (primary data source)
* **Extended Forecast Precipitation**: [Open-Meteo API](https://open-meteo.com/) (provides precipitation probability for days 4-7 based on coordinates, API key not required)
* **Air Quality Data Source**: Ministry of Environment (MOENV) Open Data API

---

## 📦 Installation & Setup

<details>
<summary><b>🛠️ Click to expand: Manual Installation Guide</b></summary>

1. **Download this repository**:
   * Click the `Code` button in the top right, select `Download ZIP` and extract it, or clone the repository via Git:
     ```bash
     git clone https://github.com/xiaomaowei/taiwan_weather_chrome.git
     ```
2. **Open Chrome Extensions Page**:
   * Navigate to `chrome://extensions/` in your Chrome browser.
3. **Enable Developer Mode**:
   * Toggle the **"Developer mode"** switch in the top-right corner.
4. **Load the Extension**:
   * Click the **"Load unpacked"** button in the top-left corner.
   * Select the extracted folder of this project (the directory containing `manifest.json`).
5. **Pin to Toolbar**:
   * Click the Extensions puzzle icon 🧩 in the top-right of Chrome, find "Taiwan Weather", and click the pin icon to keep it visible on your toolbar for real-time temperature updates!

</details>

<details>
<summary><b>🔑 Click to expand: Apply & Configure CWA API Key (Weather)</b></summary>

To ensure real-time weather information is fetched successfully, it is recommended to configure your own CWA API authorization key:

1. **Apply for a Key**:
   * Go to the [CWA Open Data Platform](https://opendata.cwa.gov.tw/index) and sign up for a free account.
   * After logging in, go to the "API Key" section in your profile to copy your `API Key` (format: `CWA-XXXXXX`).
2. **Configure in Extension**:
   * Click the Taiwan Weather extension icon on your toolbar.
   * Click the **gear icon (Settings)** in the top right to open the settings panel.
   * Paste your key into the "CWA API Key" field and click **"Save Settings"**.
   * *(Note: This project does not pre-configure any API keys. Please obtain one to retrieve weather data, or turn on "Demo Mode" in settings to preview the extension.)*

</details>

<details>
<summary><b>🔑 Click to expand: Apply & Configure MOENV API Key (Air Quality)</b></summary>

To display real-time AQI and PM2.5 data, it is recommended to configure your Ministry of Environment API key:

1. **Apply for a Key**:
   * Go to the [MOENV Open Data Platform](https://data.moenv.gov.tw/api-term), register a free account, and apply for an API Key.
2. **Configure in Extension**:
   * Open the extension and click the **gear settings button**.
   * Paste your key into the "MOENV API Key" field and click **"Save Settings"**.
   * *(Note: No API key is pre-configured. If empty, the air quality card will display a link prompting you to configure the key.)*

</details>

---

## 📢 Weather Data Info & Limitations

<details>
<summary><b>💧 Click to expand: Precipitation Probability Data Fusion (Weekly Forecast)</b></summary>

* **First 3 Days (Official CWA Data)**: Due to the characteristics of CWA's 12-hour interval 7-day forecast API, precipitation probability is only provided for the first 3 days. The extension prioritizes displaying these official statistics.
* **Next 4 Days (Open-Meteo API Supplement)**: Since CWA does not provide precipitation probability for the latter half of the week, the extension automatically requests the coordinate-based maximum daily precipitation probability (`precipitation_probability_max`) from the keyless **Open-Meteo API** in the background.
* **Fault Tolerance**: If the Open-Meteo API request fails, the precipitation probability for days 4-7 will gracefully fall back to `💧--` without affecting other weather details.

</details>

<details>
<summary><b>🌧️ Click to expand: Real-time Rainfall Data & Warnings</b></summary>

* **Data Source**: CWA Automatic Rain Gauge Observations (`O-A0002-001`), updated approximately every **10 minutes**.
* **Daily Cumulative**: The `RainfallElement.Now.Precipitation` field represents cumulative rainfall since **00:00 local time**.
* **Hourly Rainfall Alert**: The `RainfallElement.Past1hr.Precipitation` field represents cumulative rainfall in the past 1 hour. If this value is **≥ 30 mm** (heavy rain threshold), the UI automatically switches to display "Hourly Rainfall" and flashes a red breathing alert indicator.
* **Fault Tolerance**: If the rainfall API fails, the rainfall card will fallback to `-- mm` gracefully.
* **Special Codes**: `T` (trace amount, too small to measure); `-98` (no rain for 6 consecutive hours, displayed as 0.0 mm); `-99` / `X` (sensor malfunction or missing data, displayed as 0.0 mm).

</details>

<details>
<summary><b>📈 Click to expand: 12-Hour Rainfall Trend — Data & Logic</b></summary>

* **Data source**: Hourly precipitation from the [Open-Meteo API](https://open-meteo.com/) (`hourly=precipitation`), requested with both `past_days=1` (actual past rainfall) and `forecast_days=2` (forecast rainfall) — no API key required.
* **Display window**: Centered on the current time, it shows 13 hourly bars spanning "6 hours back → 6 hours ahead". Past (actual) and future (forecast) hours are color-coded, the "Now" column is marked, and the period's cumulative total is shown in the top-right.
* **Update & caching**: The hourly array is fetched and cached together with the Settings page's "Update Frequency" (the background Service Worker fetches it on periodic refresh too), but the displayed window re-aligns to the current time each time the popup opens, so it never gets stuck on a stale timeline.
* **Graceful degradation**: If the selected township has no coordinates or the Open-Meteo request fails, the trend strip simply hides itself without affecting the rest of the weather display.

</details>

<details>
<summary><b>⏱️ Click to expand: Real-time Weather Observation Details & Matching</b></summary>

* **Data Source**: CWA Weather Station Real-time Observations (`O-A0003-001`), updated approximately every **10 minutes**.
* **Station Matching Mechanism**: The extension calculates the straight-line distance between the selected township's center coordinates and available weather stations, choosing the closest active station. If coordinate data is missing, it falls back to a township name fuzzy match.
* **Observation Parameters**: Includes temperature, humidity, wind speed, wind direction, and weather condition description. Apparent temperature is calculated dynamically based on the station's real-time temperature, humidity, and wind speed.
* **Fault Tolerance & Fallback**: If a specific parameter is missing (e.g. sensor malfunction returning `-99`) or the observation API request fails, the extension gracefully falls back to the forecasted values from CWA's township forecasts (`F-D0047` series), ensuring uninterrupted display.

</details>

---

## 📂 Project Structure

```text
taiwan_weather_chrome/
├── _locales/             # Localization files
│   ├── zh_TW/            # Traditional Chinese (messages.json)
│   └── en/               # English (messages.json)
├── icons/                # Extension toolbar icon assets
├── store_icons/          # Web Store promotional images & logos
├── manifest.json         # Extension manifest (V3)
├── popup.html            # Extension main window HTML structure
├── popup.css             # Hand-drawn styled CSS stylesheet (Light & Dark themes)
├── popup.js              # Frontend interaction and UI rendering logic
├── background.js         # Service Worker (background update and toolbar icon painter)
├── city_county_data.js   # Taiwan city & district coordinate mapping
├── i18n_data.js          # Bilingual translation mappings (cities, districts, weather, wind, etc.)
├── .gitignore            # Git ignore configuration
├── LICENSE               # GPL v3 license file
├── README.md             # Chinese documentation
└── README.en.md          # English documentation (this file)
```

---

## 🎨 Themes & Customizations

This extension supports both **"Hand-drawn Light Theme"** and **"Hand-drawn Dark Theme"**. The system automatically matches your OS color scheme, or you can manually override it in the settings panel:

* **Light Theme**: A cozy hand-drawn cream parchment background, charcoal pencil borders, and cute colorful weather icons.
* **Dark Theme**: Eye-care chalk-board dark blue background with bright white hand-drawn borders.

---

## 🤝 Contributions & Feedbacks

If you encounter any issues or have feature requests (e.g., more hand-drawn doodles, extra weather parameters), feel free to open an [Issue](https://github.com/xiaomaowei/taiwan_weather_chrome/issues) or submit a Pull Request!

* **Author**: [xiaomaowei](https://github.com/xiaomaowei)
* **License**: GNU GPL v3
