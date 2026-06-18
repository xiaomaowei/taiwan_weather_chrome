# Change Log

All notable changes and updates to the "Taiwan Weather Chrome Extension" are documented in this file.

---

## [v2.3.10] - 2026-06-18
### Changed
- **Refined rain-intensity tiering in Today's Summary**: The summary previously only escalated to a "heavy rain" warning once hourly rainfall reached 30mm. The threshold is now lowered to 15mm, with a new "very heavy rain" tier above 40mm. Also added an escalated warning when rain probability reaches 80% or higher, even before hourly rainfall data catches up — so the summary better reflects severe weather as it's happening.

## [v2.3.9] - 2026-06-17
### Fixed
- **Fixed missing files in release package**: The CI release workflow previously failed to copy `i18n_data.js` and the `_locales` folder, causing the published zip to be missing translations. The packaging script has been fixed to include all required files.
- **Fixed alarm-clearing logic**: When `background.js` resets the background schedule, it previously called `chrome.alarms.clearAll()`, which would clear every alarm registered by the extension. It now uses `chrome.alarms.clear(ALARM_NAME)` to clear only its own alarm, avoiding interference with future scheduled tasks.
### Refactored
- **Extracted shared weather utility module**: `background.js` and `popup.js` each maintained their own copy of weather parsing, rainfall, real-time observation, Open-Meteo PoP supplementation, apparent temperature, and wind-scale conversion logic — a duplication risk for bug fixes. This logic has been consolidated into a new shared `weather_utils.js`, used by both the background script and the popup. Pure internal cleanup; no user-facing behavior changes.

## [v2.3.8] - 2026-06-11
### Added
- **Real-time Observation Precision Boost**: Integrates the CWA weather station real-time observation API (`O-A0003-001`). The extension automatically pairs with the nearest weather station (calculated by coordinates or matched by township) to retrieve the most recent temperature, apparent temperature, humidity, wind scale, wind direction, and weather condition observed within the last 10 minutes, significantly improving accuracy.
- **Full-screen Settings Panel & Slide-up Animation**: Reconstructed the settings overlay into a fixed full-screen slide-up settings page. Transition animations are optimized from the scale-in pop-up to a smooth slide-up animation from the bottom. Custom scrollbars with hand-drawn styles are also integrated to handle long configurations cleanly.
- **Background Proxy Fetch for Open-Meteo PoP**: Redirects Open-Meteo precipitation probability API requests through the background Service Worker. This bypasses Manifest V3 CORS/CSP and host permission restrictions inside the popup context, while keeping the local fetch as a graceful fallback.

## [v2.3.7] - 2026-06-05
### Changed
- **Popup Bottom Blank Space Reduction**: Reduced the fixed body height from 595px to 560px to tightly fit the forecast section's bottom edge while keeping a small, comfortable margin, eliminating the redundant blank space left by previous layout optimizations.

## [v2.3.6] - 2026-06-03
### Changed
- **Weekly Forecast 100% Rain Probability Layout Fine-tuning**: To prevent three-digit rain probabilities (e.g. 100%) from wrapping and breaking the layout in the narrow weekly cards, we adjusted the font size to 9px and set the icon-to-text gap to 0px, ensuring everything stays neatly on one line.

## [v2.3.5] - 2026-05-30
### Changed
- **Today's Summary Visual Fine-tuning**: Removed the background border and color from the summary text block for a cleaner look, and removed the duplicate trailing weather emoji in the i18n text, leaving only the primary front icon.

## [v2.3.4] - 2026-05-28
### Changed
- **Side-by-Side Summary & Enlarged UI Icons**: Relocated the "Today's Summary" to be side-by-side on the top right of the card, aligned with the left-aligned weather icon and temperature, saving a full row of vertical height. Additionally, enlarged the AQI expand arrow to 16px and boosted its contrast, facilitating user interaction.

## [v2.3.3] - 2026-05-25
### Changed
- **Popup Height & Layout Optimization**: Set a fixed popup height of 595px to instruct Chrome to display the window fully, and tightened padding and margins around elements (saving 38px of vertical space) to completely eliminate vertical scrollbars.

## [v2.3.2] - 2026-05-20
### Changed
- **Google Fonts & Size Optimization**: Reverted back to Google Fonts online links for Fredoka and Outfit fonts and removed over 38MB of local font files, dramatically reducing extension package size.
- **Chinese Legibility & Layout Optimization**: Fell back to clean, high-legibility system fonts (like Microsoft JhengHei, PingFang SC) for Chinese characters, and enlarged Chinese text sizes by 1-2px, solving the thin and blurry font issues. The "Today's Summary" has been moved inside the main weather card (below the current condition and above the details grid) for a cleaner layout.

## [v2.3.0]
### Added
- **Official Weather Alerts**: Fetches live CWA weather warning API (`W-C0033-001`). Displayed as a prominent alert banner on the main screen.
- **Intelligent Daily Summary**: Auto-generates a one-line summary based on temperature, precipitation probability, rainfall amount, AQI, and weather alerts.
- **Real-time Air Quality Details**: Expand the AQI card to view detailed pollutant data (PM10, O₃, NO₂, CO, SO₂) and personal health suggestions.
- **API Key Quick Test**: A "Test Connection" button in Settings lets you instantly validate CWA or MOENV API keys.
