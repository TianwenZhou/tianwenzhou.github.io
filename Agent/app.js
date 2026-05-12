function buildDataUrl() {
  return `./data/daily-brief.json?ts=${Date.now()}`;
}

function rebuildHomeShell() {
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
              <div>
                <p id="weatherPanelLabel" class="home-kicker">天气</p>
                <h2 id="weatherTitle">自动定位</h2>
              </div>
              <div class="weather-refresh-control">
                <button
                  id="weatherRefreshButton"
                  class="widget-chip weather-refresh-button"
                  type="button"
                  aria-label="刷新本地天气"
                >刷新</button>
              </div>
            </header>
            <div id="weatherCurrent" class="weather-current home-weather-current skeleton">
              <div class="home-weather-main">
                <img id="weatherVisual" class="home-weather-icon" src="./assets/weather/clear.svg" alt="天气动画" />
                <div>
                  <span id="weatherCondition" class="home-weather-condition">--</span>
                  <strong id="weatherTemperature" class="home-weather-temp">--&deg;C</strong>
                  <span id="weatherAirQuality" class="home-weather-aqi">空气质量 --</span>
                </div>
              </div>
              <span id="weatherLocation" class="sr-only">--</span>
              <div class="home-weather-metrics weather-metrics">
                <span id="weatherWind">风速 --</span>
                <span id="weatherRange">温度 -- / --</span>
                <span id="weatherRain">降水 --</span>
              </div>
            </div>
            <div id="weatherHourly" class="home-weather-hourly" aria-label="逐小时天气"></div>
            <div id="weatherDaily" class="home-weather-forecast weather-daily"></div>
          </section>

          <section class="home-widget stock-widget" aria-labelledby="stockTitle">
            <header class="home-widget-head">
              <div>
                <p class="home-kicker">Market</p>
                <h2 id="stockTitle">Stocks</h2>
              </div>
              <span id="stockUpdatedAt" class="widget-chip">Loading</span>
            </header>
            <div id="stockTickerList" class="stock-list"></div>
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

rebuildHomeShell();

const chatConfig = window.AGENT_CHAT_CONFIG ?? {};
const workflowUrl =
  "https://github.com/TianwenZhou/tianwenzhou.github.io/actions/workflows/update-brief.yml";
const chatStorageKey = "agent-dashboard-chat-history-v1";
const chatDockStateKey = "agent-dashboard-chat-open-v1";
const chatDockPositionKey = "agent-dashboard-chat-position-v1";
const chatUnreadKey = "agent-dashboard-chat-unread-v1";
const maxChatTurns = 8;
const chatDragThreshold = 10;

const dom = {
  generatedAt: document.querySelector("#generatedAt"),
  refreshStatus: document.querySelector("#refreshStatus"),
  refreshDataButton: document.querySelector("#refreshDataButton"),
  chatDock: document.querySelector("#chatDock"),
  chatDragHandle: document.querySelector("#chatDragHandle"),
  chatToggleButton: document.querySelector("#chatToggleButton"),
  chatToggleLabel: document.querySelector("#chatToggleLabel"),
  chatUnreadBadge: document.querySelector("#chatUnreadBadge"),
  chatCollapseButton: document.querySelector("#chatCollapseButton"),
  chatAvailability: document.querySelector("#chatAvailability"),
  chatPeekText: document.querySelector("#chatPeekText"),
  chatMessages: document.querySelector("#chatMessages"),
  chatForm: document.querySelector("#chatForm"),
  chatInput: document.querySelector("#chatInput"),
  chatHint: document.querySelector("#chatHint"),
  chatSendButton: document.querySelector("#chatSendButton"),
  chatShortcuts: Array.from(document.querySelectorAll("[data-chat-shortcut]")),
  homeShortcutsPanel: document.querySelector("#homeShortcutsPanel"),
  homeSearchForm: document.querySelector("#homeSearchForm"),
  homeSearchInput: document.querySelector("#homeSearchInput"),
  searchEngineButton: document.querySelector("#searchEngineButton"),
  searchEngineIcon: document.querySelector("#searchEngineIcon"),
  searchEngineMenu: document.querySelector("#searchEngineMenu"),
  searchEngineOptions: Array.from(document.querySelectorAll("[data-search-engine-option]")),
  shortcutAddForm: document.querySelector("#shortcutAddForm"),
  shortcutUrlInput: document.querySelector("#shortcutUrlInput"),
  shortcutGrid: document.querySelector("#shortcutGrid"),
  shortcutPager: document.querySelector("#shortcutPager"),
  shortcutDialog: document.querySelector("#shortcutDialog"),
  shortcutDialogForm: document.querySelector("#shortcutDialogForm"),
  shortcutDialogUrl: document.querySelector("#shortcutDialogUrl"),
  shortcutDialogTitleInput: document.querySelector("#shortcutDialogTitleInput"),
  shortcutDialogIcon: document.querySelector("#shortcutDialogIcon"),
  shortcutDialogInitial: document.querySelector("#shortcutDialogInitial"),
  shortcutDialogPreviewName: document.querySelector("#shortcutDialogPreviewName"),
  shortcutDialogPreviewDomain: document.querySelector("#shortcutDialogPreviewDomain"),
  shortcutDialogCloseButtons: Array.from(document.querySelectorAll("[data-shortcut-dialog-close]")),
  shortcutResetButton: document.querySelector("#shortcutResetButton"),
  stockTickerList: document.querySelector("#stockTickerList"),
  stockUpdatedAt: document.querySelector("#stockUpdatedAt"),
  weatherTitle: document.querySelector("#weatherTitle"),
  weatherPanelLabel: document.querySelector("#weatherPanelLabel"),
  weatherLocationSelect: document.querySelector("#weatherLocationSelect"),
  weatherRefreshButton: document.querySelector("#weatherRefreshButton"),
  weatherLocationButton: document.querySelector("#weatherLocationButton"),
  weatherLocationPanel: document.querySelector("#weatherLocationPanel"),
  weatherProvinceSelect: document.querySelector("#weatherProvinceSelect"),
  weatherCitySelect: document.querySelector("#weatherCitySelect"),
  weatherDistrictSelect: document.querySelector("#weatherDistrictSelect"),
  weatherUseAutoButton: document.querySelector("#weatherUseAutoButton"),
  weatherApplyLocationButton: document.querySelector("#weatherApplyLocationButton"),
  weatherLocation: document.querySelector("#weatherLocation"),
  weatherCurrent: document.querySelector("#weatherCurrent"),
  weatherVisual: document.querySelector("#weatherVisual"),
  weatherCondition: document.querySelector("#weatherCondition"),
  weatherTemperature: document.querySelector("#weatherTemperature"),
  weatherAirQuality: document.querySelector("#weatherAirQuality"),
  weatherDescription: document.querySelector("#weatherDescription"),
  weatherWind: document.querySelector("#weatherWind"),
  weatherRange: document.querySelector("#weatherRange"),
  weatherRain: document.querySelector("#weatherRain"),
  weatherHourly: document.querySelector("#weatherHourly"),
  weatherDaily: document.querySelector("#weatherDaily"),
  calendarRangeHint: document.querySelector("#calendarRangeHint"),
  calendarPrev: document.querySelector("#calendarPrev"),
  calendarToday: document.querySelector("#calendarToday"),
  calendarNext: document.querySelector("#calendarNext"),
  currentMonthLabel: document.querySelector("#currentMonthLabel"),
  currentMonthCalendar: document.querySelector("#currentMonthCalendar"),
  nextMonthLabel: document.querySelector("#nextMonthLabel"),
  nextMonthCalendar: document.querySelector("#nextMonthCalendar"),
  historyTodayMeta: document.querySelector("#historyTodayMeta"),
  historyTodayList: document.querySelector("#historyTodayList"),
  currentDate: document.querySelector("#currentDate"),
  currentTime: document.querySelector("#currentTime"),
  featuredPlacePanel: document.querySelector("#featuredPlacePanel"),
  classicQuoteCard: document.querySelector("#classicQuoteCard"),
  classicQuoteText: document.querySelector("#classicQuoteText"),
  classicQuoteSource: document.querySelector("#classicQuoteSource"),
  classicQuoteNote: document.querySelector("#classicQuoteNote"),
  bookExcerptText: document.querySelector("#bookExcerptText"),
  bookExcerptSource: document.querySelector("#bookExcerptSource"),
  chinaTopNews: document.querySelector("#chinaTopNews"),
  chinaSocietyNews: document.querySelector("#chinaSocietyNews"),
  chinaFinanceNews: document.querySelector("#chinaFinanceNews"),
  worldTopNews: document.querySelector("#worldTopNews"),
  worldBusinessNews: document.querySelector("#worldBusinessNews"),
  worldTechNews: document.querySelector("#worldTechNews"),
  nbaScoreboard: document.querySelector("#nbaScoreboard"),
  nbaNews: document.querySelector("#nbaNews"),
  paperHighlights: document.querySelector("#paperHighlights"),
  paperRotationLabel: document.querySelector("#paperRotationLabel"),
  petDock: document.querySelector("#petDock"),
  petCompanion: document.querySelector("#petCompanion"),
  petStage: document.querySelector("#petStage"),
  petMoodBadge: document.querySelector("#petMoodBadge"),
  petStatusText: document.querySelector("#petStatusText"),
  viewButtons: Array.from(document.querySelectorAll("[data-view-target]")),
  views: Array.from(document.querySelectorAll("[data-view]")),
  emptyStateTemplate: document.querySelector("#emptyStateTemplate"),
};

let featuredPlaceTimer = null;
let lastCalendarKey = "";
let refreshInFlight = false;
let chatPending = false;
let chatDockOpen = false;
let chatUnreadCount = 0;
let chatHistory = [];
let chatDragState = null;
let chatSuppressToggleUntil = 0;
let petInteractCooldown = 0;
let petRoamFrame = 0;
let petRoamState = null;
const calendarState = {
  anchorYear: null,
  anchorMonthIndex: null,
};
const nbaScheduleState = {
  days: [],
  activeIndex: 0,
  currentIndex: 0,
};
const availableViews = new Set(["home", "news", "nba", "papers"]);
const shortcutStorageKey = "agent-dashboard-home-shortcuts-v1";
const shortcutEditStorageKey = "agent-dashboard-home-shortcuts-edit-v1";
const searchEngineStorageKey = "agent-dashboard-search-engine-v1";
const weatherLocationStorageKey = "agent-dashboard-weather-location-v1";
const weatherCustomLocationStorageKey = "agent-dashboard-weather-custom-location-v1";
const chinaRegionApiUrl = "https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json";
const shortcutsPerPage = 12;
const maxShortcuts = 60;
let shortcutEditMode = false;
let shortcutPageIndex = 0;
let shortcutDialogTitleTouched = false;
let activeSearchEngine = "bing";
let localWeatherLoaded = false;
let weatherRequestInFlight = false;
let activeWeatherLocation = null;
let activeChinaRegionCatalog = [];
let chinaRegionCatalogRequest = null;
let previousNavActiveIndex = null;
let wheelNavigationDelta = 0;
let wheelNavigationLastAt = 0;
const stockSymbols = ["AAPL", "MSFT", "NVDA", "GOOGL", "TSLA"];
const stockFallbacks = [
  { symbol: "AAPL", name: "Apple", price: "Watching", change: "Open market", state: "neutral" },
  { symbol: "MSFT", name: "Microsoft", price: "Watching", change: "Open market", state: "neutral" },
  { symbol: "NVDA", name: "NVIDIA", price: "Watching", change: "Open market", state: "neutral" },
  { symbol: "GOOGL", name: "Alphabet", price: "Watching", change: "Open market", state: "neutral" },
  { symbol: "TSLA", name: "Tesla", price: "Watching", change: "Open market", state: "neutral" },
];
const defaultShortcuts = [
  { title: "GitHub", url: "https://github.com", icon: "https://www.google.com/s2/favicons?domain=github.com&sz=128" },
  { title: "ChatGPT", url: "https://chatgpt.com", icon: "https://www.google.com/s2/favicons?domain=chatgpt.com&sz=128" },
  { title: "Google Scholar", url: "https://scholar.google.com", icon: "https://www.google.com/s2/favicons?domain=scholar.google.com&sz=128" },
  { title: "arXiv", url: "https://arxiv.org", icon: "https://www.google.com/s2/favicons?domain=arxiv.org&sz=128" },
  { title: "Overleaf", url: "https://www.overleaf.com", icon: "https://www.google.com/s2/favicons?domain=overleaf.com&sz=128" },
  { title: "Z-Library", url: "https://z-library.sk", icon: "https://www.google.com/s2/favicons?domain=z-library.sk&sz=128" },
];
const searchEngines = {
  bing: {
    label: "Bing",
    logo: "./assets/search/bing.svg",
    placeholder: "Search Bing...",
    buildUrl: (query) => `https://www.bing.com/search?q=${encodeURIComponent(query)}`,
  },
  baidu: {
    label: "百度",
    logo: "./assets/search/baidu.svg",
    placeholder: "百度一下...",
    buildUrl: (query) => `https://www.baidu.com/s?wd=${encodeURIComponent(query)}`,
  },
  google: {
    label: "Google",
    logo: "./assets/search/google.svg",
    placeholder: "Search Google...",
    buildUrl: (query) => `https://www.google.com/search?q=${encodeURIComponent(query)}`,
  },
};
const weatherLocations = {
  beijing: { label: "北京市", latitude: 39.9042, longitude: 116.4074, timezone: "Asia/Shanghai" },
  shanghai: { label: "上海市", latitude: 31.2304, longitude: 121.4737, timezone: "Asia/Shanghai" },
  shenzhen: { label: "深圳市", latitude: 22.5431, longitude: 114.0579, timezone: "Asia/Shanghai" },
  "new-york": { label: "纽约", latitude: 40.7128, longitude: -74.006, timezone: "America/New_York" },
  "los-angeles": { label: "洛杉矶", latitude: 34.0522, longitude: -118.2437, timezone: "America/Los_Angeles" },
};
const chinaRegionCatalog = [
  {
    name: "北京市",
    cities: [
      {
        name: "北京市",
        districts: [
          { label: "海淀区", latitude: 39.9599, longitude: 116.2982 },
          { label: "朝阳区", latitude: 39.9219, longitude: 116.4431 },
          { label: "西城区", latitude: 39.9123, longitude: 116.3659 },
          { label: "东城区", latitude: 39.9284, longitude: 116.4164 },
        ],
      },
    ],
  },
  {
    name: "上海市",
    cities: [
      {
        name: "上海市",
        districts: [
          { label: "浦东新区", latitude: 31.2215, longitude: 121.5447 },
          { label: "徐汇区", latitude: 31.1885, longitude: 121.4365 },
          { label: "黄浦区", latitude: 31.2304, longitude: 121.4737 },
          { label: "静安区", latitude: 31.2296, longitude: 121.4473 },
        ],
      },
    ],
  },
  {
    name: "广东省",
    cities: [
      {
        name: "广州市",
        districts: [
          { label: "天河区", latitude: 23.1246, longitude: 113.3612 },
          { label: "越秀区", latitude: 23.1291, longitude: 113.2644 },
          { label: "海珠区", latitude: 23.084, longitude: 113.3174 },
        ],
      },
      {
        name: "深圳市",
        districts: [
          { label: "南山区", latitude: 22.5312, longitude: 113.9294 },
          { label: "福田区", latitude: 22.541, longitude: 114.05 },
          { label: "罗湖区", latitude: 22.5484, longitude: 114.1316 },
        ],
      },
    ],
  },
  {
    name: "江苏省",
    cities: [
      {
        name: "南京市",
        districts: [
          { label: "玄武区", latitude: 32.0486, longitude: 118.7978 },
          { label: "鼓楼区", latitude: 32.0663, longitude: 118.7698 },
          { label: "建邺区", latitude: 32.0033, longitude: 118.7317 },
        ],
      },
      {
        name: "苏州市",
        districts: [
          { label: "姑苏区", latitude: 31.3111, longitude: 120.6173 },
          { label: "工业园区", latitude: 31.3246, longitude: 120.7069 },
        ],
      },
    ],
  },
  {
    name: "浙江省",
    cities: [
      {
        name: "杭州市",
        districts: [
          { label: "西湖区", latitude: 30.2592, longitude: 120.1298 },
          { label: "上城区", latitude: 30.2425, longitude: 120.1692 },
          { label: "滨江区", latitude: 30.1876, longitude: 120.212 },
        ],
      },
    ],
  },
  {
    name: "四川省",
    cities: [
      {
        name: "成都市",
        districts: [
          { label: "锦江区", latitude: 30.5987, longitude: 104.0835 },
          { label: "武侯区", latitude: 30.6424, longitude: 104.0434 },
          { label: "高新区", latitude: 30.5658, longitude: 104.0633 },
        ],
      },
    ],
  },
  {
    name: "湖北省",
    cities: [
      {
        name: "武汉市",
        districts: [
          { label: "武昌区", latitude: 30.5539, longitude: 114.3159 },
          { label: "江汉区", latitude: 30.6015, longitude: 114.2708 },
          { label: "洪山区", latitude: 30.5046, longitude: 114.3439 },
        ],
      },
    ],
  },
];
const chinaCompactRegionFallbacks = [
  { province: "北京市", city: "北京市", district: "市中心", latitude: 39.9042, longitude: 116.4074 },
  { province: "天津市", city: "天津市", district: "市中心", latitude: 39.3434, longitude: 117.3616 },
  { province: "河北省", city: "石家庄市", district: "市中心", latitude: 38.0428, longitude: 114.5149 },
  { province: "山西省", city: "太原市", district: "市中心", latitude: 37.8706, longitude: 112.5489 },
  { province: "内蒙古自治区", city: "呼和浩特市", district: "市中心", latitude: 40.8414, longitude: 111.7519 },
  { province: "辽宁省", city: "沈阳市", district: "市中心", latitude: 41.8057, longitude: 123.4315 },
  { province: "吉林省", city: "长春市", district: "市中心", latitude: 43.8171, longitude: 125.3235 },
  { province: "黑龙江省", city: "哈尔滨市", district: "市中心", latitude: 45.8038, longitude: 126.5349 },
  { province: "上海市", city: "上海市", district: "市中心", latitude: 31.2304, longitude: 121.4737 },
  { province: "江苏省", city: "南京市", district: "市中心", latitude: 32.0603, longitude: 118.7969 },
  { province: "浙江省", city: "杭州市", district: "市中心", latitude: 30.2741, longitude: 120.1551 },
  { province: "安徽省", city: "合肥市", district: "市中心", latitude: 31.8206, longitude: 117.2272 },
  { province: "福建省", city: "福州市", district: "市中心", latitude: 26.0745, longitude: 119.2965 },
  { province: "江西省", city: "南昌市", district: "市中心", latitude: 28.6829, longitude: 115.8582 },
  { province: "山东省", city: "济南市", district: "市中心", latitude: 36.6512, longitude: 117.1201 },
  { province: "河南省", city: "郑州市", district: "市中心", latitude: 34.7466, longitude: 113.6254 },
  { province: "湖北省", city: "武汉市", district: "市中心", latitude: 30.5928, longitude: 114.3055 },
  { province: "湖南省", city: "长沙市", district: "市中心", latitude: 28.2282, longitude: 112.9388 },
  { province: "广东省", city: "广州市", district: "市中心", latitude: 23.1291, longitude: 113.2644 },
  { province: "广西壮族自治区", city: "南宁市", district: "市中心", latitude: 22.817, longitude: 108.3669 },
  { province: "海南省", city: "海口市", district: "市中心", latitude: 20.0444, longitude: 110.1999 },
  { province: "重庆市", city: "重庆市", district: "市中心", latitude: 29.563, longitude: 106.5516 },
  { province: "四川省", city: "成都市", district: "市中心", latitude: 30.5728, longitude: 104.0668 },
  { province: "贵州省", city: "贵阳市", district: "市中心", latitude: 26.6477, longitude: 106.6302 },
  { province: "云南省", city: "昆明市", district: "市中心", latitude: 25.0389, longitude: 102.7183 },
  { province: "西藏自治区", city: "拉萨市", district: "市中心", latitude: 29.652, longitude: 91.1721 },
  { province: "陕西省", city: "西安市", district: "市中心", latitude: 34.3416, longitude: 108.9398 },
  { province: "甘肃省", city: "兰州市", district: "市中心", latitude: 36.0611, longitude: 103.8343 },
  { province: "青海省", city: "西宁市", district: "市中心", latitude: 36.6171, longitude: 101.7782 },
  { province: "宁夏回族自治区", city: "银川市", district: "市中心", latitude: 38.4872, longitude: 106.2309 },
  { province: "新疆维吾尔自治区", city: "乌鲁木齐市", district: "市中心", latitude: 43.8256, longitude: 87.6168 },
  { province: "香港特别行政区", city: "香港", district: "市中心", latitude: 22.3193, longitude: 114.1694 },
  { province: "澳门特别行政区", city: "澳门", district: "市中心", latitude: 22.1987, longitude: 113.5439 },
  { province: "台湾省", city: "台北市", district: "市中心", latitude: 25.033, longitude: 121.5654 },
];
const navigationCycle = ["news", "home", "nba", "papers"];
const arcMotion = {
  topInset: -112,
  leftInset: -90,
  width: 316,
  viewWidth: 260,
  viewHeight: 1000,
  startX: 150,
  controlX: 234,
  endX: 150,
  duration: 400,
  slots: {
    "-1": { t: 0.235, scale: 0.93 },
    0: { t: 0.5, scale: 1 },
    1: { t: 0.72, scale: 0.94 },
    2: { t: 0.895, scale: 0.9 },
  },
  offTop: { t: -0.035, scale: 0.86 },
  offBottom: { t: 0.985, scale: 0.86 },
};

const weatherCodeMap = {
  0: "晴朗",
  1: "基本晴",
  2: "局部多云",
  3: "阴天",
  45: "有雾",
  48: "雾凇",
  51: "毛毛雨",
  53: "小雨",
  55: "中雨",
  61: "小雨",
  63: "中雨",
  65: "大雨",
  71: "小雪",
  73: "中雪",
  75: "大雪",
  80: "阵雨",
  81: "强阵雨",
  82: "暴雨",
  95: "雷暴",
};

const weatherVisuals = {
  clear: "./assets/weather/clear.svg",
  cloudy: "./assets/weather/cloudy.svg",
  rain: "./assets/weather/rain.svg",
  snow: "./assets/weather/snow.svg",
  storm: "./assets/weather/storm.svg",
  fog: "./assets/weather/fog.svg",
};

// 2026 Chinese public holiday dates based on the State Council holiday notice.
const chinaHolidayRanges = [
  { label: "元旦", start: "2026-01-01", end: "2026-01-03" },
  { label: "春节", start: "2026-02-15", end: "2026-02-23" },
  { label: "清明", start: "2026-04-04", end: "2026-04-06" },
  { label: "劳动节", start: "2026-05-01", end: "2026-05-05" },
  { label: "端午", start: "2026-06-19", end: "2026-06-21" },
  { label: "中秋", start: "2026-09-25", end: "2026-09-27" },
  { label: "国庆", start: "2026-10-01", end: "2026-10-07" },
];

function getDateKey(year, month, day) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function buildHolidayMap(ranges) {
  const map = new Map();

  ranges.forEach((range) => {
    const start = new Date(`${range.start}T12:00:00Z`);
    const end = new Date(`${range.end}T12:00:00Z`);

    for (const cursor = new Date(start); cursor <= end; cursor.setUTCDate(cursor.getUTCDate() + 1)) {
      map.set(cursor.toISOString().slice(0, 10), range.label);
    }
  });

  return map;
}

const chinaHolidayMap = buildHolidayMap(chinaHolidayRanges);

const newsFallbacks = {
  domestic: [
    "https://images.unsplash.com/photo-1508804185872-d7badad00f7d?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1518684079-3c830dcef090?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1508804052814-cd3ba865a116?auto=format&fit=crop&w=1200&q=80",
  ],
  international: [
    "https://images.unsplash.com/photo-1521295121783-8a321d551ad2?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1491553895911-0055eca6402d?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&w=1200&q=80",
  ],
  nba: [
    "https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1519861531473-9200262188bf?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1574623452334-1e0ac2b3ccb4?auto=format&fit=crop&w=1200&q=80",
  ],
};

const petStatusCatalog = {
  roaming: [
    "A tiny 3D cat is patrolling the bottom edge of your dashboard.",
    "Neo Cat is on patrol and keeping an eye on the page.",
    "This little companion is wandering under the panels today.",
  ],
  hover: [
    "Hover here to pause the patrol and say hi.",
    "Neo Cat pauses when you come closer.",
    "The patrol is paused. The cat is watching you now.",
  ],
  pet: [
    "Soft tap received. Neo Cat seems pleased.",
    "The little cat leans in for another pat.",
    "Purr... the 3D cat approves of that.",
  ],
};

function getWeatherVisual(weatherCode) {
  if ([45, 48].includes(weatherCode)) {
    return weatherVisuals.fog;
  }

  if ([71, 73, 75].includes(weatherCode)) {
    return weatherVisuals.snow;
  }

  if ([95].includes(weatherCode)) {
    return weatherVisuals.storm;
  }

  if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(weatherCode)) {
    return weatherVisuals.rain;
  }

  if ([2, 3].includes(weatherCode)) {
    return weatherVisuals.cloudy;
  }

  return weatherVisuals.clear;
}

