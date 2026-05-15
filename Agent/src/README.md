# Frontend Source Map

This folder is the new home for feature code that is split out of the legacy
`app.js` file.

## Page-First Structure

Top-level folders under `pages/` should match the website's visible sections:

- `pages/home/`
- `pages/news/`
- `pages/nba/`
- `pages/papers/`

Each page folder can then be split into smaller feature folders.

## Current Modules

- `pages/home/home-shell.js`
  - Arc sidebar DOM template
  - Home page DOM template
  - Home widget placeholders and legacy data sinks
- `pages/home/navigation/arc-navigation.js`
  - Home/News/NBA/Papers routing
  - Left arc navigation positioning
  - Arc transition animation timing and wrap behavior
- `pages/home/shortcuts/shortcuts.js`
  - Search engine selector
  - Shortcut grid pagination
  - Add/delete shortcut dialog
- `pages/home/weather/weather-widget.js`
  - QWeather API calls
  - Browser/geolocation fallback
  - Location search, recommendations, and history
  - Current, hourly, and multi-day weather rendering
- `pages/home/stock/stock-widget.js`
  - Stock widget data loading
  - K-line interval options
  - K-line chart rendering
  - Stock interval dropdown events
- `pages/news/news-page.js`
  - Domestic/world/NBA news list rendering
  - News image validation and fallback handling
- `pages/nba/nba-page.js`
  - NBA scoreboard rendering
  - Schedule day switching
  - Team leader panels
- `pages/papers/papers-page.js`
  - AI paper section rendering
  - Paper cards and rotation labels

## Migration Plan

The remaining large `app.js` file should be split gradually in this order:

1. `shared/`
   - date formatting
   - HTML escaping
   - localStorage helpers
2. `pages/home/chat/` and `pages/home/pet/`
   - chat dock state and messaging
   - 3D companion behavior
3. `pages/home/legacy/`
   - calendar, history, quote, and featured-place sinks
   - request helpers

Keep `app.js` as the bootstrap file: it should import modules, rebuild the page
shell, collect shared DOM references, then call each module's setup/load method.
