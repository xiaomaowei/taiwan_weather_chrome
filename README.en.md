# 🌦️ Taiwan Weather Chrome Extension (台灣天氣可愛手繪風 Chrome 擴充功能)

English | [繁體中文](./README.md)

> **Current Version**: v2.2.0 (i18n Multi-language Supported)

This is a Chrome browser weather extension tailored for Taiwan. Featuring a **warm and cute hand-drawn illustration style**, it supports real-time weather and weekly forecasts detailed down to the **township/district level**, allowing you to check weather conditions all over Taiwan at any time while browsing the web!

<img width="360" height="570" alt="image" src="https://github.com/user-attachments/assets/c0ce4cdb-df30-479c-9078-b4008c588da6" />

---

## ✨ Key Features

* 🌐 **Multi-language Support (i18n)**: Fully supports **Traditional Chinese (繁體中文)** and **English (英文)**. The extension automatically detects your browser's language, and you can also manually switch it in the settings panel.
* 🔍 **Bilingual Search & Dynamic Translation**: The search bar supports fuzzy search in Chinese and English Pinyin for counties, cities, and townships in Taiwan (e.g., searching for `beitou` or `北投` works equally well). All meteorological information, such as weather conditions (Wx), wind direction, and Air Quality Index (AQI), is provided with high-quality bilingual translation.
* 📍 **Fine-grained Location**: Supports all 22 counties/cities and all townships/districts in Taiwan (e.g., Beitou District in Taipei City, Xindian District in New Taipei City).
* 🌦️ **Real-time Weather Info**: Provides current temperature, apparent temperature, relative humidity, probability of precipitation, wind speed/direction.
* 🌧️ **Rainfall Alert (Auto-switch between Daily Cumulative / Hourly Rainfall)**: Integrates the Central Weather Administration (CWA) automatic rain gauge API (`O-A0002-001`) to automatically match the closest observation station. It displays the cumulative rainfall for today (from 00:00 to the current time). When the rainfall in the past 1 hour (hourly rainfall) reaches **30 mm or more** (heavy rain threshold), the UI automatically switches to display "Hourly Rainfall" and triggers a **red breathing light alert**, warning you of potential flooding or landslide risks.
* 🌿 **Real-time Air Quality (AQI & PM2.5)**: Automatically matches the nearest environmental monitoring station to display real-time AQI and PM2.5 concentrations. Cards feature color codes corresponding to official air quality standards (Good: Green, Moderate: Yellow, Unhealthy for Sensitive Groups: Orange, Unhealthy: Red, Very Unhealthy: Purple, Hazardous: Maroon) with a cute waving leaf micro-animation.
* 📅 **Weekly Forecast**: An intuitive 7-day forecast including the day of the week, weather condition illustrations, temperature range, and 7-day precipitation probability (the first 3 days are sourced from CWA, and the remaining 4 days are fetched from the Open-Meteo API based on township coordinates, preventing blank forecasts due to CWA API limitations).
* 🎨 **Healing Hand-drawn Design**: Meticulously designed light and dark themes featuring cute hand-drawn borders and subtle micro-animations for a warm, fluid user experience.
* 🏷️ **Quick Area Switch**: A search box with fuzzy matching allows fast filtering and saving of frequently visited townships to avoid repetitive searches.
* 🌡️ **Real-time Temperature Icon**: No need to click! The extension icon on the browser toolbar directly displays the current temperature of your primary location, changing background colors based on temperature (Cold: Blue, Warm: Yellow, Hot: Orange, etc.).
* ⚡ **Caching & Performance Optimization**: Built-in Service Worker background caching (customizable TTL) prevents redundant CWA API requests, saving daily bandwidth.

---

## 🛠️ Architecture