function formatDateTime(value) {
  const date = new Date(value);
  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "Asia/Shanghai",
  }).format(date);
}

function formatDate(value) {
  const date = new Date(value);
  return new Intl.DateTimeFormat("zh-CN", {
    month: "numeric",
    day: "numeric",
    weekday: "short",
    timeZone: "Asia/Shanghai",
  }).format(date);
}

function getChatEndpoint() {
  return typeof chatConfig.endpoint === "string" ? chatConfig.endpoint.trim() : "";
}

function getDefaultChatMessage(endpointConfigured) {
  if (!endpointConfigured) {
    return {
      role: "assistant",
      content:
        "聊天入口已经放好了，但还需要把 Cloudflare Worker 的地址填进 chat-config.js，配置完成后这里就可以直接聊天。",
      label: "Setup",
    };
  }

  return {
    role: "assistant",
    content: "你好，我在这里陪你简短聊几句。可以问我新闻、NBA、论文，或者随便聊聊天。",
    label: chatConfig.assistantName || "Agent",
  };
}

function normalizeChatHistory(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item) => item && typeof item.content === "string")
    .map((item) => ({
      role: item.role === "user" ? "user" : "assistant",
      content: item.content.trim(),
      label: typeof item.label === "string" ? item.label : "",
    }))
    .filter((item) => item.content)
    .slice(-maxChatTurns);
}

function loadChatHistory() {
  try {
    const raw = window.localStorage.getItem(chatStorageKey);
    return normalizeChatHistory(raw ? JSON.parse(raw) : []);
  } catch {
    return [];
  }
}

function persistChatHistory() {
  try {
    window.localStorage.setItem(chatStorageKey, JSON.stringify(chatHistory.slice(-maxChatTurns)));
  } catch {
    // Ignore storage failures so the chat still works in private mode.
  }
}

function loadStoredInteger(storageKey) {
  try {
    const raw = Number(window.localStorage.getItem(storageKey));
    return Number.isFinite(raw) && raw > 0 ? raw : 0;
  } catch {
    return 0;
  }
}

function persistChatUnreadCount() {
  try {
    if (chatUnreadCount > 0) {
      window.localStorage.setItem(chatUnreadKey, String(chatUnreadCount));
    } else {
      window.localStorage.removeItem(chatUnreadKey);
    }
  } catch {
    // Ignore storage failures so unread state does not break the UI.
  }
}

function renderChatUnreadBadge() {
  const hasUnread = chatUnreadCount > 0;
  dom.chatUnreadBadge.hidden = !hasUnread;
  dom.chatUnreadBadge.textContent = chatUnreadCount > 9 ? "9+" : String(chatUnreadCount);
  dom.chatToggleButton.classList.toggle("has-unread", hasUnread);
}

function resetChatUnreadCount() {
  chatUnreadCount = 0;
  persistChatUnreadCount();
  renderChatUnreadBadge();
}

function incrementChatUnreadCount() {
  chatUnreadCount = Math.min(chatUnreadCount + 1, 99);
  persistChatUnreadCount();
  renderChatUnreadBadge();
}

