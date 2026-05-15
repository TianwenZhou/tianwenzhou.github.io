import { renderStockIntervalMenu, renderStockPickerMenu } from "./stock/stock-widget.js";

export function rebuildHomeShell() {
  const sidebar = document.querySelector(".app-layout > .sidebar");
  const homeView = document.querySelector("#homeView");

  if (sidebar) {
    sidebar.className = "sidebar arc-sidebar";
    sidebar.setAttribute("aria-label", "Primary");
    sidebar.innerHTML = `
      <nav class="arc-nav" aria-label="Dashboard Sections">
        <svg class="arc-nav-line" viewBox="0 0 260 1000" aria-hidden="true" preserveAspectRatio="none">
          <defs>
            <linearGradient id="arcLineGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stop-color="#b15cc4" stop-opacity="0.05" />
              <stop offset="0.2" stop-color="#b15cc4" stop-opacity="0.42" />
              <stop offset="0.5" stop-color="#8d3dff" stop-opacity="0.92" />
              <stop offset="0.8" stop-color="#b15cc4" stop-opacity="0.42" />
              <stop offset="1" stop-color="#b15cc4" stop-opacity="0.05" />
            </linearGradient>
            <linearGradient id="arcGlowGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stop-color="#8d3dff" stop-opacity="0" />
              <stop offset="0.34" stop-color="#8d3dff" stop-opacity="0.16" />
              <stop offset="0.5" stop-color="#8d3dff" stop-opacity="0.98" />
              <stop offset="0.66" stop-color="#8d3dff" stop-opacity="0.16" />
              <stop offset="1" stop-color="#8d3dff" stop-opacity="0" />
            </linearGradient>
          </defs>
          <g class="arc-nav-rotor">
            <path class="arc-nav-line-shadow" d="M150 0 Q234 500 150 1000" />
            <path class="arc-nav-line-core" d="M150 0 Q234 500 150 1000" />
            <path class="arc-nav-line-glow" d="M150 0 Q234 500 150 1000" />
          </g>
        </svg>
        <button class="sidebar-link arc-nav-item is-active" type="button" data-view-target="home">
          <span class="sidebar-link-copy"><strong>Home</strong></span>
        </button>
        <button class="sidebar-link arc-nav-item" type="button" data-view-target="news">
          <span class="sidebar-link-copy"><strong>News</strong></span>
        </button>
        <button class="sidebar-link arc-nav-item" type="button" data-view-target="nba">
          <span class="sidebar-link-copy"><strong>NBA</strong></span>
        </button>
        <button class="sidebar-link arc-nav-item" type="button" data-view-target="papers">
          <span class="sidebar-link-copy"><strong>Papers</strong></span>
        </button>
      </nav>
      <div class="home-data-sink" aria-hidden="true">
        <p id="generatedAt">-</p>
        <p id="refreshStatus">Ready</p>
        <button id="refreshDataButton" type="button">Refresh</button>
      </div>
    `;
  }

  if (homeView) {
    homeView.innerHTML = `
      <section class="home-dashboard" aria-label="Home">
        <section class="home-center" aria-label="Search and shortcuts">
          <div class="home-clock-card">
            <p id="currentTime" class="home-time">--:--:--</p>
            <p id="currentDate" class="sr-only">--</p>
          </div>

          <div class="home-search-row">
            <form id="homeSearchForm" class="home-search" role="search">
              <label class="sr-only" for="homeSearchInput">Search</label>
              <input id="homeSearchInput" type="search" autocomplete="off" placeholder="Search Bing..." />
              <div id="searchEnginePicker" class="search-engine-picker">
                <button
                  id="searchEngineButton"
                  class="search-engine-button"
                  type="button"
                  aria-label="Choose search engine"
                  aria-haspopup="listbox"
                  aria-expanded="false"
                >
                  <img
                    id="searchEngineIcon"
                    class="search-engine-logo is-bing"
                    src="./assets/search/bing.svg"
                    alt=""
                  />
                  <svg class="search-engine-chevron" viewBox="0 0 16 16" aria-hidden="true">
                    <path d="M4 6l4 4 4-4"></path>
                  </svg>
                </button>
                <div id="searchEngineMenu" class="search-engine-menu" role="listbox" aria-label="Search engines" hidden>
                  <button class="search-engine-option" type="button" role="option" data-search-engine-option="bing">
                    <img class="search-engine-logo is-bing" src="./assets/search/bing.svg" alt="" />
                    <span>Bing</span>
                  </button>
                  <button class="search-engine-option" type="button" role="option" data-search-engine-option="baidu">
                    <img class="search-engine-logo is-baidu" src="./assets/search/baidu.svg" alt="" />
                    <span>百度</span>
                  </button>
                  <button class="search-engine-option" type="button" role="option" data-search-engine-option="google">
                    <img class="search-engine-logo is-google" src="./assets/search/google.svg" alt="" />
                    <span>Google</span>
                  </button>
                </div>
              </div>
            </form>
            <button
              id="homeWallpaperToggle"
              class="home-wallpaper-toggle"
              type="button"
              aria-label="切换夜间壁纸"
              title="切换夜间壁纸"
            >
              <span class="home-wallpaper-toggle-icon" aria-hidden="true"></span>
            </button>
          </div>

          <section id="homeShortcutsPanel" class="home-shortcuts-panel" aria-label="Shortcuts">
            <div id="shortcutGrid" class="shortcut-grid" aria-live="polite"></div>
            <div id="shortcutPager" class="shortcut-pager" aria-label="Shortcut pages"></div>
          </section>

          <div id="shortcutDialog" class="shortcut-dialog" hidden>
            <div class="shortcut-dialog-backdrop" data-shortcut-dialog-close></div>
            <form id="shortcutDialogForm" class="shortcut-dialog-card" role="dialog" aria-modal="true" aria-labelledby="shortcutDialogTitle">
              <button class="shortcut-dialog-close" type="button" data-shortcut-dialog-close aria-label="Close"></button>
              <h2 id="shortcutDialogTitle">Add Shortcut</h2>
              <label class="shortcut-field">
                <span>Website URL</span>
                <input id="shortcutDialogUrl" type="url" inputmode="url" autocomplete="url" placeholder="https://example.com" required />
              </label>
              <label class="shortcut-field">
                <span>Name</span>
                <input id="shortcutDialogTitleInput" type="text" autocomplete="off" maxlength="28" placeholder="Auto" />
              </label>
              <div class="shortcut-dialog-preview" aria-live="polite">
                <span class="shortcut-dialog-preview-icon">
                  <span id="shortcutDialogInitial" class="shortcut-icon-fallback">S</span>
                  <img id="shortcutDialogIcon" alt="" />
                </span>
                <span class="shortcut-dialog-preview-copy">
                  <strong id="shortcutDialogPreviewName">Shortcut</strong>
                  <span id="shortcutDialogPreviewDomain">example.com</span>
                </span>
              </div>
              <button class="shortcut-dialog-submit" type="submit" data-shortcut-dialog-submit>Add</button>
            </form>
          </div>
        </section>

        <aside class="home-widgets" aria-label="Widgets">
          <section class="home-widget weather-widget" aria-labelledby="weatherTitle">
            <header class="home-widget-head">
              <div class="weather-location-head">
                <p id="weatherPanelLabel" class="home-kicker">天气</p>
                <button
                  id="weatherLocationButton"
                  class="weather-location-button"
                  type="button"
                  aria-label="选择天气地区"
                  aria-haspopup="dialog"
                  aria-expanded="false"
                >
                  <span id="weatherTitle">自动定位</span>
                  <svg class="weather-location-chevron" viewBox="0 0 12 12" aria-hidden="true">
                    <path d="M3 4.5 6 7.5 9 4.5" />
                  </svg>
                </button>
              </div>
              <div class="weather-refresh-control">
                <button
                  id="weatherRefreshButton"
                  class="widget-chip weather-refresh-button"
                  type="button"
                  aria-label="刷新本地天气"
                ></button>
              </div>
            </header>
            <div id="weatherLocationPanel" class="weather-location-panel" hidden>
              <form id="weatherLocationForm" class="weather-location-search" role="search">
                <label class="sr-only" for="weatherLocationInput">搜索天气地区</label>
                <input id="weatherLocationInput" type="search" autocomplete="off" placeholder="搜索城市 / 区县" />
                <button type="submit">搜索</button>
              </form>
              <button id="weatherUseAutoButton" class="weather-location-auto" type="button">使用本地定位</button>
              <div id="weatherLocationResults" class="weather-location-results" role="listbox" aria-label="天气地区搜索结果"></div>
            </div>
            <div id="weatherCurrent" class="weather-current home-weather-current skeleton">
              <div class="home-weather-main">
                <img id="weatherVisual" class="home-weather-icon" src="./assets/weather/clear.svg" alt="天气图标" />
                <div>
                  <span id="weatherCondition" class="home-weather-condition">--</span>
                  <div class="home-weather-temp-row">
                    <strong id="weatherTemperature" class="home-weather-temp">--&deg;C</strong>
                    <span id="weatherHumidity" class="home-weather-humidity">湿度 --</span>
                  </div>
                  <div class="home-weather-badges">
                    <span id="weatherAirQuality" class="home-weather-aqi">空气质量 --</span>
                    <span id="weatherFeelsLike" class="home-weather-feels">体感 --</span>
                  </div>
                </div>
              </div>
              <span id="weatherLocation" class="sr-only">--</span>
              <div id="weatherMetrics" class="home-weather-metrics weather-metrics" aria-label="实时天气指标"></div>
            </div>
            <div id="weatherHourly" class="home-weather-hourly" aria-label="逐小时天气"></div>
            <div id="weatherDaily" class="home-weather-forecast weather-daily"></div>
          </section>

          <section class="home-widget stock-widget" aria-labelledby="stockTitle">
            <header class="home-widget-head stock-widget-head">
              <div class="stock-heading">
                <p id="stockKicker" class="home-kicker">MARKET</p>
                <div class="stock-title-row">
                  <h2 id="stockTitle">比亚迪</h2>
                  <button
                    id="stockPickerButton"
                    class="stock-title-picker"
                    type="button"
                    aria-label="切换股票"
                    aria-haspopup="menu"
                    aria-expanded="false"
                  >
                    <svg viewBox="0 0 12 12" aria-hidden="true">
                      <path d="M3 4.5 6 7.5 9 4.5" />
                    </svg>
                  </button>
                </div>
                <span id="stockSymbolLabel" class="stock-symbol-label">002594.SZ · SZSE</span>
              </div>
              <div class="stock-head-actions">
                <button id="stockRefreshButton" class="stock-refresh-button" type="button" aria-label="刷新股票数据"></button>
                <strong id="stockHeaderPrice" class="stock-header-price">CN¥--</strong>
              </div>
            </header>
            <div id="stockPickerMenu" class="stock-picker-menu" role="menu" aria-label="选择股票" hidden>
              ${renderStockPickerMenu()}
            </div>
            <div class="stock-chart-shell">
              <div class="stock-chart-toolbar">
                <div class="stock-interval-picker">
                  <button
                    id="stockIntervalButton"
                    class="stock-interval-trigger"
                    type="button"
                    aria-haspopup="menu"
                    aria-expanded="false"
                  >
                    <span id="stockIntervalLabel">1分K</span>
                    <svg class="stock-interval-chevron" viewBox="0 0 12 12" aria-hidden="true">
                      <path d="M3 4.5 6 7.5 9 4.5" />
                    </svg>
                  </button>
                </div>
              </div>
              <div id="stockIntervalControls" class="stock-interval-menu" role="menu" aria-label="K line interval" hidden>
                ${renderStockIntervalMenu()}
              </div>
              <div id="stockChart" class="stock-chart" role="img" aria-label="BYD K-line chart"></div>
            </div>
          </section>
        </aside>

        <div class="home-legacy-sinks" aria-hidden="true">
          <div id="calendarRangeHint"></div>
          <button id="calendarPrev" type="button"></button>
          <button id="calendarToday" type="button"></button>
          <button id="calendarNext" type="button"></button>
          <span id="currentMonthLabel"></span>
          <div id="currentMonthCalendar"></div>
          <span id="nextMonthLabel"></span>
          <div id="nextMonthCalendar"></div>
          <span id="historyTodayMeta"></span>
          <div id="historyTodayList"></div>
          <div id="featuredPlacePanel"></div>
          <div id="classicQuoteCard" class="skeleton">
            <p id="classicQuoteText"></p>
            <p id="classicQuoteSource"></p>
            <p id="classicQuoteNote"></p>
            <p id="bookExcerptText"></p>
            <p id="bookExcerptSource"></p>
          </div>
        </div>
      </section>
    `;
  }
}
