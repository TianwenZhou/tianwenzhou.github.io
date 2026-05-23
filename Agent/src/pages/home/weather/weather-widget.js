import { fetchAgentJson } from "../../../shared/api-client.js";

const weatherConfig = window.AGENT_WEATHER_CONFIG ?? {};

let dom = null;

function getWeatherDom() {
  return {
    weatherTitle: document.querySelector("#weatherTitle"),
    weatherPanelLabel: document.querySelector("#weatherPanelLabel"),
    weatherLocationSelect: document.querySelector("#weatherLocationSelect"),
    weatherRefreshButton: document.querySelector("#weatherRefreshButton"),
    weatherLocationButton: document.querySelector("#weatherLocationButton"),
    weatherLocationPanel: document.querySelector("#weatherLocationPanel"),
    weatherLocationForm: document.querySelector("#weatherLocationForm"),
    weatherLocationInput: document.querySelector("#weatherLocationInput"),
    weatherLocationResults: document.querySelector("#weatherLocationResults"),
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
    weatherHumidity: document.querySelector("#weatherHumidity"),
    weatherAirQuality: document.querySelector("#weatherAirQuality"),
    weatherFeelsLike: document.querySelector("#weatherFeelsLike"),
    weatherDescription: document.querySelector("#weatherDescription"),
    weatherMetrics: document.querySelector("#weatherMetrics"),
    weatherWind: document.querySelector("#weatherWind"),
    weatherRange: document.querySelector("#weatherRange"),
    weatherRain: document.querySelector("#weatherRain"),
    weatherHourly: document.querySelector("#weatherHourly"),
    weatherDaily: document.querySelector("#weatherDaily"),
  };
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function clearElement(element) {
  if (element) {
    element.replaceChildren();
  }
}

const weatherLocationStorageKey = "agent-dashboard-weather-location-v1";
const weatherCustomLocationStorageKey = "agent-dashboard-weather-custom-location-v1";
const weatherHistoryStorageKey = "agent-dashboard-weather-location-history-v1";
const chinaRegionApiUrl = "https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json";
const maxWeatherLocationHistory = 6;
let localWeatherLoaded = false;
let weatherRequestInFlight = false;
let weatherRefreshResetTimer = null;
let weatherLocationSearchTimer = null;
let activeWeatherLocation = null;
let activeChinaRegionCatalog = [];
let chinaRegionCatalogRequest = null;
const weatherLocations = {
  beijing: { label: "北京市", latitude: 39.9042, longitude: 116.4074, timezone: "Asia/Shanghai" },
  shanghai: { label: "上海市", latitude: 31.2304, longitude: 121.4737, timezone: "Asia/Shanghai" },
  shenzhen: { label: "深圳市", latitude: 22.5431, longitude: 114.0579, timezone: "Asia/Shanghai" },
  "new-york": { label: "纽约", latitude: 40.7128, longitude: -74.006, timezone: "America/New_York" },
  "los-angeles": { label: "洛杉矶", latitude: 34.0522, longitude: -118.2437, timezone: "America/Los_Angeles" },
};
const weatherRecommendedLocations = [
  { label: "重庆 沙坪坝", buttonLabel: "沙坪坝", latitude: 29.5419, longitude: 106.457, qweatherLocation: "101040700", timezone: "Asia/Shanghai", adm1: "重庆", adm2: "重庆" },
  { label: "北京 朝阳", buttonLabel: "朝阳", latitude: 39.9215, longitude: 116.4431, qweatherLocation: "101010300", timezone: "Asia/Shanghai", adm1: "北京", adm2: "北京" },
  { label: "上海 浦东新区", buttonLabel: "浦东新区", latitude: 31.2211, longitude: 121.5447, qweatherLocation: "101020600", timezone: "Asia/Shanghai", adm1: "上海", adm2: "上海" },
  { label: "深圳 南山", buttonLabel: "南山", latitude: 22.5312, longitude: 113.9304, qweatherLocation: "101280604", timezone: "Asia/Shanghai", adm1: "广东省", adm2: "深圳" },
];
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

const qWeatherIconBasePath = String(weatherConfig.iconBasePath || "https://icons.qweather.com/assets/icons").replace(/\/+$/, "");


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

function getQWeatherIconCode(icon) {
  const code = String(icon || "").trim();
  return /^\d{3}$/.test(code) ? code : "";
}

function getQWeatherIconUrl(icon) {
  const code = getQWeatherIconCode(icon);
  return code ? `${qWeatherIconBasePath}/${code}.svg` : "";
}

function getWeatherFallbackVisualForCondition(item) {
  if (item?.weatherKind) {
    return weatherVisuals[item.weatherKind] ?? weatherVisuals.clear;
  }
  return getWeatherVisual(item?.weatherCode);
}


function getHomeWeatherLabel(weatherCode) {
  if (typeof weatherCode === "string" && Number.isNaN(Number(weatherCode))) {
    return weatherCode || "更新中";
  }

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

function getWeatherKind(weatherCode, label = "") {
  if (typeof weatherCode === "string" && Number.isNaN(Number(weatherCode))) {
    return getWeatherKindFromText(weatherCode);
  }

  if (label) {
    const textKind = getWeatherKindFromText(label);
    if (textKind !== "clear") {
      return textKind;
    }
  }

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

function getWeatherKindFromText(value) {
  const text = String(value || "");
  if (/雷|电/.test(text)) return "storm";
  if (/雪|冰|冻雨/.test(text)) return "snow";
  if (/雨|阵雨|暴雨|降水/.test(text)) return "rain";
  if (/雾|霾|沙|尘/.test(text)) return "fog";
  if (/云|阴/.test(text)) return "cloudy";
  return "clear";
}

function getWeatherKindFromQWeatherIcon(icon) {
  const code = String(icon || "");
  if (!code) return "";
  if (/^(100|150)$/.test(code)) return "clear";
  if (/^(101|102|103|104|151|152|153|154)$/.test(code)) return "cloudy";
  if (/^(300|301|302|303|304|305|306|307|308|309|310|311|312|313|314|315|316|317|318|350|351|399)$/.test(code)) return "rain";
  if (/^(400|401|402|403|404|405|406|407|408|409|410|456|457|499)$/.test(code)) return "snow";
  if (/^(500|501|502|503|504|507|508|509|510|511|512|513|514|515)$/.test(code)) return "fog";
  return "";
}

function getWeatherVisualForCondition(item) {
  return getQWeatherIconUrl(item?.icon) || getWeatherFallbackVisualForCondition(item);
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

function getAirQualityShortLabel(value) {
  if (!value) {
    return "--";
  }
  return value.category || getAirQualityLevel(Number(value.aqi));
}

function getAirQualityClass(value) {
  const aqi = Number(value);
  if (!Number.isFinite(aqi)) return "aqi-none";
  if (aqi <= 50) return "aqi-good";
  if (aqi <= 100) return "aqi-fair";
  if (aqi <= 150) return "aqi-light";
  if (aqi <= 200) return "aqi-medium";
  if (aqi <= 300) return "aqi-heavy";
  return "aqi-severe";
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

function getDateKeyInTimeZone(value = new Date(), timeZone) {
  const parts = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    ...(timeZone ? { timeZone } : {}),
  }).formatToParts(value);
  const partMap = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${partMap.year}-${partMap.month}-${partMap.day}`;
}

function parseCalendarDateKey(value) {
  const [year, month, day] = String(value || "")
    .slice(0, 10)
    .split("-")
    .map(Number);

  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return null;
  }

  return new Date(year, month - 1, day);
}

function formatCalendarDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function shiftDateKey(value, offset) {
  const date = parseCalendarDateKey(value);
  if (!date) {
    return value;
  }

  date.setDate(date.getDate() + offset);
  return formatCalendarDateKey(date);
}

function getSevenDayForecast(forecast, timeZone) {
  const todayKey = getDateKeyInTimeZone(new Date(), timeZone);
  const startKey = shiftDateKey(todayKey, -1);
  const endKey = shiftDateKey(todayKey, 5);
  const sorted = [...forecast].sort((a, b) => String(a.date).localeCompare(String(b.date)));
  const hasYesterday = sorted.some((day) => day.date === startKey);
  const normalized = hasYesterday || !sorted.length
    ? sorted
    : [
        {
          ...((sorted.find((day) => day.date >= todayKey) ?? sorted[0]) || {}),
          date: startKey,
          isSyntheticHistory: true,
        },
        ...sorted,
      ];
  const visible = normalized.filter((day) => day.date >= startKey && day.date <= endKey);
  const visibleDates = new Set(visible.map((day) => day.date));
  const overflow = normalized.filter((day) => day.date > endKey && !visibleDates.has(day.date));
  const sevenDayWindow = visible.length < 7 ? [...visible, ...overflow.slice(0, 7 - visible.length)] : visible;

  return {
    todayKey,
    visible: sevenDayWindow.length ? sevenDayWindow : normalized.slice(0, 7),
  };
}

function getForecastDayLabel(day, todayKey, timeZone) {
  if (day.date === todayKey) {
    return "今天";
  }

  if (day.date === shiftDateKey(todayKey, -1)) {
    return "昨天";
  }

  return formatHomeForecastDate(day.date, timeZone);
}

function buildCurvePath(coordinates) {
  if (coordinates.length < 2) {
    return "";
  }

  return coordinates.slice(1).reduce((result, point, index) => {
    const previous = coordinates[index];
    const middleX = (previous.x + point.x) / 2;
    return `${result} C${middleX.toFixed(1)} ${previous.y.toFixed(1)}, ${middleX.toFixed(1)} ${point.y.toFixed(1)}, ${point.x.toFixed(1)} ${point.y.toFixed(1)}`;
  }, `M${coordinates[0].x.toFixed(1)} ${coordinates[0].y.toFixed(1)}`);
}

function buildTemperatureCurve(points, key, { width = 320, height = 82, domainMin, domainMax, todayKey } = {}) {
  const values = points.map((point) => Number(point[key])).filter(Number.isFinite);
  if (values.length < 2) {
    return "";
  }

  const min = Number.isFinite(domainMin) ? domainMin : Math.min(...values);
  const max = Number.isFinite(domainMax) ? domainMax : Math.max(...values);
  const range = Math.max(max - min, 1);
  const xPadding = 14;
  const xStep = (width - xPadding * 2) / Math.max(points.length - 1, 1);
  const coordinates = points.map((point, index) => {
    const value = Number(point[key]);
    const y = height - 14 - ((value - min) / range) * (height - 28);
    return { x: xPadding + index * xStep, y, value, date: point.date };
  });

  const todayIndex = todayKey ? coordinates.findIndex((point) => point.date >= todayKey) : 0;
  const currentStartIndex = Math.max(todayIndex, 0);
  const historyCoordinates = currentStartIndex > 0 ? coordinates.slice(0, currentStartIndex + 1) : [];
  const currentCoordinates = coordinates.slice(currentStartIndex);
  const historyPath = buildCurvePath(historyCoordinates);
  const currentPath = buildCurvePath(currentCoordinates);
  const dots = coordinates
    .map((point) => `<circle class="weather-curve-dot ${todayKey && point.date < todayKey ? "is-history" : "is-current"}" cx="${point.x.toFixed(1)}" cy="${point.y.toFixed(1)}" r="2.8"></circle>`)
    .join("");

  return `
    <svg class="weather-temp-curve is-${key}" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" aria-hidden="true">
      ${historyPath ? `<path class="weather-curve-line is-history" d="${historyPath}"></path>` : ""}
      ${currentPath ? `<path class="weather-curve-line is-current" d="${currentPath}"></path>` : ""}
      ${dots}
    </svg>
  `;
}

function renderHourlyWeather(weather, timeZone) {
  if (!dom.weatherHourly) {
    return;
  }

  const hourly = getHourlyForecastWindow(weather, timeZone);
  dom.weatherHourly.innerHTML = hourly.length
    ? `
      <div class="weather-strip-title">小时预测</div>
      <div class="weather-hourly-scroll">
        <div class="weather-hourly-strip">
          ${hourly
            .map((hour) => {
              const label = getHomeWeatherLabel(hour.weatherCode);
              return `
                <article class="weather-hour-card ${hour.isCurrentHour ? "is-current-hour" : ""}">
                  <span>${formatHomeHour(hour.time, timeZone)}</span>
                  <img class="weather-hour-icon" src="${getWeatherVisualForCondition(hour)}" alt="${escapeHtml(label)}" loading="lazy" />
                  <strong>${hour.temperature}&deg;</strong>
                </article>
              `;
            })
            .join("")}
        </div>
      </div>
    `
    : "";
}

function getHourlyForecastWindow(weather, timeZone) {
  const source = weather.hourly?.length ? weather.hourly : buildFallbackHourlyWeather(weather);
  const now = new Date();
  now.setMinutes(0, 0, 0);
  const end = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const nowTime = now.getTime();
  const endTime = end.getTime();
  const sorted = [...source].sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
  const windowed = sorted.filter((hour) => {
    const time = new Date(hour.time).getTime();
    return Number.isFinite(time) && time >= nowTime && time <= endTime;
  });

  const currentHourForecast =
    windowed.find((hour) => new Date(hour.time).getTime() === nowTime) ||
    sorted.find((hour) => {
      const time = new Date(hour.time).getTime();
      return Number.isFinite(time) && time > nowTime;
    });
  const hasExactCurrentHour = windowed.some((hour) => new Date(hour.time).getTime() === nowTime);

  if (!hasExactCurrentHour && currentHourForecast) {
    windowed.unshift({
      ...currentHourForecast,
      time: now.toISOString(),
    });
  } else if (!hasExactCurrentHour && weather.current) {
    windowed.unshift({
      time: now.toISOString(),
      temperature: weather.current.temperature,
      weatherCode: weather.current.weatherCode,
      icon: weather.current.icon,
      weatherKind: weather.current.weatherKind,
      precipitationProbability: weather.today?.precipitationProbability ?? 0,
    });
  }

  return (windowed.length ? windowed : sorted).slice(0, 25).map((hour) => ({
    ...hour,
    isCurrentHour: new Date(hour.time).getTime() === nowTime,
  }));
}

function buildFallbackHourlyWeather(weather) {
  const currentTemperature = Number(weather.current?.temperature ?? weather.today?.max ?? 0);
  const currentCode = weather.current?.weatherCode ?? weather.today?.weatherCode ?? 0;
  const currentIcon = weather.current?.icon || "";
  const currentKind = weather.current?.weatherKind || getWeatherKind(currentCode);
  const currentHour = new Date();
  currentHour.setMinutes(0, 0, 0);

  return Array.from({ length: 25 }, (_, index) => ({
    time: new Date(currentHour.getTime() + index * 60 * 60 * 1000).toISOString(),
    temperature: Math.round(currentTemperature + Math.sin(index * 0.85) * 1.6 - index * 0.28),
    weatherCode: currentCode,
    icon: currentIcon,
    weatherKind: currentKind,
    precipitationProbability: weather.today?.precipitationProbability ?? 0,
  }));
}

function renderDailyWeather(weather, timeZone) {
  if (!dom.weatherDaily) {
    return;
  }

  const { todayKey, visible: forecast } = getSevenDayForecast(weather.forecast ?? [], timeZone);
  if (!forecast.length) {
    clearElement(dom.weatherDaily);
    return;
  }

  const allTemperatures = forecast.flatMap((day) => [Number(day.max), Number(day.min)]).filter(Number.isFinite);
  const domainMin = Math.min(...allTemperatures);
  const domainMax = Math.max(...allTemperatures);

  dom.weatherDaily.innerHTML = `
    <div class="weather-strip-title">多日预报</div>
    <div class="weather-daily-scroll">
      <div class="weather-daily-track" style="--weather-day-count: ${forecast.length}; --weather-track-width: calc(${forecast.length} * var(--weather-day-card-width) + ${Math.max(forecast.length - 1, 0)} * var(--weather-day-card-gap))">
        <div class="weather-daily-row">
          ${forecast
            .map(
              (day) => {
                const label = getHomeWeatherLabel(day.weatherCode);
                return `
                  <article class="weather-day-card ${day.date < todayKey ? "is-history" : "is-current"}">
                    <small>${formatHomeForecastMonthDay(day.date, timeZone)}</small>
                    <img class="weather-day-icon" src="${getWeatherVisualForCondition(day)}" alt="${escapeHtml(label)}" loading="lazy" />
                    <strong>${day.max}&deg;</strong>
                  </article>
                `;
              },
            )
            .join("")}
        </div>
        <div class="weather-curve-stack">
          ${buildTemperatureCurve(forecast, "max", { domainMin, domainMax, todayKey })}
          ${buildTemperatureCurve(forecast, "min", { domainMin, domainMax, todayKey })}
        </div>
        <div class="weather-daily-low-row">
          ${forecast
            .map((day) => `<span class="weather-day-low ${day.date < todayKey ? "is-history" : "is-current"}">${day.min}&deg;</span>`)
            .join("")}
        </div>
      </div>
    </div>
  `;
}

function setupDailyWeatherScroller() {
  if (!dom.weatherDaily) {
    return;
  }

  dom.weatherDaily.addEventListener(
    "wheel",
    (event) => {
      const scroller = event.target instanceof Element ? event.target.closest(".weather-daily-scroll") : null;
      if (!scroller) {
        return;
      }

      event.stopPropagation();
      if (scroller.scrollWidth > scroller.clientWidth && Math.abs(event.deltaY) > Math.abs(event.deltaX)) {
        event.preventDefault();
        scroller.scrollLeft += event.deltaY;
      }
    },
    { passive: false },
  );
}

function setupWeatherMetricsScroller() {
  if (!dom.weatherMetrics) {
    return;
  }

  dom.weatherMetrics.addEventListener(
    "wheel",
    (event) => {
      if (dom.weatherMetrics.scrollWidth <= dom.weatherMetrics.clientWidth) {
        return;
      }

      event.stopPropagation();
      if (Math.abs(event.deltaY) > Math.abs(event.deltaX)) {
        event.preventDefault();
        dom.weatherMetrics.scrollLeft += event.deltaY;
      }
    },
    { passive: false },
  );
}

function setupHourlyWeatherScroller() {
  if (!dom.weatherHourly) {
    return;
  }

  dom.weatherHourly.addEventListener(
    "wheel",
    (event) => {
      const scroller = event.target instanceof Element ? event.target.closest(".weather-hourly-scroll") : null;
      if (!scroller) {
        return;
      }

      event.stopPropagation();
      if (scroller.scrollWidth > scroller.clientWidth && Math.abs(event.deltaY) > Math.abs(event.deltaX)) {
        event.preventDefault();
        scroller.scrollLeft += event.deltaY;
      }
    },
    { passive: false },
  );
}

function formatWeatherObsTime(value, timeZone) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    ...(timeZone ? { timeZone } : {}),
  }).format(date);
}

function getUvLevel(value) {
  const index = Number(value);
  if (!Number.isFinite(index)) return "";
  if (index <= 2) return "低";
  if (index <= 5) return "中";
  if (index <= 7) return "高";
  if (index <= 10) return "很高";
  return "极高";
}

function formatMetricValue(value, suffix = "", fallback = "--") {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return fallback;
  }

  return `${number}${suffix}`;
}

function renderWeatherMetrics(weather) {
  if (!dom.weatherMetrics) {
    return;
  }

  const current = weather.current ?? {};
  const today = weather.today ?? {};
  const uv = Number(today.uvIndex);
  const metrics = [
    {
      label: "风向 / 风速",
      value: `${current.windDir || "--"} ${formatMetricValue(current.windSpeed, " km/h")}`,
    },
    {
      label: "紫外线",
      value: Number.isFinite(uv) ? `${uv} ${getUvLevel(uv)}` : "--",
    },
    {
      label: "能见度",
      value: formatMetricValue(current.visibility, " km"),
    },
    {
      label: "大气压",
      value: formatMetricValue(current.pressure, " hPa"),
    },
    {
      label: "降水量",
      value: formatMetricValue(current.precipitation, " mm"),
    },
  ];

  dom.weatherMetrics.innerHTML = metrics
    .map(
      (metric) => `
        <span class="home-weather-metric-card">
          <small>${metric.label}</small>
          <strong>${metric.value}</strong>
        </span>
      `,
    )
    .join("");
}

function renderHomeWeather(weather, options = {}) {
  if (!weather?.current || !dom.weatherCurrent) {
    return;
  }

  const condition = getHomeWeatherLabel(weather.current.weatherCode);
  const locationLabel = options.locationLabel || weather.location || "自动定位";
  const timeZone = options.timeZone;
  const aqi = Number(weather.airQuality?.aqi);
  const aqiText = weather.airQuality?.display
    ? `AQI ${weather.airQuality.display} ${weather.airQuality.category ?? ""}`.trim()
    : Number.isFinite(aqi)
      ? `AQI ${Math.round(aqi)} ${getAirQualityLevel(aqi)}`
      : "空气质量 --";
  dom.weatherCurrent.classList.remove("skeleton");
  if (dom.weatherPanelLabel) {
    dom.weatherPanelLabel.textContent = "天气";
  }
  if (dom.weatherTitle) {
    dom.weatherTitle.textContent = locationLabel;
  }
  if (dom.weatherRefreshButton) {
    dom.weatherRefreshButton.textContent = "";
    dom.weatherRefreshButton.disabled = false;
    dom.weatherRefreshButton.classList.remove("is-loading");
    dom.weatherRefreshButton.setAttribute("aria-label", `刷新${locationLabel}天气`);
  }
  if (dom.weatherLocationButton) {
    dom.weatherLocationButton.setAttribute("aria-label", `切换天气地区，当前为${locationLabel}`);
  }
  dom.weatherLocation.textContent = locationLabel;
  dom.weatherCondition.textContent = condition;
  dom.weatherTemperature.textContent = `${weather.current.temperature}\u00b0C`;
  if (dom.weatherHumidity) {
    const humidity = Number(weather.current.humidity);
    dom.weatherHumidity.textContent = Number.isFinite(humidity) ? `湿度 ${Math.round(humidity)}%` : "湿度 --";
  }
  if (dom.weatherAirQuality) {
    dom.weatherAirQuality.textContent = aqiText;
    dom.weatherAirQuality.className = `home-weather-aqi ${getAirQualityClass(aqi)}`;
  }
  if (dom.weatherFeelsLike) {
    const feelsLike = Number(weather.current.feelsLike);
    dom.weatherFeelsLike.textContent = Number.isFinite(feelsLike) ? `体感 ${Math.round(feelsLike)}°` : "体感 --";
  }
  if (dom.weatherDescription) {
    dom.weatherDescription.textContent = "";
  }
  renderWeatherMetrics(weather);
  if (dom.weatherVisual) {
    dom.weatherVisual.className = "home-weather-icon";
    dom.weatherVisual.onerror = () => {
      dom.weatherVisual.onerror = null;
      dom.weatherVisual.src = dom.weatherVisual.dataset.fallbackSrc || weatherVisuals.clear;
    };
    dom.weatherVisual.dataset.fallbackSrc = getWeatherFallbackVisualForCondition(weather.current);
    dom.weatherVisual.src = getWeatherVisualForCondition(weather.current);
    dom.weatherVisual.alt = `${condition}天气图标`;
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

    const lowAccuracyFallback = () => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: false,
        maximumAge: 1000 * 60 * 10,
        timeout: 4200,
      });
    };

    navigator.geolocation.getCurrentPosition(resolve, lowAccuracyFallback, {
      enableHighAccuracy: true,
      maximumAge: 1000 * 30,
      timeout: 8000,
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

function parseQWeatherCoordinate(value) {
  const parts = String(value || "")
    .split(",")
    .map((part) => Number(part.trim()));

  if (parts.length !== 2 || !Number.isFinite(parts[0]) || !Number.isFinite(parts[1])) {
    return null;
  }

  return {
    longitude: parts[0],
    latitude: parts[1],
  };
}

function formatQWeatherLocationLabel(item) {
  if (!item) {
    return "";
  }

  const parts = [item.adm2, item.name].filter((part, index, list) => part && list.indexOf(part) === index);
  return parts.join(" ") || item.name || item.adm2 || item.adm1 || "";
}

async function fetchQWeatherLocationInfo(query) {
  const payload = await fetchAgentJson("/api/weather/locations", {
    params: {
      q: query,
      number: 1,
    },
    timeoutMs: 8000,
  });
  return payload.locations?.[0] ?? null;
}

async function searchQWeatherLocations(query) {
  const payload = await fetchAgentJson("/api/weather/locations", {
    params: {
      q: query,
      number: 8,
    },
    timeoutMs: 8000,
  });

  return Array.isArray(payload.locations) ? payload.locations : [];
}

function normalizeQWeatherLocationItem(item) {
  const latitude = Number(item?.lat);
  const longitude = Number(item?.lon);
  const label = formatQWeatherLocationLabel(item);

  return {
    label: label || item?.name || "已选地区",
    buttonLabel: item?.name || label || "已选地区",
    latitude,
    longitude,
    qweatherLocation: item?.id || (Number.isFinite(longitude) && Number.isFinite(latitude) ? `${longitude},${latitude}` : ""),
    timezone: item?.tz || "Asia/Shanghai",
    country: item?.country || "",
    adm1: item?.adm1 || "",
    adm2: item?.adm2 || "",
  };
}

function buildQWeatherLocationQuery(location) {
  return `${Number(location.longitude).toFixed(4)},${Number(location.latitude).toFixed(4)}`;
}

async function resolveQWeatherLocation() {
  const configuredLocation = String(weatherConfig.location || "").trim();
  const configuredName = String(weatherConfig.locationName || "").trim();

  if (configuredLocation) {
    const geo = await fetchQWeatherLocationInfo(configuredLocation).catch(() => null);
    const parsed = parseQWeatherCoordinate(configuredLocation);
    const latitude = Number(parsed?.latitude ?? geo?.lat);
    const longitude = Number(parsed?.longitude ?? geo?.lon);
    const exactLocation = parsed ? `${parsed.longitude.toFixed(4)},${parsed.latitude.toFixed(4)}` : configuredLocation;

    return {
      label: configuredName || formatQWeatherLocationLabel(geo) || configuredLocation,
      latitude,
      longitude,
      qweatherLocation: parsed ? exactLocation : geo?.id || configuredLocation,
      timezone: geo?.tz || "Asia/Shanghai",
      accuracy: parsed ? "coordinate" : "location-id",
      labelLocationId: geo?.id || "",
    };
  }

  const position = await getBrowserPosition();
  const latitude = position.coords.latitude;
  const longitude = position.coords.longitude;
  const query = `${longitude.toFixed(4)},${latitude.toFixed(4)}`;
  const geo = await fetchQWeatherLocationInfo(query).catch(() => null);

  return {
    label: formatQWeatherLocationLabel(geo) || "??",
    latitude,
    longitude,
    qweatherLocation: query,
    timezone: geo?.tz || "Asia/Shanghai",
    accuracy: position.coords.accuracy,
    labelLocationId: geo?.id || "",
  };
}

async function fetchQWeatherWeather(location, options = {}) {
  const qLocation = location.qweatherLocation || buildQWeatherLocationQuery(location);
  const payload = await fetchAgentJson("/api/weather", {
    params: {
      location: qLocation,
      label: location.label || "",
      lat: Number.isFinite(location.latitude) ? location.latitude : "",
      lon: Number.isFinite(location.longitude) ? location.longitude : "",
      force: options.force ? "true" : "",
    },
    timeoutMs: 12000,
  });

  return payload.data;
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

function clearCustomWeatherLocation() {
  try {
    window.localStorage.removeItem(weatherCustomLocationStorageKey);
  } catch {
    // Local storage can be unavailable in strict browser modes.
  }
}

function normalizeStoredWeatherLocation(location) {
  const latitude = Number(location?.latitude);
  const longitude = Number(location?.longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  return {
    label: String(location.label || location.buttonLabel || "已选地区"),
    buttonLabel: String(location.buttonLabel || location.label || "已选地区"),
    latitude,
    longitude,
    qweatherLocation: location.qweatherLocation || "",
    timezone: location.timezone || "Asia/Shanghai",
    country: location.country || "",
    adm1: location.adm1 || "",
    adm2: location.adm2 || "",
  };
}

function getWeatherLocationKey(location) {
  return String(location?.qweatherLocation || `${Number(location?.longitude).toFixed(4)},${Number(location?.latitude).toFixed(4)}`);
}

function loadWeatherLocationHistory() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(weatherHistoryStorageKey) || "[]");
    return Array.isArray(parsed) ? parsed.map(normalizeStoredWeatherLocation).filter(Boolean).slice(0, maxWeatherLocationHistory) : [];
  } catch {
    return [];
  }
}

function saveWeatherLocationHistory(history) {
  try {
    window.localStorage.setItem(weatherHistoryStorageKey, JSON.stringify(history.slice(0, maxWeatherLocationHistory)));
  } catch {
    // Local storage can be unavailable in strict browser modes.
  }
}

function addWeatherLocationHistory(location) {
  const stored = normalizeStoredWeatherLocation(location);
  if (!stored) {
    return;
  }

  const key = getWeatherLocationKey(stored);
  const history = loadWeatherLocationHistory().filter((item) => getWeatherLocationKey(item) !== key);
  saveWeatherLocationHistory([stored, ...history]);
}

function removeWeatherLocationHistory(index) {
  const history = loadWeatherLocationHistory();
  history.splice(index, 1);
  saveWeatherLocationHistory(history);
  renderWeatherLocationSuggestions();
}

function renderWeatherLocationSuggestionGroup(title, locations, source) {
  if (!locations.length) {
    return "";
  }

  return `
    <section class="weather-location-group">
      <div class="weather-location-group-title">${escapeHtml(title)}</div>
      <div class="weather-location-chip-list">
        ${locations
          .map(
            (location, index) => `
              <button class="weather-location-chip" type="button" data-weather-suggestion-source="${source}" data-weather-suggestion-index="${index}">
                <span>${escapeHtml(location.buttonLabel || location.label)}</span>
                ${source === "history" ? `<b data-weather-history-delete="${index}" aria-label="删除${escapeHtml(location.buttonLabel || location.label)}">×</b>` : ""}
              </button>
            `,
          )
          .join("")}
      </div>
    </section>
  `;
}

function renderWeatherLocationSuggestions() {
  if (!dom.weatherLocationResults) {
    return;
  }

  const history = loadWeatherLocationHistory();
  dom.weatherLocationResults.dataset.mode = "suggestions";
  dom.weatherLocationResults.dataset.history = JSON.stringify(history);
  dom.weatherLocationResults.dataset.recommended = JSON.stringify(weatherRecommendedLocations);
  dom.weatherLocationResults.innerHTML = `
    ${renderWeatherLocationSuggestionGroup("推荐城市", weatherRecommendedLocations, "recommended")}
    ${renderWeatherLocationSuggestionGroup("历史记录", history, "history")}
  `;
}

function renderWeatherLocationResults(items, message = "") {
  if (!dom.weatherLocationResults) {
    return;
  }

  if (message) {
    if (message === "输入城市、区县或街道后搜索") {
      renderWeatherLocationSuggestions();
    } else {
      dom.weatherLocationResults.dataset.mode = "results";
      dom.weatherLocationResults.innerHTML = `<p class="weather-location-message">${escapeHtml(message)}</p>`;
    }
    return;
  }

  dom.weatherLocationResults.dataset.mode = "results";
  dom.weatherLocationResults.innerHTML = items.length
    ? items
        .map((item, index) => {
          const location = normalizeQWeatherLocationItem(item);
          const meta = [item.adm1, item.adm2, item.country].filter(Boolean).join(" · ");
          return `
            <button class="weather-location-result" type="button" role="option" data-weather-location-index="${index}">
              <strong>${escapeHtml(location.buttonLabel)}</strong>
              <span>${escapeHtml(meta || location.label)}</span>
            </button>
          `;
        })
        .join("")
    : `<p class="weather-location-message">没有找到匹配地区</p>`;
}

async function performWeatherLocationSearch(query) {
  const keyword = String(query || "").trim();
  if (!keyword) {
    renderWeatherLocationResults([], "输入城市、区县或街道后搜索");
    return;
  }

  renderWeatherLocationResults([], "搜索中...");
  try {
    const results = await searchQWeatherLocations(keyword);
    if (dom.weatherLocationResults) {
      dom.weatherLocationResults.dataset.results = JSON.stringify(results);
    }
    renderWeatherLocationResults(results);
  } catch (error) {
    console.warn("Weather location search failed", error);
    renderWeatherLocationResults([], "搜索失败，请稍后再试");
  }
}

function chooseWeatherLocation(location, mode = "custom") {
  if (!location || !Number.isFinite(location.latitude) || !Number.isFinite(location.longitude)) {
    return;
  }

  if (mode === "auto") {
    saveWeatherMode("auto");
    clearCustomWeatherLocation();
  } else {
    saveWeatherMode("custom");
    saveCustomWeatherLocation(location);
    addWeatherLocationHistory(location);
  }

  setWeatherLocationPanelOpen(false);
  activeWeatherLocation = location;
  localWeatherLoaded = false;
  loadSelectedWeather({ location, isAuto: mode === "auto" });
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
  const location = await resolveQWeatherLocation();
  return {
    ...location,
    buttonLabel: "自动",
  };
}

async function resolveWeatherLocation(options = {}) {
  if (options.location) {
    return {
      location: options.location,
      isAuto: Boolean(options.isAuto),
    };
  }

  if (getStoredWeatherMode() === "custom") {
    const savedLocation = getSavedCustomWeatherLocation();
    if (savedLocation) {
      return {
        location: savedLocation,
        isAuto: false,
      };
    }
  }

  return {
    location: await getAutoWeatherLocation(),
    isAuto: true,
  };
}

export async function loadSelectedWeather(options = {}) {
  dom = dom || getWeatherDom();
  if (weatherRequestInFlight) {
    return;
  }

  weatherRequestInFlight = true;
  let refreshCompleteText = "";
  if (weatherRefreshResetTimer) {
    window.clearTimeout(weatherRefreshResetTimer);
    weatherRefreshResetTimer = null;
  }
  if (dom.weatherRefreshButton) {
    dom.weatherRefreshButton.disabled = true;
    dom.weatherRefreshButton.textContent = "";
    dom.weatherRefreshButton.classList.add("is-loading");
  }

  try {
    const { location, isAuto } = await resolveWeatherLocation(options);
    activeWeatherLocation = location;
    const weather = await fetchQWeatherWeather(location, { force: Boolean(options.force) });
    renderHomeWeather(weather, {
      location,
      locationLabel: location.label,
      timeZone: location.timezone === "auto" ? undefined : location.timezone,
      isAuto,
    });
    const obsTime = formatWeatherObsTime(weather.current?.obsTime, location.timezone === "auto" ? undefined : location.timezone);
    refreshCompleteText = obsTime || "已更新";
    localWeatherLoaded = true;
  } catch (error) {
    console.warn("Weather update failed", error);
    localWeatherLoaded = false;
    refreshCompleteText = "失败";
  } finally {
    weatherRequestInFlight = false;
    if (dom.weatherRefreshButton) {
      dom.weatherRefreshButton.disabled = false;
      dom.weatherRefreshButton.classList.remove("is-loading");
      dom.weatherRefreshButton.textContent = refreshCompleteText || "";
      if (refreshCompleteText && refreshCompleteText !== "失败") {
        weatherRefreshResetTimer = window.setTimeout(() => {
          dom.weatherRefreshButton.textContent = "";
          weatherRefreshResetTimer = null;
        }, 2600);
      }
    }
  }
}

export function setupWeatherControls() {
  dom = getWeatherDom();
  dom.weatherRefreshButton?.addEventListener("click", (event) => {
    event.preventDefault();
    localWeatherLoaded = false;
    loadSelectedWeather({ force: true });
  });

  dom.weatherLocationButton?.addEventListener("click", (event) => {
    event.preventDefault();
    const shouldOpen = dom.weatherLocationPanel?.hidden ?? true;
    setWeatherLocationPanelOpen(shouldOpen);
    if (shouldOpen) {
      renderWeatherLocationResults([], "输入城市、区县或街道后搜索");
      dom.weatherLocationInput?.focus();
    }
  });

  dom.weatherLocationForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    performWeatherLocationSearch(dom.weatherLocationInput?.value);
  });

  dom.weatherLocationInput?.addEventListener("input", () => {
    if (weatherLocationSearchTimer) {
      window.clearTimeout(weatherLocationSearchTimer);
    }
    const value = dom.weatherLocationInput?.value.trim() || "";
    if (!value) {
      renderWeatherLocationSuggestions();
      return;
    }
    weatherLocationSearchTimer = window.setTimeout(() => {
      performWeatherLocationSearch(value);
    }, 360);
  });

  dom.weatherLocationResults?.addEventListener("click", (event) => {
    const deleteButton = event.target instanceof Element ? event.target.closest("[data-weather-history-delete]") : null;
    if (deleteButton) {
      event.preventDefault();
      event.stopPropagation();
      removeWeatherLocationHistory(Number(deleteButton.getAttribute("data-weather-history-delete")));
      return;
    }

    const suggestionButton = event.target instanceof Element ? event.target.closest("[data-weather-suggestion-source]") : null;
    if (suggestionButton) {
      const source = suggestionButton.getAttribute("data-weather-suggestion-source");
      const index = Number(suggestionButton.getAttribute("data-weather-suggestion-index"));
      const datasetName = source === "history" ? "history" : "recommended";
      const items = JSON.parse(dom.weatherLocationResults.dataset[datasetName] || "[]");
      const location = normalizeStoredWeatherLocation(items[index]);
      if (location) {
        chooseWeatherLocation(location, "custom");
      }
      return;
    }

    const button = event.target instanceof Element ? event.target.closest("[data-weather-location-index]") : null;
    if (!button) {
      return;
    }

    const results = JSON.parse(dom.weatherLocationResults.dataset.results || "[]");
    const item = results[Number(button.dataset.weatherLocationIndex)];
    if (item) {
      chooseWeatherLocation(normalizeQWeatherLocationItem(item), "custom");
    }
  });

  dom.weatherUseAutoButton?.addEventListener("click", (event) => {
    event.preventDefault();
    saveWeatherMode("auto");
    clearCustomWeatherLocation();
    setWeatherLocationPanelOpen(false);
    localWeatherLoaded = false;
    loadSelectedWeather();
  });

  document.addEventListener("click", (event) => {
    if (
      dom.weatherLocationPanel?.hidden ||
      !(event.target instanceof Element) ||
      event.target.closest(".weather-location-head, .weather-location-panel")
    ) {
      return;
    }

    setWeatherLocationPanelOpen(false);
  });

  setupDailyWeatherScroller();
  setupWeatherMetricsScroller();
  setupHourlyWeatherScroller();
}



export function renderBriefWeatherIfNeeded(weather) {
  dom = dom || getWeatherDom();

  if (!localWeatherLoaded && !weatherRequestInFlight) {
    const location = activeWeatherLocation ?? weatherLocations.beijing;
    renderHomeWeather(weather, {
      location,
      locationLabel: location.label,
      timeZone: location.timezone,
      isAuto: true,
    });
  }
}