function buildChatPreviewText() {
  const latest = chatHistory[chatHistory.length - 1];
  if (!latest?.content) {
    return "Ask about NBA, weather, news, or papers.";
  }

  return latest.content
    .replace(/```[\s\S]*?```/g, " code ")
    .replace(/[`*_>#~-]/g, " ")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 72);
}

function renderChatPreview() {
  dom.chatPeekText.textContent = buildChatPreviewText();
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderMarkdownInline(value) {
  const codeTokens = [];
  let html = escapeHtml(value);

  html = html.replace(/`([^`]+)`/g, (_, code) => {
    const token = `__CHAT_CODE_${codeTokens.length}__`;
    codeTokens.push(`<code>${code}</code>`);
    return token;
  });

  html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, (_, label, url) => {
    const safeUrl = escapeHtml(url);
    return `<a href="${safeUrl}" target="_blank" rel="noreferrer">${label}</a>`;
  });

  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/(^|[^\*])\*([^*\n]+)\*(?!\*)/g, "$1<em>$2</em>");
  html = html.replace(/~~([^~]+)~~/g, "<del>$1</del>");

  codeTokens.forEach((tokenMarkup, index) => {
    html = html.replace(`__CHAT_CODE_${index}__`, tokenMarkup);
  });

  return html.replace(/\n/g, "<br>");
}

function renderMarkdown(value) {
  const lines = String(value || "").replace(/\r\n/g, "\n").split("\n");
  const blocks = [];

  const isFence = (line) => line.trim().startsWith("```");
  const isHeading = (line) => /^(#{1,4})\s+/.test(line);
  const isQuote = (line) => /^>\s?/.test(line.trim());
  const isUnordered = (line) => /^[-*+]\s+/.test(line.trim());
  const isOrdered = (line) => /^\d+\.\s+/.test(line.trim());

  for (let index = 0; index < lines.length; ) {
    const line = lines[index];

    if (!line.trim()) {
      index += 1;
      continue;
    }

    if (isFence(line)) {
      const language = line.trim().slice(3).trim();
      index += 1;
      const codeLines = [];
      while (index < lines.length && !isFence(lines[index])) {
        codeLines.push(lines[index]);
        index += 1;
      }
      if (index < lines.length) {
        index += 1;
      }

      blocks.push(
        `<pre><code${language ? ` class="language-${escapeHtml(language)}"` : ""}>${escapeHtml(codeLines.join("\n"))}</code></pre>`,
      );
      continue;
    }

    if (isHeading(line)) {
      const match = line.match(/^(#{1,4})\s+(.*)$/);
      const level = Math.min(match[1].length + 1, 4);
      blocks.push(`<h${level}>${renderMarkdownInline(match[2])}</h${level}>`);
      index += 1;
      continue;
    }

    if (isQuote(line)) {
      const quoteLines = [];
      while (index < lines.length && isQuote(lines[index])) {
        quoteLines.push(lines[index].replace(/^>\s?/, ""));
        index += 1;
      }
      blocks.push(`<blockquote>${renderMarkdownInline(quoteLines.join("\n"))}</blockquote>`);
      continue;
    }

    if (isUnordered(line) || isOrdered(line)) {
      const ordered = isOrdered(line);
      const tag = ordered ? "ol" : "ul";
      const items = [];

      while (index < lines.length) {
        const current = lines[index].trim();
        if (!(ordered ? /^\d+\.\s+/.test(current) : /^[-*+]\s+/.test(current))) {
          break;
        }

        items.push(
          ordered
            ? current.replace(/^\d+\.\s+/, "")
            : current.replace(/^[-*+]\s+/, ""),
        );
        index += 1;
      }

      blocks.push(
        `<${tag}>${items.map((item) => `<li>${renderMarkdownInline(item)}</li>`).join("")}</${tag}>`,
      );
      continue;
    }

    const paragraphLines = [];
    while (
      index < lines.length &&
      lines[index].trim() &&
      !isFence(lines[index]) &&
      !isHeading(lines[index]) &&
      !isQuote(lines[index]) &&
      !isUnordered(lines[index]) &&
      !isOrdered(lines[index])
    ) {
      paragraphLines.push(lines[index]);
      index += 1;
    }

    blocks.push(`<p>${renderMarkdownInline(paragraphLines.join("\n"))}</p>`);
  }

  return blocks.join("");
}

function pickPetStatus(kind) {
  const options = petStatusCatalog[kind] ?? petStatusCatalog.roaming;
  return options[Math.floor(Math.random() * options.length)];
}

function setPetStatus(mood, text) {
  dom.petMoodBadge.textContent = mood;
  dom.petStatusText.textContent = text;
}

function handlePetting() {
  const now = Date.now();
  if (now - petInteractCooldown < 180) {
    return;
  }

  petInteractCooldown = now;
  dom.petStage.classList.remove("is-happy");
  void dom.petStage.offsetWidth;
  dom.petStage.classList.add("is-happy");
  window.setTimeout(() => dom.petStage.classList.remove("is-happy"), 720);
  setPetStatus("Purring", pickPetStatus("pet"));
}

function updatePetFacing() {
  if (!petRoamState) {
    return;
  }

  dom.petStage.classList.toggle("is-facing-left", petRoamState.direction < 0);
}

function clampPetRoamPosition() {
  if (!petRoamState || !dom.petDock || !dom.petCompanion) {
    return;
  }

  const laneWidth = dom.petDock.clientWidth || 0;
  const companionWidth = dom.petCompanion.offsetWidth || 180;
  const maxX = Math.max(0, laneWidth - companionWidth);
  petRoamState.x = Math.max(0, Math.min(maxX, petRoamState.x));
}

function applyPetRoamPosition() {
  if (!petRoamState || !dom.petCompanion) {
    return;
  }

  const laneWidth = dom.petDock?.clientWidth || 0;
  const companionWidth = dom.petCompanion.offsetWidth || 180;
  const maxX = Math.max(0, laneWidth - companionWidth);

  dom.petCompanion.style.transform = `translate3d(${petRoamState.x}px, 0, 0)`;
  dom.petCompanion.classList.toggle("is-near-left", petRoamState.x < 24);
  dom.petCompanion.classList.toggle("is-near-right", maxX - petRoamState.x < 24);
  updatePetFacing();
}

function maybePausePetRoam(isPaused) {
  if (!petRoamState) {
    return;
  }

  petRoamState.isPaused = isPaused;
  dom.petCompanion.classList.toggle("is-open", isPaused);
  setPetStatus(isPaused ? "Watching" : "Roaming", pickPetStatus(isPaused ? "hover" : "roaming"));
}

function randomizePetRoamSpeed() {
  if (!petRoamState) {
    return;
  }

  petRoamState.speed = 18 + Math.random() * 20;
}

function stepPetRoam(timestamp) {
  if (!petRoamState) {
    return;
  }

  if (!petRoamState.lastTimestamp) {
    petRoamState.lastTimestamp = timestamp;
  }

  const delta = Math.min(48, timestamp - petRoamState.lastTimestamp);
  petRoamState.lastTimestamp = timestamp;

  if (!petRoamState.isPaused) {
    const laneWidth = dom.petDock?.clientWidth || 0;
    const companionWidth = dom.petCompanion?.offsetWidth || 180;
    const maxX = Math.max(0, laneWidth - companionWidth);

    petRoamState.x += petRoamState.direction * petRoamState.speed * (delta / 1000);

    if (petRoamState.x <= 0) {
      petRoamState.x = 0;
      petRoamState.direction = 1;
      randomizePetRoamSpeed();
    } else if (petRoamState.x >= maxX) {
      petRoamState.x = maxX;
      petRoamState.direction = -1;
      randomizePetRoamSpeed();
    }
  }

  applyPetRoamPosition();
  petRoamFrame = window.requestAnimationFrame(stepPetRoam);
}

function startPetRoam() {
  if (!dom.petDock || !dom.petCompanion) {
    return;
  }

  if (petRoamFrame) {
    window.cancelAnimationFrame(petRoamFrame);
  }

  petRoamState = {
    x: 12,
    direction: 1,
    speed: 24,
    isPaused: false,
    lastTimestamp: 0,
  };

  clampPetRoamPosition();
  applyPetRoamPosition();
  petRoamFrame = window.requestAnimationFrame(stepPetRoam);
}

function setupCyberPet() {
  setPetStatus("Roaming", pickPetStatus("roaming"));
  startPetRoam();

  dom.petStage.addEventListener("click", handlePetting);
  dom.petStage.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handlePetting();
    }
  });

  dom.petCompanion.addEventListener("pointerenter", () => {
    maybePausePetRoam(true);
  });

  dom.petCompanion.addEventListener("pointerleave", () => {
    maybePausePetRoam(false);
  });

  dom.petCompanion.addEventListener("focusin", () => {
    maybePausePetRoam(true);
  });

  dom.petCompanion.addEventListener("focusout", (event) => {
    if (!dom.petCompanion.contains(event.relatedTarget)) {
      maybePausePetRoam(false);
    }
  });

  window.addEventListener("resize", () => {
    clampPetRoamPosition();
    applyPetRoamPosition();
  });
}

function loadChatDockPreference() {
  try {
    const raw = window.localStorage.getItem(chatDockStateKey);
    if (raw === "open") {
      return true;
    }
    if (raw === "closed") {
      return false;
    }
  } catch {
    // Ignore storage failures and fall back to viewport-based defaults.
  }

  return false;
}

function persistChatDockPreference(isOpen) {
  try {
    window.localStorage.setItem(chatDockStateKey, isOpen ? "open" : "closed");
  } catch {
    // Ignore storage failures so the dock can still be toggled.
  }
}

function loadChatDockPosition() {
  try {
    const raw = window.localStorage.getItem(chatDockPositionKey);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);
    if (!Number.isFinite(parsed?.left) || !Number.isFinite(parsed?.top)) {
      return null;
    }

    return {
      left: parsed.left,
      top: parsed.top,
    };
  } catch {
    return null;
  }
}

function persistChatDockPosition(position) {
  try {
    if (!position) {
      window.localStorage.removeItem(chatDockPositionKey);
      return;
    }

    window.localStorage.setItem(chatDockPositionKey, JSON.stringify(position));
  } catch {
    // Ignore storage failures so dragging still works within the session.
  }
}

function clampChatDockPosition(position) {
  const rect = dom.chatDock.getBoundingClientRect();
  const width = Math.min(rect.width || 360, window.innerWidth - 24);
  const height = Math.min(rect.height || 120, window.innerHeight - 24);
  const maxLeft = Math.max(12, window.innerWidth - width - 12);
  const maxTop = Math.max(12, window.innerHeight - height - 12);

  return {
    left: Math.min(Math.max(12, position.left), maxLeft),
    top: Math.min(Math.max(12, position.top), maxTop),
  };
}

function applyChatDockPosition(position, { persist = true } = {}) {
  if (!position) {
    dom.chatDock.classList.remove("is-custom-position");
    dom.chatDock.style.left = "";
    dom.chatDock.style.top = "";
    dom.chatDock.style.right = "";
    dom.chatDock.style.bottom = "";
    if (persist) {
      persistChatDockPosition(null);
    }
    return;
  }

  const clamped = clampChatDockPosition(position);
  dom.chatDock.classList.add("is-custom-position");
  dom.chatDock.style.left = `${clamped.left}px`;
  dom.chatDock.style.top = `${clamped.top}px`;
  dom.chatDock.style.right = "auto";
  dom.chatDock.style.bottom = "auto";

  if (persist) {
    persistChatDockPosition(clamped);
  }
}

function setChatDockState(isOpen, { persist = true } = {}) {
  chatDockOpen = isOpen;
  dom.chatDock.classList.toggle("is-open", isOpen);
  dom.chatToggleButton.setAttribute("aria-expanded", String(isOpen));
  dom.chatToggleLabel.textContent = isOpen ? "\u6536\u8d77" : "\u804a\u5929";

  if (isOpen) {
    resetChatUnreadCount();
  }

  if (persist) {
    persistChatDockPreference(isOpen);
  }

  if (dom.chatDock.classList.contains("is-custom-position")) {
    applyChatDockPosition(
      {
        left: Number.parseFloat(dom.chatDock.style.left) || dom.chatDock.getBoundingClientRect().left,
        top: Number.parseFloat(dom.chatDock.style.top) || dom.chatDock.getBoundingClientRect().top,
      },
      { persist: true },
    );
  }
}

function setupChatDock() {
  chatUnreadCount = loadStoredInteger(chatUnreadKey);
  renderChatUnreadBadge();
  renderChatPreview();
  setChatDockState(loadChatDockPreference(), { persist: false });
  applyChatDockPosition(loadChatDockPosition(), { persist: false });

  dom.chatToggleButton.addEventListener("click", () => {
    if (Date.now() < chatSuppressToggleUntil) {
      return;
    }
    setChatDockState(!chatDockOpen);
  });

  dom.chatCollapseButton.addEventListener("click", () => {
    setChatDockState(false);
  });

  dom.chatDock.addEventListener("click", (event) => {
    if (chatDockOpen || Date.now() < chatSuppressToggleUntil) {
      return;
    }

    if (event.target.closest("#chatToggleButton")) {
      return;
    }

    setChatDockState(true);
  });

  setupChatDockDragging();
  window.addEventListener("resize", () => {
    if (dom.chatDock.classList.contains("is-custom-position")) {
      applyChatDockPosition(loadChatDockPosition(), { persist: false });
    }
  });
}

function setupChatDockDragging() {
  const handles = [dom.chatToggleButton, dom.chatDragHandle].filter(Boolean);

  handles.forEach((handle) => {
    handle.addEventListener("pointerdown", (event) => {
      if (event.button !== 0) {
        return;
      }

      if (event.target.closest("#chatCollapseButton")) {
        return;
      }

      const rect = dom.chatDock.getBoundingClientRect();
      chatDragState = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        left: rect.left,
        top: rect.top,
        moved: false,
      };

      handle.setPointerCapture?.(event.pointerId);
    });
  });

  window.addEventListener("pointermove", (event) => {
    if (!chatDragState || event.pointerId !== chatDragState.pointerId) {
      return;
    }

    const deltaX = event.clientX - chatDragState.startX;
    const deltaY = event.clientY - chatDragState.startY;

    if (!chatDragState.moved && Math.hypot(deltaX, deltaY) < chatDragThreshold) {
      return;
    }

    chatDragState.moved = true;
    dom.chatDock.classList.add("is-dragging");
    applyChatDockPosition(
      {
        left: chatDragState.left + deltaX,
        top: chatDragState.top + deltaY,
      },
      { persist: true },
    );
  });

  const endDragging = (event) => {
    if (!chatDragState || event.pointerId !== chatDragState.pointerId) {
      return;
    }

    if (chatDragState.moved) {
      chatSuppressToggleUntil = Date.now() + 220;
    }

    chatDragState = null;
    dom.chatDock.classList.remove("is-dragging");
  };

  window.addEventListener("pointerup", endDragging);
  window.addEventListener("pointercancel", endDragging);
}

function createChatMessageElement(message) {
  const wrapper = document.createElement("article");
  wrapper.className = `chat-message is-${message.role}`;

  const bubble = document.createElement("div");
  bubble.className = "chat-bubble";
  const content = document.createElement("div");
  content.className = "chat-markdown";
  content.innerHTML = renderMarkdown(message.content);
  bubble.append(content);

  const meta = document.createElement("p");
  meta.className = "chat-message-meta";
  meta.textContent = message.role === "user" ? "You" : message.label || "Agent";
  bubble.append(meta);
  wrapper.append(bubble);

  return wrapper;
}

function renderChatMessages() {
  dom.chatMessages.innerHTML = "";
  chatHistory.forEach((message) => {
    dom.chatMessages.append(createChatMessageElement(message));
  });
  dom.chatMessages.scrollTop = dom.chatMessages.scrollHeight;
  renderChatPreview();
}

function setChatPendingState(isPending) {
  chatPending = isPending;
  dom.chatSendButton.disabled = isPending || !getChatEndpoint();
  dom.chatInput.disabled = isPending || !getChatEndpoint();
  dom.chatShortcuts.forEach((button) => {
    button.disabled = isPending || !getChatEndpoint();
  });
  dom.chatSendButton.textContent = isPending ? "发送中..." : "发送";
}

async function sendChatMessage(messageText) {
  const endpoint = getChatEndpoint();
  if (!endpoint) {
    dom.chatHint.textContent = "先部署 Worker，并把 endpoint 写进 chat-config.js。";
    setChatDockState(true);
    return;
  }

  const trimmed = messageText.trim();
  if (!trimmed) {
    return;
  }

  setChatDockState(true);
  chatHistory.push({ role: "user", content: trimmed, label: "You" });
  chatHistory = chatHistory.slice(-maxChatTurns);
  persistChatHistory();
  renderChatMessages();
  dom.chatInput.value = "";
  dom.chatHint.textContent = "正在等待回复...";
  setChatPendingState(true);

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: chatHistory.map((message) => ({
          role: message.role,
          content: message.content,
        })),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `HTTP ${response.status}`);
    }

    const payload = await response.json();
    if (!payload.reply) {
      throw new Error("empty reply");
    }

    chatHistory.push({
      role: "assistant",
      content: payload.reply,
      label: payload.assistantName || chatConfig.assistantName || "Agent",
    });
    chatHistory = chatHistory.slice(-maxChatTurns);
    persistChatHistory();
    if (!chatDockOpen) {
      incrementChatUnreadCount();
    }
    renderChatMessages();
    dom.chatHint.textContent = "已连接聊天接口，可以继续追问。";
  } catch (error) {
    dom.chatHint.textContent = `聊天失败：${error.message}`;
  } finally {
    setChatPendingState(false);
  }
}

function setupChatInterface() {
  const endpoint = getChatEndpoint();
  chatHistory = loadChatHistory();
  if (!chatHistory.length) {
    chatHistory = [getDefaultChatMessage(Boolean(endpoint))];
    persistChatHistory();
  } else if (endpoint && chatHistory.length === 1 && chatHistory[0].label === "Setup") {
    chatHistory = [getDefaultChatMessage(true)];
    persistChatHistory();
  }

  dom.chatAvailability.textContent = endpoint ? "Live Chat" : "Needs Worker";
  dom.chatHint.textContent = endpoint
    ? "简短对话，默认保留最近几轮。"
    : "先部署 Worker 并配置 endpoint，聊天才会真正可用。";
  renderChatMessages();
  setChatPendingState(false);

  dom.chatForm.addEventListener("submit", (event) => {
    event.preventDefault();
    sendChatMessage(dom.chatInput.value);
  });

  dom.chatShortcuts.forEach((button) => {
    button.addEventListener("click", () => {
      sendChatMessage(button.dataset.chatShortcut ?? "");
    });
  });
}

function renderClock() {
  const now = new Date();
  dom.currentDate.textContent = "";
  dom.currentTime.textContent = new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(now);

  const parts = getShanghaiDateParts(now);
  const calendarKey = `${parts.year}-${parts.month}-${parts.day}`;
  if (calendarKey !== lastCalendarKey) {
    const previousMonthDate = new Date(Date.UTC(parts.year, parts.month - 2, 1, 12));
    if (
      calendarState.anchorYear === null ||
      (calendarState.anchorYear === previousMonthDate.getUTCFullYear() &&
        calendarState.anchorMonthIndex === previousMonthDate.getUTCMonth())
    ) {
      syncCalendarAnchor(parts);
    }

    renderCalendars(parts);
    lastCalendarKey = calendarKey;
  }
}

function getShanghaiDateParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(date);

  return {
    year: Number(parts.find((part) => part.type === "year")?.value),
    month: Number(parts.find((part) => part.type === "month")?.value),
    day: Number(parts.find((part) => part.type === "day")?.value),
  };
}

function getShanghaiDateKey(date = new Date()) {
  const parts = getShanghaiDateParts(date);
  return `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
}

function parseDateKey(dateKey) {
  const match = String(dateKey || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    return null;
  }

  const [, year, month, day] = match;
  return Date.UTC(Number(year), Number(month) - 1, Number(day), 12);
}

function getFeaturedPlaceStartIndex(featuredPlaces, generatedAt) {
  if (!featuredPlaces?.length) {
    return 0;
  }

  if (!generatedAt) {
    return 0;
  }

  const generatedDateKey = getShanghaiDateKey(new Date(generatedAt));
  const todayDateKey = getShanghaiDateKey(new Date());
  const generatedValue = parseDateKey(generatedDateKey);
  const todayValue = parseDateKey(todayDateKey);

  if (generatedValue === null || todayValue === null) {
    return 0;
  }

  const diffDays = Math.round((todayValue - generatedValue) / 86400000);
  const normalizedOffset =
    ((diffDays % featuredPlaces.length) + featuredPlaces.length) %
    featuredPlaces.length;

  return normalizedOffset;
}

function getMonthLabel(year, monthIndex) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
    timeZone: "Asia/Shanghai",
  }).format(new Date(Date.UTC(year, monthIndex, 1, 12)));
}

function syncCalendarAnchor(todayParts = getShanghaiDateParts()) {
  calendarState.anchorYear = todayParts.year;
  calendarState.anchorMonthIndex = todayParts.month - 1;
}

function shiftCalendarAnchor(monthOffset) {
  const next = new Date(
    Date.UTC(calendarState.anchorYear, calendarState.anchorMonthIndex + monthOffset, 1, 12),
  );
  calendarState.anchorYear = next.getUTCFullYear();
  calendarState.anchorMonthIndex = next.getUTCMonth();
}

function isCalendarOnTodayMonth(todayParts = getShanghaiDateParts()) {
  return (
    calendarState.anchorYear === todayParts.year &&
    calendarState.anchorMonthIndex === todayParts.month - 1
  );
}

function buildCalendarMonth(year, monthIndex, todayParts) {
  const weekdayLabels = ["一", "二", "三", "四", "五", "六", "日"];
  const firstWeekday = (new Date(Date.UTC(year, monthIndex, 1, 12)).getUTCDay() + 6) % 7;
  const daysInMonth = new Date(Date.UTC(year, monthIndex + 1, 0, 12)).getUTCDate();
  const cells = [];

  weekdayLabels.forEach((label) => {
    cells.push(`<span class="calendar-weekday">${label}</span>`);
  });

  for (let index = 0; index < 42; index += 1) {
    const dayNumber = index - firstWeekday + 1;

    if (dayNumber < 1 || dayNumber > daysInMonth) {
      cells.push(`<span class="calendar-day is-empty"></span>`);
      continue;
    }

    const isToday =
      todayParts.year === year &&
      todayParts.month === monthIndex + 1 &&
      todayParts.day === dayNumber;
    const dateKey = getDateKey(year, monthIndex + 1, dayNumber);
    const holidayLabel = chinaHolidayMap.get(dateKey);
    const weekday = (index % 7) + 1;
    const classNames = [
      "calendar-day",
      isToday ? "is-today" : "",
      holidayLabel ? "is-holiday" : "",
      weekday >= 6 ? "is-weekend" : "",
    ]
      .filter(Boolean)
      .join(" ");

    cells.push(`
      <span class="${classNames}" title="${holidayLabel ?? dateKey}">
        <span class="calendar-day-number">${dayNumber}</span>
        ${holidayLabel ? `<span class="calendar-day-label">${holidayLabel}</span>` : ""}
      </span>
    `);
  }

  return cells.join("");
}

function renderCalendars(todayParts) {
  if (calendarState.anchorYear === null || calendarState.anchorMonthIndex === null) {
    syncCalendarAnchor(todayParts);
  }

  const currentMonthIndex = calendarState.anchorMonthIndex;
  const currentMonthYear = calendarState.anchorYear;
  const nextMonthDate = new Date(Date.UTC(currentMonthYear, currentMonthIndex + 1, 1, 12));
  const nextMonthIndex = nextMonthDate.getUTCMonth();
  const nextMonthYear = nextMonthDate.getUTCFullYear();

  dom.currentMonthLabel.textContent = getMonthLabel(currentMonthYear, currentMonthIndex);
  dom.currentMonthCalendar.innerHTML = buildCalendarMonth(
    currentMonthYear,
    currentMonthIndex,
    todayParts,
  );

  dom.nextMonthLabel.textContent = getMonthLabel(nextMonthYear, nextMonthIndex);
  dom.nextMonthCalendar.innerHTML = buildCalendarMonth(
    nextMonthYear,
    nextMonthIndex,
    todayParts,
  );

  dom.calendarRangeHint.textContent = isCalendarOnTodayMonth(todayParts)
    ? "当前与下一个月"
    : `查看：${getMonthLabel(currentMonthYear, currentMonthIndex)} · ${getMonthLabel(nextMonthYear, nextMonthIndex)}`;
  dom.calendarToday.disabled = isCalendarOnTodayMonth(todayParts);
}

function getRequestedView() {
  const hashView = window.location.hash.replace("#", "").toLowerCase();
  return availableViews.has(hashView) ? hashView : "home";
}

function getArcMotionPoint(t, arcNav = document.querySelector(".arc-nav")) {
  const navHeight = arcNav?.clientHeight || Math.max(window.innerHeight - 44, 620);
  const visualHeight = navHeight - arcMotion.topInset * 2;
  const inverseT = 1 - t;
  const curveX =
    inverseT * inverseT * arcMotion.startX +
    2 * inverseT * t * arcMotion.controlX +
    t * t * arcMotion.endX;
  const x = arcMotion.leftInset + (curveX / arcMotion.viewWidth) * arcMotion.width;
  const y = arcMotion.topInset + t * visualHeight;
  const angle = (t - 0.5) * 34;

  return { x, y, angle };
}

function getArcNavigationSlot(offset, arcNav) {
  const slot = arcMotion.slots[offset] ?? arcMotion.slots[2];
  return {
    ...slot,
    ...getArcMotionPoint(slot.t, arcNav),
  };
}

function applyArcNavigationSlot(button, slot) {
  button.style.setProperty("--nav-x", `${slot.x}px`);
  button.style.setProperty("--nav-y", `${slot.y}px`);
  button.style.setProperty("--nav-angle", `${slot.angle}deg`);
  button.style.setProperty("--nav-scale", String(slot.scale));
  if (Number.isFinite(slot.t)) {
    button.dataset.arcT = String(slot.t);
  }
  if (Number.isFinite(slot.scale)) {
    button.dataset.arcScale = String(slot.scale);
  }
}

function animateArcNavigationItem(button, fromSlot, toSlot, arcNav, { removeWhenDone = false } = {}) {
  if (!window.matchMedia("(min-width: 1181px)").matches) {
    applyArcNavigationSlot(button, toSlot);
    if (removeWhenDone) {
      button.remove();
    }
    return;
  }

  if (button.arcAnimationFrame) {
    cancelAnimationFrame(button.arcAnimationFrame);
  }

  const start = performance.now();
  const ease = (value) => 0.5 - Math.cos(value * Math.PI) / 2;
  button.classList.add("is-arc-animating");
  applyArcNavigationSlot(button, fromSlot);

  const step = (timestamp) => {
    const progress = Math.min((timestamp - start) / arcMotion.duration, 1);
    const eased = ease(progress);
    const t = fromSlot.t + (toSlot.t - fromSlot.t) * eased;
    const motionPoint = getArcMotionPoint(t, arcNav);
    const scale = fromSlot.scale + (toSlot.scale - fromSlot.scale) * eased;

    applyArcNavigationSlot(button, { t, ...motionPoint, scale });

    if (progress < 1) {
      button.arcAnimationFrame = requestAnimationFrame(step);
      return;
    }

    button.classList.remove("is-arc-animating");
    button.arcAnimationFrame = null;
    applyArcNavigationSlot(button, toSlot);
    if (removeWhenDone) {
      button.remove();
    }
  };

  button.arcAnimationFrame = requestAnimationFrame(step);
}

function getCurrentArcNavigationSlot(button, fallbackOffset, arcNav) {
  const currentT = Number(button.dataset.arcT);
  const currentScale = Number(button.dataset.arcScale);

  if (Number.isFinite(currentT) && Number.isFinite(currentScale)) {
    return {
      t: currentT,
      scale: currentScale,
      ...getArcMotionPoint(currentT, arcNav),
    };
  }

  return getArcNavigationSlot(fallbackOffset, arcNav);
}

function getArcOffscreenSlot(edge, arcNav) {
  const slot = edge === "top" ? arcMotion.offTop : arcMotion.offBottom;
  return {
    ...slot,
    ...getArcMotionPoint(slot.t, arcNav),
  };
}

function removeArcGhosts(arcNav) {
  arcNav?.querySelectorAll(".arc-nav-ghost").forEach((ghost) => {
    if (ghost.arcAnimationFrame) {
      cancelAnimationFrame(ghost.arcAnimationFrame);
    }
    ghost.remove();
  });
}

function createArcNavigationGhost(sourceButton, fromSlot, toSlot, arcNav) {
  if (!arcNav) {
    return;
  }

  const ghost = document.createElement("span");
  ghost.className = "arc-nav-item arc-nav-ghost is-arc-animating";
  ghost.setAttribute("aria-hidden", "true");
  ghost.style.setProperty("--nav-abs-offset", String(Math.abs(Number(sourceButton.dataset.navOffset ?? 2))));
  ghost.innerHTML = sourceButton.querySelector(".sidebar-link-copy")?.outerHTML ?? sourceButton.innerHTML;
  applyArcNavigationSlot(ghost, fromSlot);
  arcNav.append(ghost);
  animateArcNavigationItem(ghost, fromSlot, toSlot, arcNav, { removeWhenDone: true });
}

function updateArcNavigation(activeView, { animate = true } = {}) {
  const buttons = dom.viewButtons.filter((button) => button.classList.contains("arc-nav-item"));
  const activeIndex = Math.max(navigationCycle.indexOf(activeView), 0);
  const arcNav = document.querySelector(".arc-nav");
  const direction =
    previousNavActiveIndex === null
      ? 0
      : ((activeIndex - previousNavActiveIndex + navigationCycle.length) % navigationCycle.length) === 1
        ? 1
        : ((previousNavActiveIndex - activeIndex + navigationCycle.length) % navigationCycle.length) === 1
          ? -1
          : 0;
  if (arcNav) {
    arcNav.style.setProperty("--arc-spin", "0deg");
    arcNav.dataset.navDirection = direction > 0 ? "forward" : direction < 0 ? "backward" : "still";
    removeArcGhosts(arcNav);
  }

  buttons.forEach((button) => {
    const itemIndex = navigationCycle.indexOf(button.dataset.viewTarget);
    const step = (itemIndex - activeIndex + navigationCycle.length) % navigationCycle.length;
    const offset = step === navigationCycle.length - 1 ? -1 : step;
    const slot = getArcNavigationSlot(offset, arcNav);
    const previousOffset = Number(button.dataset.navOffset ?? offset);
    const previousSlot = getCurrentArcNavigationSlot(button, previousOffset, arcNav);
    const isForwardWrap = direction > 0 && previousOffset === -1 && offset === 2;
    const isBackwardWrap = direction < 0 && previousOffset === 2 && offset === -1;
    button.classList.remove("is-wrap-forward", "is-wrap-backward");
    button.style.setProperty("--nav-offset", String(offset));
    button.style.setProperty("--nav-abs-offset", String(Math.abs(offset)));
    if (animate && previousNavActiveIndex !== null && isForwardWrap) {
      createArcNavigationGhost(button, previousSlot, getArcOffscreenSlot("top", arcNav), arcNav);
      animateArcNavigationItem(button, getArcOffscreenSlot("bottom", arcNav), slot, arcNav);
    } else if (animate && previousNavActiveIndex !== null && isBackwardWrap) {
      createArcNavigationGhost(button, previousSlot, getArcOffscreenSlot("bottom", arcNav), arcNav);
      animateArcNavigationItem(button, getArcOffscreenSlot("top", arcNav), slot, arcNav);
    } else if (animate && previousNavActiveIndex !== null && previousOffset !== offset && direction !== 0) {
      animateArcNavigationItem(button, previousSlot, slot, arcNav);
    } else {
      applyArcNavigationSlot(button, slot);
    }
    button.dataset.navOffset = String(offset);
    button.toggleAttribute("hidden", false);
  });
  previousNavActiveIndex = activeIndex;
}

function setActiveView(viewName, { updateHash = true } = {}) {
  const safeView = availableViews.has(viewName) ? viewName : "home";
  const previousView = document.body.dataset.activeView;
  document.documentElement.dataset.activeView = safeView;
  document.body.dataset.activeView = safeView;

  dom.viewButtons.forEach((button) => {
    const isActive = button.dataset.viewTarget === safeView;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });

  dom.views.forEach((view) => {
    view.classList.toggle("is-active", view.dataset.view === safeView);
  });

  if (updateHash) {
    window.history.replaceState(null, "", `#${safeView}`);
  }

  if (previousView && previousView !== safeView) {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }

  updateArcNavigation(safeView);
}

function normalizeShortcutUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) {
    return "";
  }

  const withProtocol = /^[a-z][a-z0-9+.-]*:\/\//i.test(raw) ? raw : `https://${raw}`;

  try {
    const parsed = new URL(withProtocol);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return "";
    }
    parsed.hash = "";
    return parsed.toString();
  } catch {
    return "";
  }
}