* **Frontend Core**: HTML5, JavaScript (ES6+), Vanilla CSS (utilizing hand-drawn card layouts and responsive designs)
* **Extension Standard**: Chrome Extension Manifest V3
* **Background Services**: Service Worker (`background.js`), Chrome Alarms API, Chrome Storage API
* **Weather Data Source**: Central Weather Administration (CWA) Open Data API (primary data source)
* **Extended Forecast Precipitation**: [Open-Meteo API](https://open-meteo.com/) (provides precipitation probability for days 4-7 based on coordinates, API key not required)
* **Air Quality Data Source**: Ministry of Environment (MOENV) Open Data API

---

## 📦 Installation Guide

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

---

## 🔑 Apply & Configure CWA API Key (Weather)

To ensure real-time weather information is fetched successfully, it is recommended to configure your own CWA API authorization key:

1. **Apply for a Key**:
   * Go to the [CWA Open Data Platform](https://opendata.cwa.gov.tw/index) and sign up for a free account.
   * After logging in, go to the "API Key" section in your profile to copy your `API Key` (format: `CWA-XXXXXX`).
2. **Configure in Extension**:
   * Click the Taiwan Weather extension icon on your toolbar.
   * Click the **gear icon (Settings)** in the top right to open the settings panel.
   * Paste your key into the "CWA API Key" field and click **"Save Settings"**.
   * *(Note: This project does not pre-configure any API keys. Please obtain one to retrieve weather data, or turn on "Demo Mode" in settings to preview the extension.)*

---

## 🔑 Apply & Configure MOENV API Key (Air Quality)

To display real-time AQI and PM2.5 data, it is recommended to configure your Ministry of Environment API key:

1. **Apply for a Key**:
   * Go to the [MOENV Open Data Platform](https://data.moenv.gov.tw/api-term), register a free account, and apply for an API Key.
2. **Configure in Extension**:
   * Open the extension and click the **gear settings button**.
   * Paste your key into the "MOENV API Key" field and click **"Save Settings"**.
   * *(Note: No API key is pre-configured. If empty, the air quality card will display a link prompting you to configure the key.)*

---

## 📢 Weather Data Info & Limitations

* 💧 **Precipitation Probability Data Fusion (Weekly Forecast)**:
  * **First 3 Days (Official CWA Data)**: Due to the characteristics of CWA's 12-hour interval 7-day forecast API, precipitation probability is only provided for the first 3 days. The extension prioritizes displaying these official statistics.
  * **Next 4 Days (Open-Meteo API Supplement)**: Since CWA does not provide precipitation probability for the latter half of the week, the extension automatically requests the coordinate-based maximum daily precipitation probability (`precipitation_probability_max`) from the keyless **Open-Meteo API** in the background.
  * **Fault Tolerance**: If the Open-Meteo API request fails, the precipitation probability for days 4-7 will gracefully fall back to `💧--` without affecting other weather details.

* 🌧️ **Real-time Rainfall Data**:
  * **Data Source**: CWA Automatic Rain Gauge Observations (`O-A0002-001`), updated approximately every **10 minutes**.
  * **Daily Cumulative**: The `RainfallElement.Now.Precipitation` field represents cumulative rainfall since **00:00 local time**.
  * **Hourly Rainfall Alert**: The `RainfallElement.Past1hr.Precipitation` field represents cumulative rainfall in the past 1 hour. If this value is **≥ 30 mm** (heavy rain threshold), the UI automatically switches to display "Hourly Rainfall" and flashes a red breathing alert indicator.
  * **Fault Tolerance**: If the rainfall API fails, the rainfall card will fallback to `-- mm` gracefully.
  * **Special Codes**: `T` (trace amount, too small to measure); `-98` (no rain for 6 consecutive hours, displayed as 0.0 mm); `-99` / `X` (sensor malfunction or missing data, displayed as 0.0 mm).

---

## 📂 Project Structure

```text
taiwan_weather_chrome/
├── _locales/             # Localization files
│   ├── zh_TW/            # Traditional Chinese (messages.json)
│   └── en/               # English (messages.json)
├── manifest.json         # Extension manifest (V3)
├── popup.html            # Extension main window HTML structure
├── popup.css             # Hand-drawn styled CSS stylesheet (Light & Dark themes)
├── popup.js              # Frontend interaction and UI rendering logic
├── background.js         # Service Worker (background update and toolbar icon painter)
├── city_county_data.js   # Taiwan city & district coordinate mapping
├── i18n_data.js          # Bilingual translation mappings (cities, districts, weather, wind, etc.)
├── icons/                # Extension toolbar icon assets
└── README.md             # This document
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
