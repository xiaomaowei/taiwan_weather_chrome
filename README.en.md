# 🌦️ Taiwan Weather Chrome Extension (台灣天氣可愛手繪風 Chrome 擴充功能)

English | [繁體中文](./README.md)

> **Current Version**: v2.3.7

This is a Chrome browser weather extension tailored for Taiwan. Featuring a **warm and cute hand-drawn illustration style**, it supports real-time weather and weekly forecasts detailed down to the **township/district level**, allowing you to check weather conditions all over Taiwan at any time while browsing the web!

<img width="360" height="564" alt="image" src="https://github.com/user-attachments/assets/91a9f7ee-e058-44eb-b1db-efeada91fa76" />


---

## ✨ Key Features

* 🌐 **Multi-language Support (i18n)**: Fully supports **Traditional Chinese (繁體中文)** and **English (英文)**. Auto-detects browser language, with manual override in settings.
* 🔍 **Bilingual Search & Dynamic Translation**: Fuzzy search by Chinese or Pinyin for any township. All weather data (Wx, wind, AQI, etc.) is provided with high-quality bilingual translation.
* 📍 **Fine-grained Location**: All 22 counties/cities and every township/district in Taiwan.
* 🌦️ **Real-time Weather**: Temperature, apparent temperature, humidity, precipitation probability, wind speed/direction.
* 🌧️ **Rainfall Alert (Daily Cumulative / Hourly auto-switch)**: Integrates CWA rain gauge API (`O-A0002-001`). Triggers a **red breathing light alert** when hourly rainfall reaches 30 mm or more.
* 🔔 **Official Weather Alerts (v2.3 New)**: Fetches live CWA weather warning API (`W-C0033-001`). Supports heavy rain, strong wind, cold snap, heat, typhoon, and more. Displayed as a prominent alert banner on the main screen.
* 📊 **Intelligent Daily Summary (v2.3 New)**: Auto-generates a one-line summary based on temperature, precipitation probability, rainfall amount, AQI, and weather alerts (e.g., “Rain expected later — bring an umbrella ☂️” or “Good air quality — great for outdoor activities 🌿”).
* 🌿 **Real-time Air Quality (AQI & PM2.5)**: Auto-matches the nearest monitoring station. Click the AQI card to **expand detailed pollutant data** (v2.3 New): PM10, O₃, NO₂, CO, SO₂, plus personalized health advice based on the current AQI level.
* 📅 **Weekly Forecast (v2.3 Visual Upgrade)**: 7-day forecast with enhanced readability. Tomorrow’s card is highlighted; precipitation probability is color-coded by intensity (blue for low, red for high); each card shows a data-source badge (`CWA` yellow / `OM` blue).
* 🎨 **Healing Hand-drawn Design**: Curated light and dark themes with cute hand-drawn borders and subtle micro-animations.
* 🔌 **API Key Quick Test (v2.3 New)**: A “Test Connection” button in Settings lets you instantly validate a CWA or MOENV API key without saving and reloading.
* 🏷️ **Quick Area Switch**: Fuzzy search + one-click saving of frequently visited townships.
* 🌡️ **Real-time Temperature Icon**: Extension toolbar icon shows the live temperature of your primary location with auto-changing background colors.
* ⚡ **Caching & Performance**: Built-in Service Worker background caching (customizable TTL) minimizes redundant API calls.
* ✒️ **Google Fonts & Size Optimization (v2.3.2 Update)**: Reverted back to Google Fonts online links for Fredoka and Outfit fonts and removed over 38MB of local font files, dramatically reducing extension package size.
* ✍️ **Chinese Legibility & Layout Optimization (v2.3.2 Update)**: Fell back to clean, high-legibility system fonts (like Microsoft JhengHei, PingFang SC) for Chinese characters, and enlarged Chinese text sizes by 1-2px, solving the thin and blurry font issues. The "Today's Summary" has been moved inside the main weather card (below the current condition and above the details grid) for a cleaner layout.
* 📏 **Popup Height & Layout Optimization (v2.3.3 New)**: Set a fixed popup height of 595px to instruct Chrome to display the window fully, and tightened padding and margins around elements (saving 38px of vertical space) to completely eliminate vertical scrollbars.
* 📐 **Side-by-Side Summary & Enlarged UI Icons (v2.3.4 New)**: Relocated the "Today's Summary" to be side-by-side on the top right of the card, aligned with the left-aligned weather icon and temperature, saving a full row of vertical height. Additionally, enlarged the AQI expand arrow to 16px and boosted its contrast, facilitating user interaction.
* 🎀 **Today's Summary Visual Fine-tuning (v2.3.5 New)**: Removed the background border and color from the summary text block for a cleaner look, and removed the duplicate trailing weather emoji in the i18n text, leaving only the primary front icon.
* 🌧️ **Weekly Forecast 100% Rain Probability Layout Fine-tuning (v2.3.6 New)**: To prevent three-digit rain probabilities (e.g. 100%) from wrapping and breaking the layout in the narrow weekly cards, we adjusted the font size to 9px and set the icon-to-text gap to 0px, ensuring everything stays neatly on one line.
* 🗜️ **Popup Bottom Blank Space Reduction (v2.3.7 New)**: Reduced the fixed body height from 595px to 560px to tightly fit the forecast section's bottom edge while keeping a small, comfortable margin, eliminating the redundant blank space left by previous layout optimizations.

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