function getShortcutDomain(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function inferShortcutTitle(url) {
  const domain = getShortcutDomain(url);
  if (!domain) {
    return "Shortcut";
  }

  const first = domain.split(".")[0] || domain;
  return first
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getShortcutIcon(url) {
  const domain = getShortcutDomain(url);
  return domain
    ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`
    : "";
}

function getShortcutInitial(title) {
  return String(title || "S")
    .trim()
    .charAt(0)
    .toUpperCase() || "S";
}

function normalizeShortcutList(value) {
  const list = Array.isArray(value) ? value : defaultShortcuts;
  return list
    .map((item) => {
      const url = normalizeShortcutUrl(item?.url);
      if (!url) {
        return null;
      }

      return {
        title: String(item?.title || inferShortcutTitle(url)).trim().slice(0, 28),
        url,
        icon: String(item?.icon || getShortcutIcon(url)),
      };
    })
    .filter(Boolean)
    .slice(0, maxShortcuts);
}

function loadShortcuts() {
  try {
    const raw = window.localStorage.getItem(shortcutStorageKey);
    return normalizeShortcutList(raw ? JSON.parse(raw) : defaultShortcuts);
  } catch {
    return normalizeShortcutList(defaultShortcuts);
  }
}

function saveShortcuts(shortcuts) {
  try {
    window.localStorage.setItem(shortcutStorageKey, JSON.stringify(shortcuts));
  } catch {
    // The dashboard still works when storage is unavailable.
  }
}

function renderShortcutPager(pageCount) {
  if (!dom.shortcutPager) {
    return;
  }

  dom.shortcutPager.hidden = pageCount <= 1;
  dom.shortcutPager.innerHTML =
    pageCount > 1
      ? Array.from(
          { length: pageCount },
          (_, index) => `
            <button
              class="shortcut-page-dot${index === shortcutPageIndex ? " is-active" : ""}"
              type="button"
              data-shortcut-page="${index}"
              aria-label="Shortcut page ${index + 1}"
              aria-current="${index === shortcutPageIndex ? "page" : "false"}"
            ></button>
          `,
        ).join("")
      : "";
}

function renderShortcutCard({ shortcut, index }) {
  const title = escapeHtml(shortcut.title);
  const url = escapeHtml(shortcut.url);
  const icon = escapeHtml(shortcut.icon);

  return `
    <article class="shortcut-card${shortcutEditMode ? " is-editing" : ""}">
      <a href="${url}" target="_blank" rel="noreferrer" aria-label="Open ${title}" title="${title}">
        <span class="shortcut-icon-wrap">
          <span class="shortcut-icon-fallback">${escapeHtml(getShortcutInitial(shortcut.title))}</span>
          <img src="${icon}" alt="" loading="lazy" onerror="this.remove()" />
        </span>
        <span class="shortcut-title">${title}</span>
      </a>
      <button class="shortcut-delete-button" type="button" data-shortcut-action="remove" data-shortcut-index="${index}" aria-label="Remove ${title}"></button>
    </article>
  `;
}

function renderShortcutAddCard() {
  return `
    <article class="shortcut-card shortcut-add-card">
      <button type="button" data-shortcut-action="add" aria-label="Add shortcut">
        <span class="shortcut-icon-wrap shortcut-add-icon" aria-hidden="true"></span>
        <span class="shortcut-title">添加</span>
      </button>
    </article>
  `;
}

function renderShortcuts(shortcuts = loadShortcuts()) {
  if (!dom.shortcutGrid) {
    return;
  }

  const entries = shortcuts.map((shortcut, index) => ({ type: "shortcut", shortcut, index }));

  if (shortcutEditMode) {
    entries.push({ type: "add" });
  }

  const pageCount = Math.max(1, Math.ceil(entries.length / shortcutsPerPage));
  shortcutPageIndex = Math.min(Math.max(shortcutPageIndex, 0), pageCount - 1);

  const pageEntries = entries.slice(
    shortcutPageIndex * shortcutsPerPage,
    shortcutPageIndex * shortcutsPerPage + shortcutsPerPage,
  );

  dom.shortcutGrid.innerHTML = pageEntries
    .map((entry) => (entry.type === "add" ? renderShortcutAddCard() : renderShortcutCard(entry)))
    .join("");
  renderShortcutPager(pageCount);
}

function addShortcut(urlValue, options = {}) {
  const url = normalizeShortcutUrl(urlValue);
  if (!url) {
    return false;
  }

  const shortcuts = loadShortcuts().filter((item) => item.url !== url);
  const title = String(options.title || inferShortcutTitle(url)).trim().slice(0, 28);
  shortcuts.push({
    title: title || inferShortcutTitle(url),
    url,
    icon: String(options.icon || getShortcutIcon(url)),
  });
  shortcutPageIndex = Math.floor((shortcuts.length - 1) / shortcutsPerPage);
  saveShortcuts(shortcuts);
  renderShortcuts(shortcuts);
  return true;
}

function setShortcutEditMode(isEditing) {
  shortcutEditMode = isEditing;
  dom.homeShortcutsPanel?.classList.toggle("is-editing", shortcutEditMode);
  try {
    window.localStorage.setItem(shortcutEditStorageKey, shortcutEditMode ? "1" : "0");
  } catch {
    // Edit mode preference is optional.
  }
  renderShortcuts();
}

function buildShortcutDraft(urlValue) {
  const url = normalizeShortcutUrl(urlValue);
  const domain = url ? getShortcutDomain(url) : "";

  return {
    url,
    domain,
    title: url ? inferShortcutTitle(url) : "",
    icon: url ? getShortcutIcon(url) : "",
  };
}

function syncShortcutDialogPreview() {
  const draft = buildShortcutDraft(dom.shortcutDialogUrl?.value);
  const titleInput = dom.shortcutDialogTitleInput;

  if (titleInput && !shortcutDialogTitleTouched) {
    titleInput.value = draft.title;
  }

  const title = titleInput?.value.trim() || draft.title || "Shortcut";
  const domain = draft.domain || "example.com";
  const initial = getShortcutInitial(title);

  if (dom.shortcutDialogPreviewName) {
    dom.shortcutDialogPreviewName.textContent = title;
  }

  if (dom.shortcutDialogPreviewDomain) {
    dom.shortcutDialogPreviewDomain.textContent = domain;
  }

  if (dom.shortcutDialogInitial) {
    dom.shortcutDialogInitial.textContent = initial;
  }

  if (dom.shortcutDialogIcon) {
    dom.shortcutDialogIcon.hidden = !draft.icon;
    if (draft.icon) {
      dom.shortcutDialogIcon.src = draft.icon;
    }
  }

  const submitButton = dom.shortcutDialogForm?.querySelector("[data-shortcut-dialog-submit]");
  if (submitButton) {
    submitButton.disabled = !draft.url;
  }
}

function openShortcutDialog(initialUrl = "") {
  if (!dom.shortcutDialog) {
    return;
  }

  shortcutDialogTitleTouched = false;

  if (dom.shortcutDialogUrl) {
    dom.shortcutDialogUrl.value = initialUrl;
  }

  if (dom.shortcutDialogTitleInput) {
    dom.shortcutDialogTitleInput.value = "";
  }

  syncShortcutDialogPreview();
  dom.shortcutDialog.hidden = false;
  window.requestAnimationFrame(() => dom.shortcutDialogUrl?.focus());
}

function closeShortcutDialog() {
  if (dom.shortcutDialog) {
    dom.shortcutDialog.hidden = true;
  }
}

function setSearchEngineMenuOpen(isOpen) {
  if (!dom.searchEngineButton || !dom.searchEngineMenu) {
    return;
  }

  dom.searchEngineButton.setAttribute("aria-expanded", String(isOpen));
  dom.searchEngineMenu.hidden = !isOpen;
}

function setSearchEngine(engine, { persist = true } = {}) {
  activeSearchEngine = searchEngines[engine] ? engine : "bing";
  const config = searchEngines[activeSearchEngine];

  if (dom.searchEngineIcon) {
    dom.searchEngineIcon.className = `search-engine-logo is-${activeSearchEngine}`;
    dom.searchEngineIcon.src = config.logo;
    dom.searchEngineIcon.alt = "";
  }

  if (dom.searchEngineButton) {
    dom.searchEngineButton.setAttribute("aria-label", `Search with ${config.label}`);
    dom.searchEngineButton.title = config.label;
  }

  if (dom.homeSearchInput) {
    dom.homeSearchInput.placeholder = config.placeholder;
  }

  dom.searchEngineOptions.forEach((option) => {
    const isSelected = option.dataset.searchEngineOption === activeSearchEngine;
    option.classList.toggle("is-selected", isSelected);
    option.setAttribute("aria-selected", String(isSelected));
  });

  if (persist) {
    window.localStorage.setItem(searchEngineStorageKey, activeSearchEngine);
  }
}

function setupHomeSearchAndShortcuts() {
  const savedEngine = window.localStorage.getItem(searchEngineStorageKey);
  setSearchEngine(searchEngines[savedEngine] ? savedEngine : "bing", { persist: false });
  shortcutEditMode = window.localStorage.getItem(shortcutEditStorageKey) === "1";
  dom.homeShortcutsPanel?.classList.toggle("is-editing", shortcutEditMode);

  dom.searchEngineButton?.addEventListener("click", (event) => {
    event.stopPropagation();
    const isOpen = dom.searchEngineButton.getAttribute("aria-expanded") === "true";
    setSearchEngineMenuOpen(!isOpen);
  });

  dom.searchEngineMenu?.addEventListener("click", (event) => {
    const option = event.target.closest("[data-search-engine-option]");
    if (!option) {
      return;
    }

    setSearchEngine(option.dataset.searchEngineOption);
    setSearchEngineMenuOpen(false);
    dom.homeSearchInput?.focus();
  });

  document.addEventListener("click", (event) => {
    if (!event.target.closest("#searchEnginePicker")) {
      setSearchEngineMenuOpen(false);
    }

    if (!shortcutEditMode || !(event.target instanceof Element)) {
      return;
    }

    const shouldKeepEditMode = Boolean(
      event.target.closest(
        "#shortcutDialog, [data-shortcut-action], [data-shortcut-page], .shortcut-dialog-card",
      ),
    );

    if (!shouldKeepEditMode) {
      setShortcutEditMode(false);
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      setSearchEngineMenuOpen(false);
      closeShortcutDialog();
    }
  });

  dom.homeSearchForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const query = dom.homeSearchInput?.value.trim();
    if (!query) {
      return;
    }

    const directUrl = normalizeShortcutUrl(query);
    const searchUrl = searchEngines[activeSearchEngine].buildUrl(query);
    const target = /\s/.test(query) || !query.includes(".") ? searchUrl : directUrl;
    window.open(target, "_blank", "noopener,noreferrer");
  });

  dom.shortcutAddForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    if (addShortcut(dom.shortcutUrlInput?.value)) {
      dom.shortcutUrlInput.value = "";
      dom.shortcutUrlInput.focus();
    }
  });

  dom.homeShortcutsPanel?.addEventListener("contextmenu", (event) => {
    event.preventDefault();
    const addButton = event.target.closest("[data-shortcut-action='add']");
    if (addButton) {
      setShortcutEditMode(true);
      openShortcutDialog();
      return;
    }

    setShortcutEditMode(!shortcutEditMode);
  });

  dom.shortcutGrid?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-shortcut-action]");
    if (!button) {
      const shortcutLink = event.target.closest(".shortcut-card a");
      if (shortcutEditMode && shortcutLink) {
        event.preventDefault();
        setShortcutEditMode(false);
      }
      return;
    }

    const shortcuts = loadShortcuts();
    const action = button.dataset.shortcutAction;

    if (action === "add") {
      setShortcutEditMode(true);
      openShortcutDialog();
      return;
    }

    const index = Number(button.dataset.shortcutIndex);
    if (!Number.isInteger(index) || !shortcuts[index]) {
      return;
    }

    if (action === "remove") {
      shortcuts.splice(index, 1);
      saveShortcuts(shortcuts);
      setShortcutEditMode(true);
    }
  });

  dom.shortcutPager?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-shortcut-page]");
    if (!button) {
      return;
    }

    shortcutPageIndex = Number(button.dataset.shortcutPage);
    renderShortcuts();
  });

  dom.shortcutDialogUrl?.addEventListener("input", () => {
    syncShortcutDialogPreview();
  });

  dom.shortcutDialogTitleInput?.addEventListener("input", () => {
    shortcutDialogTitleTouched = true;
    syncShortcutDialogPreview();
  });

  dom.shortcutDialogIcon?.addEventListener("error", () => {
    dom.shortcutDialogIcon.hidden = true;
  });

  dom.shortcutDialogCloseButtons.forEach((button) => {
    button.addEventListener("click", () => {
      closeShortcutDialog();
    });
  });

  dom.shortcutDialogForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const draft = buildShortcutDraft(dom.shortcutDialogUrl?.value);
    const title = dom.shortcutDialogTitleInput?.value.trim() || draft.title;

    if (addShortcut(draft.url, { title, icon: draft.icon })) {
      setShortcutEditMode(true);
      closeShortcutDialog();
    } else {
      dom.shortcutDialogUrl?.focus();
    }
  });

  dom.shortcutResetButton?.addEventListener("click", () => {
    const shortcuts = normalizeShortcutList(defaultShortcuts);
    saveShortcuts(shortcuts);
    renderShortcuts(shortcuts);
  });

  renderShortcuts();
}

function formatStockPrice(value) {
  return Number.isFinite(value)
    ? new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 2,
      }).format(value)
    : "Watching";
}

function formatStockChange(value, percent) {
  if (!Number.isFinite(value) || !Number.isFinite(percent)) {
    return "Open market";
  }

  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(2)} / ${sign}${percent.toFixed(2)}%`;
}

async function fetchStockQuote(symbol) {
  const endpoint = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
    symbol,
  )}?range=1d&interval=5m`;

  const response = await fetch(endpoint);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const result = (await response.json())?.chart?.result?.[0];
  const meta = result?.meta ?? {};
  const price = Number(meta.regularMarketPrice);
  const previous = Number(meta.chartPreviousClose || meta.previousClose);
  const change = Number.isFinite(price) && Number.isFinite(previous) ? price - previous : NaN;
  const percent = Number.isFinite(change) && previous ? (change / previous) * 100 : NaN;

  return {
    symbol,
    name: meta.shortName || symbol,
    price: formatStockPrice(price),
    change: formatStockChange(change, percent),
    state: Number.isFinite(change) ? (change >= 0 ? "up" : "down") : "neutral",
  };
}

function renderStockList(items) {
  if (!dom.stockTickerList) {
    return;
  }

  dom.stockTickerList.innerHTML = items
    .map(
      (item) => `
        <a class="stock-row is-${item.state}" href="https://finance.yahoo.com/quote/${encodeURIComponent(
          item.symbol,
        )}" target="_blank" rel="noreferrer">
          <span>
            <strong>${escapeHtml(item.symbol)}</strong>
            <small>${escapeHtml(item.name)}</small>
          </span>
          <span class="stock-values">
            <strong>${escapeHtml(item.price)}</strong>
            <small>${escapeHtml(item.change)}</small>
          </span>
        </a>
      `,
    )
    .join("");
}

async function loadStockWidget() {
  renderStockList(stockFallbacks);

  try {
    const quotes = await Promise.all(stockSymbols.map((symbol) => fetchStockQuote(symbol)));
    renderStockList(quotes);
    dom.stockUpdatedAt.textContent = "Live";
  } catch {
    dom.stockUpdatedAt.textContent = "Watchlist";
  }
}

function getNextViewByDirection(direction) {
  const currentView = document.body.dataset.activeView || getRequestedView();
  const currentIndex = Math.max(navigationCycle.indexOf(currentView), 0);
  const nextIndex =
    (currentIndex + direction + navigationCycle.length) % navigationCycle.length;
  return navigationCycle[nextIndex];
}

function getScrollableAncestor(target) {
  let element = target instanceof Element ? target : null;

  while (element && element !== document.body && element !== document.documentElement) {
    const style = window.getComputedStyle(element);
    const canScrollY = /(auto|scroll)/.test(style.overflowY);

    if (canScrollY && element.scrollHeight > element.clientHeight + 1) {
      return element;
    }

    element = element.parentElement;
  }

  return null;
}

function canScrollElementInDirection(element, deltaY) {
  if (!element) {
    return false;
  }

  if (deltaY > 0) {
    return element.scrollTop + element.clientHeight < element.scrollHeight - 1;
  }

  return element.scrollTop > 1;
}

function canScrollPageInDirection(deltaY) {
  const element = document.scrollingElement || document.documentElement;

  if (deltaY > 0) {
    return element.scrollTop + window.innerHeight < element.scrollHeight - 1;
  }

  return element.scrollTop > 1;
}

function shouldIgnoreWheelNavigation(event) {
  const target = event.target instanceof Element ? event.target : null;

  if (!target) {
    return true;
  }

  if (dom.shortcutDialog && !dom.shortcutDialog.hidden) {
    return true;
  }

  return Boolean(target.closest("input, textarea, select, [contenteditable='true']"));
}

function handleWheelViewNavigation(event) {
  if (shouldIgnoreWheelNavigation(event) || Math.abs(event.deltaY) <= Math.abs(event.deltaX)) {
    return;
  }

  const target = event.target instanceof Element ? event.target : null;
  const isNavWheel = Boolean(target?.closest(".arc-sidebar"));
  const isHomeView = document.body.dataset.activeView === "home";

  if (!isNavWheel && !isHomeView) {
    const scroller = getScrollableAncestor(target);

    if (
      canScrollElementInDirection(scroller, event.deltaY) ||
      (!scroller && canScrollPageInDirection(event.deltaY))
    ) {
      return;
    }
  }

  event.preventDefault();
  wheelNavigationDelta += event.deltaY;

  if (Math.abs(wheelNavigationDelta) < 72) {
    return;
  }

  const now = window.performance.now();
  if (now - wheelNavigationLastAt < arcMotion.duration + 80) {
    wheelNavigationDelta = 0;
    return;
  }

  const direction = wheelNavigationDelta > 0 ? 1 : -1;
  wheelNavigationDelta = 0;
  wheelNavigationLastAt = now;
  setActiveView(getNextViewByDirection(direction));
}

function setupViewNavigation() {
  dom.viewButtons.forEach((button) => {
    button.addEventListener("click", () => {
      setActiveView(button.dataset.viewTarget);
    });
  });

  window.addEventListener("hashchange", () => {
    setActiveView(getRequestedView(), { updateHash: false });
  });

  window.addEventListener("resize", () => {
    updateArcNavigation(document.body.dataset.activeView || getRequestedView(), { animate: false });
  });

  window.addEventListener("wheel", handleWheelViewNavigation, { passive: false });

  setActiveView(getRequestedView(), { updateHash: false });
}

function setupCalendarNavigation() {
  dom.calendarPrev.addEventListener("click", () => {
    shiftCalendarAnchor(-1);
    renderCalendars(getShanghaiDateParts());
  });

  dom.calendarNext.addEventListener("click", () => {
    shiftCalendarAnchor(1);
    renderCalendars(getShanghaiDateParts());
  });

  dom.calendarToday.addEventListener("click", () => {
    syncCalendarAnchor(getShanghaiDateParts());
    renderCalendars(getShanghaiDateParts());
  });
}

function clearElement(element) {
  element.innerHTML = "";
}

function hashString(value) {
  let result = 7;

  for (const character of value) {
    result = ((result << 5) - result + character.codePointAt(0)) | 0;
  }

  return Math.abs(result);
}

function hasUsableNewsImage(url) {
  if (!url) {
    return false;
  }

  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    return (
      /^https?:$/.test(parsed.protocol) &&
      !host.includes("googleusercontent.com") &&
      !host.includes("gstatic.com") &&
      !host.includes("news.google.com")
    );
  } catch {
    return false;
  }
}

function pickNewsFallback(section, key) {
  const pool = newsFallbacks[section] ?? newsFallbacks.international;
  return pool[hashString(key) % pool.length];
}

function getNewsBackground(section, item, index) {
  if (hasUsableNewsImage(item.image)) {
    return item.image;
  }
  return "";
}

function renderEmpty(element) {
  clearElement(element);
  element.append(dom.emptyStateTemplate.content.cloneNode(true));
}

function renderWeather(weather) {
  const condition = weatherCodeMap[weather.current.weatherCode] ?? "天气更新中";
  dom.weatherCurrent.classList.remove("skeleton");
  dom.weatherLocation.textContent = weather.location;
  dom.weatherCondition.textContent = condition;
  dom.weatherTemperature.textContent = `${weather.current.temperature}°C`;
  dom.weatherDescription.textContent = `${condition} · 海淀区实时天气`;
  dom.weatherWind.textContent = `风速 ${weather.current.windSpeed} km/h`;
  dom.weatherRange.textContent = `气温 ${weather.today.max}° / ${weather.today.min}°`;
  dom.weatherRain.textContent = `降水 ${weather.today.precipitationProbability}%`;
  dom.weatherVisual.src = getWeatherVisual(weather.current.weatherCode);
  dom.weatherVisual.alt = `${condition} animation`;

  clearElement(dom.weatherDaily);
  weather.forecast.forEach((day) => {
    const node = document.createElement("article");
    node.className = "forecast-card";
    node.innerHTML = `
      <p class="date">${formatDate(day.date)}</p>
      <div class="temp">${day.max}° / ${day.min}°</div>
      <p>${weatherCodeMap[day.weatherCode] ?? "天气更新中"}</p>
      <p>降水 ${day.precipitationProbability}%</p>
    `;
    dom.weatherDaily.append(node);
  });
}

function getHomeWeatherLabel(weatherCode) {
  const labels = {
    0: "晴",
    1: "大部晴朗",
    2: "多云",
    3: "阴",
    45: "有雾",
    48: "雾凇",
    51: "小毛毛雨",
    53: "毛毛雨",
    55: "较强毛毛雨",
    61: "小雨",
    63: "中雨",
    65: "大雨",
    71: "小雪",
    73: "中雪",
    75: "大雪",
    80: "阵雨",
    81: "阵雨",
    82: "强阵雨",
    95: "雷暴",
    96: "雷阵雨",
    99: "强雷阵雨",
  };

  return labels[weatherCode] ?? "更新中";
}

function getWeatherKind(weatherCode) {
  if ([45, 48].includes(weatherCode)) {
    return "fog";
  }
  if ([71, 73, 75].includes(weatherCode)) {
    return "snow";
  }
  if ([95, 96, 99].includes(weatherCode)) {
    return "storm";
  }
  if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(weatherCode)) {
    return "rain";
  }
  if ([2, 3].includes(weatherCode)) {
    return "cloudy";
  }
  return "clear";
}

function getAirQualityLevel(aqi) {
  if (!Number.isFinite(aqi)) {
    return "暂无";
  }
  if (aqi <= 50) return "优";
  if (aqi <= 100) return "良";
  if (aqi <= 150) return "轻度";
  if (aqi <= 200) return "中度";
  if (aqi <= 300) return "重度";
  return "严重";
}

function formatHomeForecastDate(value, timeZone) {
  return new Intl.DateTimeFormat("zh-CN", {
    weekday: "short",
    ...(timeZone ? { timeZone } : {}),
  }).format(new Date(value));
}

function formatHomeForecastMonthDay(value, timeZone) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    ...(timeZone ? { timeZone } : {}),
  }).format(new Date(value));
}

function formatHomeHour(value, timeZone) {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    ...(timeZone ? { timeZone } : {}),
  }).format(new Date(value));
}

function buildTemperatureCurve(points, key, { width = 320, height = 82 } = {}) {
  const values = points.map((point) => Number(point[key])).filter(Number.isFinite);
  if (values.length < 2) {
    return "";
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(max - min, 1);
  const xStep = width / Math.max(points.length - 1, 1);
  const coordinates = points.map((point, index) => {
    const value = Number(point[key]);
    const y = height - 14 - ((value - min) / range) * (height - 28);
    return { x: index * xStep, y, value };
  });

  const path = coordinates.reduce((result, point, index) => {
    if (index === 0) {
      return `M${point.x.toFixed(1)} ${point.y.toFixed(1)}`;
    }
    const previous = coordinates[index - 1];
    const middleX = (previous.x + point.x) / 2;
    return `${result} C${middleX.toFixed(1)} ${previous.y.toFixed(1)}, ${middleX.toFixed(1)} ${point.y.toFixed(1)}, ${point.x.toFixed(1)} ${point.y.toFixed(1)}`;
  }, "");
  const dots = coordinates
    .map((point) => `<circle cx="${point.x.toFixed(1)}" cy="${point.y.toFixed(1)}" r="3.6"></circle>`)
    .join("");

  return `
    <svg class="weather-temp-curve is-${key}" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" aria-hidden="true">
      <path d="${path}"></path>
      ${dots}
    </svg>
  `;
}

function renderHourlyWeather(weather, timeZone) {
  if (!dom.weatherHourly) {
    return;
  }

  const hourly = (weather.hourly?.length ? weather.hourly : buildFallbackHourlyWeather(weather)).slice(0, 6);
  dom.weatherHourly.innerHTML = hourly.length
    ? `
      <div class="weather-strip-title">逐小时预报</div>
      <div class="weather-hourly-strip">
        ${hourly
          .map(
            (hour) => `
              <article class="weather-hour-card">
                <span>${formatHomeHour(hour.time, timeZone)}</span>
                <em>${getHomeWeatherLabel(hour.weatherCode)}</em>
                <strong>${hour.temperature}&deg;</strong>
              </article>
            `,
          )
          .join("")}
      </div>
    `
    : "";
}

function buildFallbackHourlyWeather(weather) {
  const currentTemperature = Number(weather.current?.temperature ?? weather.today?.max ?? 0);
  const currentCode = weather.current?.weatherCode ?? weather.today?.weatherCode ?? 0;
  const currentHour = new Date();
  currentHour.setMinutes(0, 0, 0);

  return Array.from({ length: 6 }, (_, index) => ({
    time: new Date(currentHour.getTime() + index * 60 * 60 * 1000).toISOString(),
    temperature: Math.round(currentTemperature + Math.sin(index * 0.85) * 1.6 - index * 0.28),
    weatherCode: currentCode,
    precipitationProbability: weather.today?.precipitationProbability ?? 0,
  }));
}

function renderDailyWeather(weather, timeZone) {
  if (!dom.weatherDaily) {
    return;
  }

  const forecast = (weather.forecast ?? []).slice(0, 5);
  if (!forecast.length) {
    clearElement(dom.weatherDaily);
    return;
  }

  dom.weatherDaily.innerHTML = `
    <div class="weather-strip-title">多日预报</div>
    <div class="weather-daily-row">
      ${forecast
        .map(
          (day, index) => `
            <article class="weather-day-card">
              <span>${index === 0 ? "今天" : formatHomeForecastDate(day.date, timeZone)}</span>
              <small>${formatHomeForecastMonthDay(day.date, timeZone)}</small>
              <em>${getHomeWeatherLabel(day.weatherCode)}</em>
              <strong>${day.max}&deg;</strong>
              <b>${day.min}&deg;</b>
            </article>
          `,
        )
        .join("")}
    </div>
    <div class="weather-curve-stack">
      ${buildTemperatureCurve(forecast, "max")}
      ${buildTemperatureCurve(forecast, "min")}
    </div>
  `;
}

function renderHomeWeather(weather, options = {}) {
  if (!weather?.current || !dom.weatherCurrent) {
    return;
  }

  const condition = getHomeWeatherLabel(weather.current.weatherCode);
  const locationLabel = options.locationLabel || weather.location || "自动定位";
  const timeZone = options.timeZone;
  const aqi = Number(weather.airQuality?.aqi);
  const aqiText = Number.isFinite(aqi) ? `AQI ${Math.round(aqi)} ${getAirQualityLevel(aqi)}` : "空气质量 --";
  dom.weatherCurrent.classList.remove("skeleton");
  if (dom.weatherPanelLabel) {
    dom.weatherPanelLabel.textContent = "天气";
  }
  if (dom.weatherTitle) {
    dom.weatherTitle.textContent = locationLabel;
  }
  if (dom.weatherRefreshButton) {
    dom.weatherRefreshButton.textContent = "刷新";
    dom.weatherRefreshButton.disabled = false;
    dom.weatherRefreshButton.classList.remove("is-loading");
    dom.weatherRefreshButton.setAttribute("aria-label", `刷新${locationLabel}天气`);
  }
  dom.weatherLocation.textContent = locationLabel;
  dom.weatherCondition.textContent = condition;
  dom.weatherTemperature.textContent = `${weather.current.temperature}\u00b0C`;
  if (dom.weatherAirQuality) {
    dom.weatherAirQuality.textContent = aqiText;
  }
  if (dom.weatherDescription) {
    dom.weatherDescription.textContent = "";
  }
  dom.weatherWind.textContent = `风速 ${weather.current.windSpeed} km/h`;
  dom.weatherRange.textContent = `${weather.today.max}\u00b0 / ${weather.today.min}\u00b0`;
  dom.weatherRain.textContent = `降水 ${weather.today.precipitationProbability}%`;
  if (dom.weatherVisual) {
    dom.weatherVisual.className = "home-weather-icon";
    dom.weatherVisual.src = getWeatherVisual(weather.current.weatherCode);
    dom.weatherVisual.alt = `${condition}动画`;
  }

  renderHourlyWeather(weather, timeZone);
  renderDailyWeather(weather, timeZone);
}

function getBrowserPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation unavailable"));
      return;
    }

    const fallbackTimer = window.setTimeout(() => {
      reject(new Error("Geolocation timed out"));
    }, 3600);
    const finish = (callback) => (value) => {
      window.clearTimeout(fallbackTimer);
      callback(value);
    };

    navigator.geolocation.getCurrentPosition(finish(resolve), finish(reject), {
      enableHighAccuracy: false,
      maximumAge: 1000 * 60 * 30,
      timeout: 3500,
    });
  });
}

function pickReverseGeocodeDistrict(payload) {
  const administrative = Array.isArray(payload?.localityInfo?.administrative)
    ? payload.localityInfo.administrative
    : [];
  return administrative.find((item) => [8, 9, 10].includes(Number(item.adminLevel)))?.name ?? "";
}

function formatReverseGeocodeLabel(payload) {
  const city = payload?.city || payload?.locality || payload?.principalSubdivision || "";
  const district = pickReverseGeocodeDistrict(payload);
  const parts = [city, district].filter((part, index, list) => part && list.indexOf(part) === index);
  return parts.join(" ") || payload?.principalSubdivision || "本地";
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 4500) {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } finally {
    window.clearTimeout(timer);
  }
}

async function fetchLocalWeatherLabel(latitude, longitude) {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    localityLanguage: "zh",
  });
  const response = await fetchWithTimeout(`https://api.bigdatacloud.net/data/reverse-geocode-client?${params.toString()}`, {}, 3000);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return formatReverseGeocodeLabel(await response.json());
}

