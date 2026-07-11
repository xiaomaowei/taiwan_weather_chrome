# Repository Guidelines

## Project Structure & Module Organization

This is a Chrome Extension built with Manifest V3 and plain HTML, CSS, and ES6 JavaScript. `manifest.json` defines the extension, permissions, popup, and service worker. The popup UI lives in `popup.html`, `popup.css`, and `popup.js`; background caching, alarms, and toolbar-icon updates belong in `background.js`. Put reusable, browser-context-neutral weather helpers in `weather_utils.js`. Location and translation data are maintained in `city_county_data.js`, `i18n_data.js`, and `_locales/{zh_TW,en}/messages.json`. Extension icons are in `icons/`. Keep user-facing documentation synchronized across `README.md`, `README.en.md`, `CHANGELOG.md`, and `CHANGELOG.en.md` when applicable.

## Build, Test, and Development Commands

No package manager, compiler, linter, or automated test suite is configured. Develop by loading the repository directly:

```text
chrome://extensions/ → Enable Developer mode → Load unpacked → select this repository
```

After a change, use **Reload** on the extension page, open the popup, and inspect errors through the popup DevTools or the service worker inspector. The release workflow runs when a `v*` tag is pushed and creates the distributable ZIP; do not commit generated `dist/` files.

## Coding Style & Naming Conventions

Follow the existing style: two-space indentation, semicolons, double-quoted strings, and `camelCase` for functions and variables. Use `UPPER_SNAKE_CASE` for constants and storage keys (for example, `CACHE_KEY`). Keep DOM-specific code in `popup.js`, Chrome API/background concerns in `background.js`, and pure shared logic in `weather_utils.js`; the latter must not access `chrome.*` or the DOM. Preserve both `zh_TW` and `en` UI strings whenever adding user-visible text.

## Testing Guidelines

Manually verify each change in an unpacked extension. At minimum, check the affected popup interaction, a forced refresh, persisted settings after reopening the popup, and browser-console/service-worker errors. Use Demo Mode for predictable UI checks; use personal CWA and MOENV keys only through Chrome storage. For API or cache changes, also verify network failure handling and stale-cache fallback.

## Commit & Pull Request Guidelines

History primarily uses Conventional Commit prefixes: `feat:`, `fix:`, `refactor:`, `docs:`, and `chore:`. Write an imperative, focused subject; Chinese descriptions are common in this repository. Keep commits scoped to one change. Pull requests should describe behavior changes, list manual verification, link relevant issues, and include popup screenshots for visual or layout changes. Update the manifest version and changelog only for a release-ready change.

## Security & Configuration

Never commit API keys, saved settings, or captured API responses. Treat changes to `host_permissions`, extension permissions, and external API endpoints as security-sensitive and explain their necessity in the pull request.