function normalizeOpenMeteoWeather(payload, locationLabel) {
  const daily = payload.daily ?? {};
  const hourlyPayload = payload.hourly ?? {};
  const forecast = (daily.time ?? []).map((date, index) => ({
    date,
    weatherCode: daily.weathercode?.[index],
    max: Math.round(daily.temperature_2m_max?.[index]),
    min: Math.round(daily.temperature_2m_min?.[index]),
    precipitationProbability: Math.round(daily.precipitation_probability_max?.[index] ?? 0),
  }));
  const now = Date.now();
  const hourly = (hourlyPayload.time ?? [])
    .map((time, index) => ({
      time,
      temperature: Math.round(hourlyPayload.temperature_2m?.[index]),
      weatherCode: hourlyPayload.weathercode?.[index],
      precipitationProbability: Math.round(hourlyPayload.precipitation_probability?.[index] ?? 0),
    }))
    .filter((item) => new Date(item.time).getTime() >= now - 1000 * 60 * 45)
    .slice(0, 8);
  const today = forecast[0] ?? {
    max: Math.round(payload.current_weather?.temperature ?? 0),
    min: Math.round(payload.current_weather?.temperature ?? 0),
    precipitationProbability: 0,
  };

  return {
    location: locationLabel,
    current: {
      temperature: Math.round(payload.current_weather?.temperature ?? today.max),
      weatherCode: payload.current_weather?.weathercode ?? today.weatherCode ?? 0,
      windSpeed: Math.round(payload.current_weather?.windspeed ?? 0),
    },
    today,
    forecast,
    hourly,
  };
}

async function fetchOpenMeteoAirQuality(location) {
  const params = new URLSearchParams({
    latitude: String(location.latitude),
    longitude: String(location.longitude),
    current: "us_aqi,pm2_5,pm10",
    timezone: location.timezone || "auto",
  });
  const response = await fetchWithTimeout(`https://air-quality-api.open-meteo.com/v1/air-quality?${params.toString()}`, {}, 3500);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  const payload = await response.json();
  return {
    aqi: Math.round(payload.current?.us_aqi ?? NaN),
    pm25: Math.round(payload.current?.pm2_5 ?? NaN),
    pm10: Math.round(payload.current?.pm10 ?? NaN),
  };
}

async function fetchOpenMeteoWeather(location) {
  const params = new URLSearchParams({
    latitude: String(location.latitude),
    longitude: String(location.longitude),
    current_weather: "true",
    daily: "weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max",
    hourly: "temperature_2m,weathercode,precipitation_probability",
    timezone: location.timezone || "auto",
    forecast_days: "5",
  });
  const response = await fetchWithTimeout(`https://api.open-meteo.com/v1/forecast?${params.toString()}`, {}, 4500);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  const weather = normalizeOpenMeteoWeather(await response.json(), location.label);
  try {
    weather.airQuality = await fetchOpenMeteoAirQuality(location);
  } catch {
    weather.airQuality = null;
  }
  return weather;
}

function getRegionCenter(node, fallback = {}) {
  const center = typeof node?.center === "string" ? node.center.split(",").map(Number) : [];
  const longitude = Number.isFinite(center[0]) ? center[0] : fallback.longitude;
  const latitude = Number.isFinite(center[1]) ? center[1] : fallback.latitude;
  return { latitude, longitude };
}

function normalizeDistrictRegion(node, fallbackCenter) {
  const center = getRegionCenter(node, fallbackCenter);
  return {
    label: node?.name || "市中心",
    adcode: node?.adcode || "",
    latitude: center.latitude,
    longitude: center.longitude,
  };
}

function normalizeChinaRegionCatalog(payload) {
  const municipalities = new Set(["北京市", "上海市", "天津市", "重庆市"]);
  const provinceNodes = Array.isArray(payload) ? payload : payload?.children ?? [];

  return provinceNodes
    .map((province) => {
      const provinceCenter = getRegionCenter(province);
      const provinceChildren = Array.isArray(province.children) ? province.children : [];
      let cities = [];

      if (municipalities.has(province.name)) {
        const districts = (provinceChildren.length ? provinceChildren : [province]).map((district) =>
          normalizeDistrictRegion(district, provinceCenter),
        );
        cities = [
          {
            name: province.name,
            adcode: province.adcode || "",
            latitude: provinceCenter.latitude,
            longitude: provinceCenter.longitude,
            districts,
          },
        ];
      } else {
        const cityNodes = provinceChildren.length ? provinceChildren : [province];
        cities = cityNodes.map((city) => {
          const cityCenter = getRegionCenter(city, provinceCenter);
          const districtNodes = Array.isArray(city.children) && city.children.length ? city.children : [city];
          return {
            name: city.name || province.name,
            adcode: city.adcode || "",
            latitude: cityCenter.latitude,
            longitude: cityCenter.longitude,
            districts: districtNodes.map((district) => normalizeDistrictRegion(district, cityCenter)),
          };
        });
      }

      return {
        name: province.name,
        adcode: province.adcode || "",
        latitude: provinceCenter.latitude,
        longitude: provinceCenter.longitude,
        cities: cities.filter((city) => city.districts.length),
      };
    })
    .filter((province) => province.name && province.cities.length);
}

function buildCompactChinaRegionCatalog() {
  return chinaCompactRegionFallbacks.map((region) => ({
    name: region.province,
    adcode: "",
    latitude: region.latitude,
    longitude: region.longitude,
    cities: [
      {
        name: region.city,
        adcode: "",
        latitude: region.latitude,
        longitude: region.longitude,
        districts: [
          {
            label: region.district,
            adcode: "",
            latitude: region.latitude,
            longitude: region.longitude,
          },
        ],
      },
    ],
  }));
}

function mergeChinaRegionCatalog(primaryCatalog) {
  const merged = [...primaryCatalog];
  const existing = new Set(merged.map((province) => province.name));

  buildCompactChinaRegionCatalog().forEach((province) => {
    if (!existing.has(province.name)) {
      merged.push(province);
    }
  });

  return merged;
}

async function loadChinaRegionCatalog() {
  if (chinaRegionCatalogRequest) {
    return chinaRegionCatalogRequest;
  }

  chinaRegionCatalogRequest = fetch(chinaRegionApiUrl)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return response.json();
    })
    .then((payload) => {
      const normalized = normalizeChinaRegionCatalog(payload);
      return normalized.length ? mergeChinaRegionCatalog(normalized) : mergeChinaRegionCatalog(chinaRegionCatalog);
    })
    .catch(() => mergeChinaRegionCatalog(chinaRegionCatalog));

  return chinaRegionCatalogRequest;
}

function setWeatherSelectOptions(select, items, getLabel) {
  if (!select) {
    return;
  }

  select.innerHTML = items
    .map((item, index) => `<option value="${index}">${escapeHtml(getLabel(item))}</option>`)
    .join("");
}

function getWeatherCatalog() {
  return activeChinaRegionCatalog.length ? activeChinaRegionCatalog : chinaRegionCatalog;
}

function populateWeatherDistrictSelect() {
  const catalog = getWeatherCatalog();
  const province = catalog[Number(dom.weatherProvinceSelect?.value) || 0] ?? catalog[0];
  const city = province?.cities?.[Number(dom.weatherCitySelect?.value) || 0] ?? province?.cities?.[0];
  setWeatherSelectOptions(dom.weatherDistrictSelect, city?.districts ?? [], (district) => district.label);
}

function populateWeatherCitySelect() {
  const catalog = getWeatherCatalog();
  const province = catalog[Number(dom.weatherProvinceSelect?.value) || 0] ?? catalog[0];
  setWeatherSelectOptions(dom.weatherCitySelect, province?.cities ?? [], (city) => city.name);
  if (dom.weatherCitySelect) {
    dom.weatherCitySelect.value = "0";
  }
  populateWeatherDistrictSelect();
}

function populateWeatherProvinceSelect() {
  const catalog = getWeatherCatalog();
  setWeatherSelectOptions(dom.weatherProvinceSelect, catalog, (province) => province.name);
  if (dom.weatherProvinceSelect) {
    dom.weatherProvinceSelect.value = "0";
  }
  populateWeatherCitySelect();
}

function getSelectedChinaLocation() {
  const catalog = getWeatherCatalog();
  const province = catalog[Number(dom.weatherProvinceSelect?.value) || 0] ?? catalog[0];
  const city = province?.cities?.[Number(dom.weatherCitySelect?.value) || 0] ?? province?.cities?.[0];
  const district = city?.districts?.[Number(dom.weatherDistrictSelect?.value) || 0] ?? city?.districts?.[0];

  if (!province || !city || !district) {
    return weatherLocations.beijing;
  }

  const labelParts = [province.name, city.name, district.label].filter(Boolean);
  const compactParts = labelParts.filter((part, index) => labelParts.indexOf(part) === index);
  return {
    label: compactParts.join(" "),
    buttonLabel: district.label || city.name || province.name,
    latitude: Number.isFinite(district.latitude) ? district.latitude : city.latitude,
    longitude: Number.isFinite(district.longitude) ? district.longitude : city.longitude,
    timezone: "Asia/Shanghai",
    adcode: district.adcode || city.adcode || province.adcode || "",
    regionPath: [province.name, city.name, district.label],
  };
}

function compactWeatherLocationLabel(location) {
  if (location?.buttonLabel) {
    return location.buttonLabel;
  }

  const label = String(location?.label || "自动").trim();
  const parts = label.split(/\s+/).filter(Boolean);
  return parts.at(-1) || label.replace(/[市区县]$/, "") || "自动";
}

function setWeatherLocationPanelOpen(isOpen) {
  if (!dom.weatherLocationPanel || !dom.weatherLocationButton) {
    return;
  }

  dom.weatherLocationPanel.hidden = !isOpen;
  dom.weatherLocationButton.setAttribute("aria-expanded", String(isOpen));
}

function getStoredWeatherMode() {
  try {
    return window.localStorage.getItem(weatherLocationStorageKey) || "auto";
  } catch {
    return "auto";
  }
}

function getSavedCustomWeatherLocation() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(weatherCustomLocationStorageKey) || "null");
    if (Number.isFinite(parsed?.latitude) && Number.isFinite(parsed?.longitude)) {
      return parsed;
    }
  } catch {
    // Ignore malformed saved locations and fall back to the default selector value.
  }
  return null;
}

function saveWeatherMode(mode) {
  try {
    window.localStorage.setItem(weatherLocationStorageKey, mode);
  } catch {
    // Local storage can be unavailable in strict browser modes.
  }
}

function saveCustomWeatherLocation(location) {
  try {
    window.localStorage.setItem(weatherCustomLocationStorageKey, JSON.stringify(location));
  } catch {
    // Local storage can be unavailable in strict browser modes.
  }
}

function selectSavedWeatherLocation(location) {
  const path = location?.regionPath;
  if (!Array.isArray(path) || !dom.weatherProvinceSelect || !dom.weatherCitySelect || !dom.weatherDistrictSelect) {
    return;
  }

  const catalog = getWeatherCatalog();
  const provinceIndex = catalog.findIndex((province) => province.name === path[0]);
  if (provinceIndex < 0) {
    return;
  }

  dom.weatherProvinceSelect.value = String(provinceIndex);
  populateWeatherCitySelect();

  const province = catalog[provinceIndex];
  const cityIndex = province.cities.findIndex((city) => city.name === path[1]);
  if (cityIndex >= 0) {
    dom.weatherCitySelect.value = String(cityIndex);
    populateWeatherDistrictSelect();
  }

  const city = province.cities[Math.max(cityIndex, 0)];
  const districtIndex = city?.districts?.findIndex((district) => district.label === path[2]) ?? -1;
  if (districtIndex >= 0) {
    dom.weatherDistrictSelect.value = String(districtIndex);
  }
}

async function getAutoWeatherLocation() {
  try {
    const position = await getBrowserPosition();
    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;
    let label = "本地";
    try {
      label = await fetchLocalWeatherLabel(latitude, longitude);
    } catch {
      label = "本地";
    }
    return {
      label,
      buttonLabel: "自动",
      latitude,
      longitude,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "auto",
    };
  } catch {
    return {
      ...weatherLocations.beijing,
      buttonLabel: "自动",
    };
  }
}

async function resolveWeatherLocation() {
  return {
    location: await getAutoWeatherLocation(),
    isAuto: true,
  };
}

async function loadSelectedWeather(options = {}) {
  if (weatherRequestInFlight) {
    return;
  }

  weatherRequestInFlight = true;
  if (dom.weatherRefreshButton) {
    dom.weatherRefreshButton.disabled = true;
    dom.weatherRefreshButton.textContent = "刷新";
    dom.weatherRefreshButton.classList.add("is-loading");
  }

  try {
    const { location, isAuto } = await resolveWeatherLocation(options);
    activeWeatherLocation = location;
    const weather = await fetchOpenMeteoWeather(location);
    renderHomeWeather(weather, {
      location,
      locationLabel: location.label,
      timeZone: location.timezone === "auto" ? undefined : location.timezone,
      isAuto,
    });
    localWeatherLoaded = true;
  } catch {
    localWeatherLoaded = false;
  } finally {
    weatherRequestInFlight = false;
    if (dom.weatherRefreshButton) {
      dom.weatherRefreshButton.disabled = false;
      dom.weatherRefreshButton.textContent = "刷新";
      dom.weatherRefreshButton.classList.remove("is-loading");
    }
  }
}

function setupWeatherControls() {
  try {
    window.localStorage.removeItem(weatherLocationStorageKey);
    window.localStorage.removeItem(weatherCustomLocationStorageKey);
  } catch {
    // Ignore storage failures; weather now always uses the current local position.
  }

  dom.weatherRefreshButton?.addEventListener("click", (event) => {
    event.preventDefault();
    localWeatherLoaded = false;
    loadSelectedWeather();
  });
}

function renderTodayInHistory(historyBlock) {
  const items = historyBlock?.items ?? [];
  dom.historyTodayMeta.textContent = historyBlock?.dateLabel ?? "今天";

  if (!items.length) {
    dom.historyTodayList.innerHTML = "<p>今天的历史切片正在补充中。</p>";
    return;
  }

  dom.historyTodayList.innerHTML = items
    .slice(0, 2)
    .map((item) => {
      const year = item.year ? `<strong>${item.year}</strong>` : "";
      const linkStart = item.link ? `<a href="${item.link}" target="_blank" rel="noreferrer">` : "";
      const linkEnd = item.link ? "</a>" : "";

      return `
        <p class="history-today-item">
          ${linkStart}${year}<span>${item.text}</span>${linkEnd}
        </p>
      `;
    })
    .join("");
}

function renderClassicQuote(classicQuote) {
  dom.classicQuoteCard.classList.remove("skeleton");

  if (!classicQuote) {
    dom.classicQuoteText.textContent = "今天的摘抄还在整理中。";
    dom.classicQuoteSource.textContent = "名著摘抄";
    dom.classicQuoteNote.textContent = "稍后会自动补上。";
    return;
  }

  dom.classicQuoteText.textContent = `“${classicQuote.text}”`;
  dom.classicQuoteSource.textContent = `${classicQuote.source} · ${classicQuote.author}`;
  dom.classicQuoteNote.textContent = classicQuote.note;
}

function renderBookExcerpt(bookExcerpt) {
  if (!bookExcerpt) {
    dom.bookExcerptText.textContent = "今天的书籍摘抄还在整理中。";
    dom.bookExcerptSource.textContent = "每日书摘";
    return;
  }

  dom.bookExcerptText.textContent = `“${bookExcerpt.text}”`;
  dom.bookExcerptSource.textContent = `${bookExcerpt.book} · ${bookExcerpt.author}`;
}

function renderFeaturedPlace(featuredPlaces, generatedAt) {
  if (featuredPlaceTimer) {
    clearInterval(featuredPlaceTimer);
    featuredPlaceTimer = null;
  }

  clearElement(dom.featuredPlacePanel);

  if (!featuredPlaces?.length) {
    dom.featuredPlacePanel.innerHTML = `
      <div class="empty-state neutral-state">
        <p>今天的世界风景还在路上。</p>
      </div>
    `;
    return;
  }

  dom.featuredPlacePanel.classList.remove("skeleton");
  dom.featuredPlacePanel.innerHTML = `
    <a class="featured-place-card" target="_blank" rel="noreferrer">
      <div class="featured-place-content">
        <span class="featured-place-tag" id="featuredPlaceRegion">--</span>
        <h3 id="featuredPlaceName">--</h3>
        <p class="featured-place-location" id="featuredPlaceLocation">--</p>
        <p class="featured-place-summary" id="featuredPlaceSummary">--</p>
        <div class="featured-place-footer">
          <span class="featured-place-rotation">每日更新 · 支持手动翻看</span>
          <div class="featured-place-dots" id="featuredPlaceDots"></div>
        </div>
      </div>
    </a>
    <button
      type="button"
      class="featured-place-arrow is-prev"
      id="featuredPlacePrev"
      aria-label="上一张风景"
    >
      ‹
    </button>
    <button
      type="button"
      class="featured-place-arrow is-next"
      id="featuredPlaceNext"
      aria-label="下一张风景"
    >
      ›
    </button>
  `;

  const card = dom.featuredPlacePanel.querySelector(".featured-place-card");
  const region = dom.featuredPlacePanel.querySelector("#featuredPlaceRegion");
  const name = dom.featuredPlacePanel.querySelector("#featuredPlaceName");
  const location = dom.featuredPlacePanel.querySelector("#featuredPlaceLocation");
  const summary = dom.featuredPlacePanel.querySelector("#featuredPlaceSummary");
  const dots = dom.featuredPlacePanel.querySelector("#featuredPlaceDots");
  const prevButton = dom.featuredPlacePanel.querySelector("#featuredPlacePrev");
  const nextButton = dom.featuredPlacePanel.querySelector("#featuredPlaceNext");
  let activeIndex = getFeaturedPlaceStartIndex(featuredPlaces, generatedAt);

  function renderDots(index) {
    dots.innerHTML = "";
    featuredPlaces.forEach((place, dotIndex) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `featured-place-dot${dotIndex === index ? " is-active" : ""}`;
      button.setAttribute("aria-label", `查看 ${place.title}`);
      button.setAttribute("aria-pressed", String(dotIndex === index));
      button.dataset.index = String(dotIndex);
      dots.append(button);
    });
  }

  function renderSlide(index) {
    const place = featuredPlaces[index];
    card.href = place.link;
    card.style.backgroundImage = `linear-gradient(180deg, rgba(6, 16, 28, 0.08), rgba(6, 16, 28, 0.82)), url(${place.image})`;
    region.textContent = place.region;
    name.textContent = place.title;
    location.textContent = place.location;
    summary.textContent = place.summary;
    renderDots(index);
    card.classList.remove("is-entering");
    void card.offsetWidth;
    card.classList.add("is-entering");
  }

  function restartFeaturedPlaceTimer() {
    if (featuredPlaceTimer) {
      clearInterval(featuredPlaceTimer);
      featuredPlaceTimer = null;
    }

    if (featuredPlaces.length > 1) {
      featuredPlaceTimer = window.setInterval(() => {
        activeIndex = (activeIndex + 1) % featuredPlaces.length;
        renderSlide(activeIndex);
      }, 8000);
    }
  }

  renderSlide(activeIndex);
  dots.addEventListener("click", (event) => {
    const button = event.target.closest(".featured-place-dot");
    if (!button) {
      return;
    }

    activeIndex = Number(button.dataset.index ?? activeIndex);
    renderSlide(activeIndex);
    restartFeaturedPlaceTimer();
  });

  prevButton?.addEventListener("click", () => {
    activeIndex = (activeIndex - 1 + featuredPlaces.length) % featuredPlaces.length;
    renderSlide(activeIndex);
    restartFeaturedPlaceTimer();
  });

  nextButton?.addEventListener("click", () => {
    activeIndex = (activeIndex + 1) % featuredPlaces.length;
    renderSlide(activeIndex);
    restartFeaturedPlaceTimer();
  });

  restartFeaturedPlaceTimer();
}

function renderNews(container, items, section) {
  clearElement(container);
  if (!items.length) {
    renderEmpty(container);
    return;
  }

  items.forEach((item, index) => {
    const node = document.createElement("a");
    node.className = "news-item premium-news-card";
    node.href = item.link;
    node.target = "_blank";
    node.rel = "noreferrer";

    const summary = item.summary ? `<p>${item.summary}</p>` : "";
    const image = getNewsBackground(section, item, index);
    if (image) {
      node.style.backgroundImage = `linear-gradient(180deg, rgba(7, 17, 29, 0.18), rgba(7, 17, 29, 0.90)), url(${image})`;
    } else {
      node.classList.add("is-no-image");
      node.style.backgroundImage = "";
    }
    node.innerHTML = `
      <div class="news-card-topline">
        <span class="news-source-badge">${item.source ?? "News"}</span>
        <time datetime="${item.publishedAt}">${formatDateTime(item.publishedAt)}</time>
      </div>
      <div class="news-card-body">
        <h3>${item.title}</h3>
        ${summary}
      </div>
    `;
    container.append(node);
  });
}

function formatGameTime(value) {
  const date = new Date(value);
  return new Intl.DateTimeFormat("zh-CN", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Shanghai",
  }).format(date);
}

function getScheduleDateObject(dateKey) {
  return new Date(`${dateKey}T12:00:00Z`);
}

function formatScheduleDayChip(dateKey) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "numeric",
    day: "numeric",
    weekday: "short",
    timeZone: "Asia/Shanghai",
  }).format(getScheduleDateObject(dateKey));
}

function formatScheduleDayHeading(dateKey) {
  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "full",
    timeZone: "Asia/Shanghai",
  }).format(getScheduleDateObject(dateKey));
}

function getNbaDayStatusLabel(activeIndex, currentIndex) {
  if (activeIndex < currentIndex) {
    return "Past Results";
  }

  if (activeIndex > currentIndex) {
    return "Upcoming Schedule";
  }

  return "Today";
}

function renderTeamLeaderPanel(team) {
  const leaders = team.leaders ?? [];

  const body = leaders.length
    ? leaders
        .map((leader) => {
          const summary = leader.summary
            ? `<p class="team-leader-summary">${leader.summary}</p>`
            : "";
          const headshot = leader.headshot
            ? `<img src="${leader.headshot}" alt="${leader.player}" loading="lazy" />`
            : `<div class="team-leader-avatar-fallback">${leader.label}</div>`;
          const badge = [leader.position, leader.jersey ? `#${leader.jersey}` : ""]
            .filter(Boolean)
            .join(" / ");

          return `
            <div class="team-leader-row">
              <div class="team-leader-avatar">
                ${headshot}
              </div>
              <div class="team-leader-copy">
                <div class="team-leader-topline">
                  <span class="team-leader-stat">${leader.label} ${leader.value}</span>
                  <span class="team-leader-name">${leader.player}</span>
                </div>
                ${badge ? `<p class="team-leader-badge">${badge}</p>` : ""}
                ${summary}
              </div>
            </div>
          `;
        })
        .join("")
    : `<div class="team-leader-empty">Team leader stats are not available yet.</div>`;

  return `
    <section class="team-leader-panel">
      <div class="team-leader-header">
        <div class="team-leader-team">
          <img src="${team.logo}" alt="${team.abbreviation}" loading="lazy" />
          <div>
            <strong>${team.abbreviation}</strong>
            <span>${team.displayName ?? team.abbreviation}</span>
          </div>
        </div>
        <span class="team-leader-chip">${team.leaderContext ?? "Leaders"}</span>
      </div>
      <div class="team-leader-list">
        ${body}
      </div>
    </section>
  `;
}

function renderNbaGameCard(game) {
  return `
    <a class="scoreboard-card" href="${game.link}" target="_blank" rel="noreferrer">
      <div class="scoreboard-card-top">
        <span class="scoreboard-status scoreboard-status-${game.state}">${game.statusText}</span>
        <span class="scoreboard-time">${game.state === "pre" ? formatGameTime(game.startTime) : game.detail}</span>
      </div>
      <div class="scoreboard-team-row">
        <div class="scoreboard-team">
          <img src="${game.awayTeam.logo}" alt="${game.awayTeam.abbreviation}" loading="lazy" />
          <span>${game.awayTeam.abbreviation}</span>
        </div>
        <strong>${game.awayTeam.score}</strong>
      </div>
      <div class="scoreboard-team-row">
        <div class="scoreboard-team">
          <img src="${game.homeTeam.logo}" alt="${game.homeTeam.abbreviation}" loading="lazy" />
          <span>${game.homeTeam.abbreviation}</span>
        </div>
        <strong>${game.homeTeam.score}</strong>
      </div>
      <div class="scoreboard-leaders">
        ${renderTeamLeaderPanel(game.awayTeam)}
        ${renderTeamLeaderPanel(game.homeTeam)}
      </div>
      <p class="scoreboard-note">${game.note}</p>
    </a>
  `;
}

function drawNbaScheduleBoard() {
  clearElement(dom.nbaScoreboard);

  if (!nbaScheduleState.days.length) {
    dom.nbaScoreboard.innerHTML = `
      <div class="empty-state neutral-state scoreboard-empty">
        <p>NBA schedule data is not available right now.</p>
      </div>
    `;
    return;
  }

  const activeDay = nbaScheduleState.days[nbaScheduleState.activeIndex];
  const gamesMarkup = activeDay.games.length
    ? activeDay.games.map(renderNbaGameCard).join("")
    : `
      <div class="empty-state neutral-state scoreboard-empty">
        <p>No NBA games scheduled for this date.</p>
      </div>
    `;

  const wrapper = document.createElement("section");
  wrapper.className = "nba-schedule-board";
  wrapper.innerHTML = `
    <div class="nba-schedule-nav">
      <button
        class="nba-schedule-arrow"
        type="button"
        data-nba-shift="-1"
        ${nbaScheduleState.activeIndex === 0 ? "disabled" : ""}
      >
        Prev
      </button>
      <div class="nba-schedule-meta">
        <p class="nba-schedule-kicker">${getNbaDayStatusLabel(
          nbaScheduleState.activeIndex,
          nbaScheduleState.currentIndex,
        )} / ${activeDay.games.length} games</p>
        <h3>${formatScheduleDayHeading(activeDay.date)}</h3>
        <div class="nba-schedule-days">
          ${nbaScheduleState.days
            .map(
              (day, index) => `
                <button
                  class="nba-day-pill${index === nbaScheduleState.activeIndex ? " is-active" : ""}"
                  type="button"
                  data-nba-day-index="${index}"
                >
                  ${formatScheduleDayChip(day.date)}
                </button>
              `,
            )
            .join("")}
        </div>
      </div>
      <button
        class="nba-schedule-arrow"
        type="button"
        data-nba-shift="1"
        ${nbaScheduleState.activeIndex === nbaScheduleState.days.length - 1 ? "disabled" : ""}
      >
        Next
      </button>
    </div>
    <div class="scoreboard-list">
      ${gamesMarkup}
    </div>
  `;

  dom.nbaScoreboard.append(wrapper);
}

function renderNbaScoreboard(scoreboard) {
  const normalizedDays = scoreboard?.days?.length
    ? scoreboard.days
    : scoreboard?.games
      ? [{ date: scoreboard.date ?? new Date().toISOString().slice(0, 10), games: scoreboard.games }]
      : [];

  const preservedDate =
    nbaScheduleState.days[nbaScheduleState.activeIndex]?.date ?? null;

  nbaScheduleState.days = normalizedDays;
  nbaScheduleState.currentIndex =
    scoreboard?.currentIndex ??
    Math.max(
      normalizedDays.findIndex((day) => day.date === scoreboard?.date),
      0,
    );

  const preservedIndex = normalizedDays.findIndex(
    (day) => day.date === preservedDate,
  );

  nbaScheduleState.activeIndex =
    preservedIndex >= 0 ? preservedIndex : nbaScheduleState.currentIndex;

  drawNbaScheduleBoard();
}

function setupNbaScheduleNavigation() {
  dom.nbaScoreboard.addEventListener("click", (event) => {
    const dayButton = event.target.closest("[data-nba-day-index]");
    if (dayButton) {
      nbaScheduleState.activeIndex = Number(dayButton.dataset.nbaDayIndex);
      drawNbaScheduleBoard();
      return;
    }

    const shiftButton = event.target.closest("[data-nba-shift]");
    if (!shiftButton) {
      return;
    }

    const nextIndex =
      nbaScheduleState.activeIndex + Number(shiftButton.dataset.nbaShift);

    if (nextIndex < 0 || nextIndex >= nbaScheduleState.days.length) {
      return;
    }

    nbaScheduleState.activeIndex = nextIndex;
    drawNbaScheduleBoard();
  });
}

function renderPaperCard(paper) {
  const authors = paper.authors?.length ? paper.authors.join(" / ") : "作者信息待补充";
  const tags = [paper.venue, paper.year, paper.quality].filter(Boolean).join(" · ");

  return `
    <article class="paper-card">
      <div class="paper-meta">
        <span>${paper.trackLabel ?? "精选推荐"}</span>
        <span>${tags}</span>
      </div>
      <h3>${paper.title}</h3>
      <p class="paper-summary">${paper.summary}</p>
      <p class="paper-authors">${authors}</p>
      <footer>
        <span class="pill">${paper.categories.join(", ")}</span>
        <a href="${paper.link}" target="_blank" rel="noreferrer">查看论文</a>
      </footer>
    </article>
  `;
}

function renderPaperSections(sections) {
  clearElement(dom.paperHighlights);

  if (!sections.length) {
    renderEmpty(dom.paperHighlights);
    return;
  }

  sections.forEach((section) => {
    const wrapper = document.createElement("section");
    wrapper.className = "paper-section";

    const body = section.items.length
      ? section.items.map(renderPaperCard).join("")
      : `<div class="empty-state"><p>这个板块今天还没有可展示的精选论文。</p></div>`;

    wrapper.innerHTML = `
      <header class="paper-section-header">
        <div>
          <h3>${section.title}</h3>
          <p>${section.description}</p>
        </div>
        <span class="panel-tag">${section.rotationHint ?? `${section.items.length} 篇`}</span>
      </header>
      <div class="paper-grid">
        ${body}
      </div>
    `;

    dom.paperHighlights.append(wrapper);
  });
}

function renderPage(data) {
  dom.generatedAt.textContent = `数据更新时间：${formatDateTime(data.generatedAt)}`;
  if (!refreshInFlight) {
    dom.refreshStatus.textContent = "可立即触发 GitHub Actions 更新数据";
  }
  dom.paperRotationLabel.textContent = data.aiPapers.rotationLabel ?? "Daily Rotation";
  if (!localWeatherLoaded && !weatherRequestInFlight) {
    const location = activeWeatherLocation ?? weatherLocations.beijing;
    renderHomeWeather(data.weather, {
      location,
      locationLabel: location.label,
      timeZone: location.timezone,
      isAuto: true,
    });
  }
  renderNews(dom.chinaTopNews, data.news.chinaTop ?? data.news.domestic ?? [], "chinaTop");
  renderNews(dom.chinaSocietyNews, data.news.chinaSociety ?? [], "chinaSociety");
  renderNews(dom.chinaFinanceNews, data.news.chinaFinance ?? [], "chinaFinance");
  renderNews(dom.worldTopNews, data.news.worldTop ?? data.news.international ?? [], "worldTop");
  renderNews(dom.worldBusinessNews, data.news.worldBusiness ?? [], "worldBusiness");
  renderNews(dom.worldTechNews, data.news.worldTech ?? [], "worldTech");
  renderNbaScoreboard(data.nbaScoreboard);
  renderNews(dom.nbaNews, data.news.nba ?? [], "nba");
  renderPaperSections(data.aiPapers.sections ?? []);
}

function renderError(message) {
  if (featuredPlaceTimer) {
    clearInterval(featuredPlaceTimer);
    featuredPlaceTimer = null;
  }

  dom.generatedAt.textContent = message;
  dom.refreshStatus.textContent = "暂时无法刷新数据";
  dom.weatherCurrent.classList.remove("skeleton");
  dom.weatherCurrent.innerHTML = `<div class="error-state"><p>${message}</p></div>`;
  dom.classicQuoteCard.classList.remove("skeleton");
  dom.classicQuoteCard.innerHTML = `<div class="error-state"><p>${message}</p></div>`;
  dom.featuredPlacePanel.classList.remove("skeleton");
  dom.featuredPlacePanel.innerHTML = `<div class="error-state"><p>${message}</p></div>`;
  clearElement(dom.weatherDaily);
  dom.historyTodayMeta.textContent = "今天";
  dom.historyTodayList.innerHTML = `<p>${message}</p>`;
  renderEmpty(dom.chinaTopNews);
  renderEmpty(dom.chinaSocietyNews);
  renderEmpty(dom.chinaFinanceNews);
  renderEmpty(dom.worldTopNews);
  renderEmpty(dom.worldBusinessNews);
  renderEmpty(dom.worldTechNews);
  clearElement(dom.nbaScoreboard);
  dom.nbaScoreboard.innerHTML = `<div class="empty-state"><p>${message}</p></div>`;
  renderEmpty(dom.nbaNews);
  renderEmpty(dom.paperHighlights);
}

function setRefreshButtonState(isLoading) {
  refreshInFlight = isLoading;
  dom.refreshDataButton.disabled = isLoading;
  dom.refreshDataButton.textContent = isLoading ? "载入中..." : "立即更新数据";
}

function setupRefreshControl() {
  dom.refreshDataButton.addEventListener("click", () => {
    if (refreshInFlight) {
      return;
    }

    dom.refreshStatus.textContent = "已打开 GitHub Actions，请点击 Run workflow 立即生成新数据";
    window.open(workflowUrl, "_blank", "noopener,noreferrer");
    loadBrief({ manual: true });
  });
}

async function loadBrief({ manual = false } = {}) {
  if (refreshInFlight) {
    return;
  }

  setRefreshButtonState(true);
  dom.refreshStatus.textContent = manual ? "正在拉取最新页面数据..." : "正在载入摘要...";

  try {
    const response = await fetch(buildDataUrl(), { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    renderPage(data);
  } catch (error) {
    if (manual) {
      dom.refreshStatus.textContent = `刷新失败：${error.message}`;
    } else {
      renderError(`读取每日摘要失败：${error.message}`);
    }
  } finally {
    setRefreshButtonState(false);
  }
}

setupViewNavigation();
setupHomeSearchAndShortcuts();
setupWeatherControls();
setupChatDock();
setupChatInterface();
setupCyberPet();
setupRefreshControl();
setupCalendarNavigation();
setupNbaScheduleNavigation();
renderClock();
setInterval(renderClock, 1000);
loadStockWidget();
loadBrief().then(() => loadSelectedWeather());
