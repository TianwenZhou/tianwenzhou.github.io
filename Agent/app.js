const dataUrl = `./data/daily-brief.json?ts=${Date.now()}`;

const dom = {
  generatedAt: document.querySelector("#generatedAt"),
  weatherLocation: document.querySelector("#weatherLocation"),
  weatherCurrent: document.querySelector("#weatherCurrent"),
  weatherVisual: document.querySelector("#weatherVisual"),
  weatherCondition: document.querySelector("#weatherCondition"),
  weatherTemperature: document.querySelector("#weatherTemperature"),
  weatherDescription: document.querySelector("#weatherDescription"),
  weatherWind: document.querySelector("#weatherWind"),
  weatherRange: document.querySelector("#weatherRange"),
  weatherRain: document.querySelector("#weatherRain"),
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
  domesticNews: document.querySelector("#domesticNews"),
  internationalNews: document.querySelector("#internationalNews"),
  nbaScoreboard: document.querySelector("#nbaScoreboard"),
  nbaNews: document.querySelector("#nbaNews"),
  paperHighlights: document.querySelector("#paperHighlights"),
  paperRotationLabel: document.querySelector("#paperRotationLabel"),
  viewButtons: Array.from(document.querySelectorAll("[data-view-target]")),
  views: Array.from(document.querySelectorAll("[data-view]")),
  emptyStateTemplate: document.querySelector("#emptyStateTemplate"),
};

let featuredPlaceTimer = null;
let lastCalendarKey = "";
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

function renderClock() {
  const now = new Date();
  dom.currentDate.textContent = new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "full",
    timeZone: "Asia/Shanghai",
  }).format(now);
  dom.currentTime.textContent = new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "Asia/Shanghai",
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

function setActiveView(viewName, { updateHash = true } = {}) {
  const safeView = availableViews.has(viewName) ? viewName : "home";

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
  if (section === "domestic") {
    return pickNewsFallback(
      section,
      `${item.source ?? "domestic"}-${index}-${item.title}`,
    );
  }

  if (hasUsableNewsImage(item.image)) {
    return item.image;
  }

  return pickNewsFallback(
    section,
    `${section}-${index}-${item.title}-${item.source ?? ""}`,
  );
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

function renderFeaturedPlace(featuredPlaces) {
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
          <span class="featured-place-rotation">每 8 秒自动切换</span>
          <div class="featured-place-dots" id="featuredPlaceDots"></div>
        </div>
      </div>
    </a>
  `;

  const card = dom.featuredPlacePanel.querySelector(".featured-place-card");
  const region = dom.featuredPlacePanel.querySelector("#featuredPlaceRegion");
  const name = dom.featuredPlacePanel.querySelector("#featuredPlaceName");
  const location = dom.featuredPlacePanel.querySelector("#featuredPlaceLocation");
  const summary = dom.featuredPlacePanel.querySelector("#featuredPlaceSummary");
  const dots = dom.featuredPlacePanel.querySelector("#featuredPlaceDots");
  let activeIndex = 0;

  function renderSlide(index) {
    const place = featuredPlaces[index];
    card.href = place.link;
    card.style.backgroundImage = `linear-gradient(180deg, rgba(6, 16, 28, 0.08), rgba(6, 16, 28, 0.82)), url(${place.image})`;
    region.textContent = place.region;
    name.textContent = place.title;
    location.textContent = place.location;
    summary.textContent = place.summary;
    dots.innerHTML = featuredPlaces
      .map(
        (_, dotIndex) =>
          `<span class="featured-place-dot${
            dotIndex === index ? " is-active" : ""
          }"></span>`,
      )
      .join("");
    card.classList.remove("is-entering");
    void card.offsetWidth;
    card.classList.add("is-entering");
  }

  renderSlide(activeIndex);

  if (featuredPlaces.length > 1) {
    featuredPlaceTimer = window.setInterval(() => {
      activeIndex = (activeIndex + 1) % featuredPlaces.length;
      renderSlide(activeIndex);
    }, 8000);
  }
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
    node.style.backgroundImage = `linear-gradient(180deg, rgba(7, 17, 29, 0.18), rgba(7, 17, 29, 0.90)), url(${image})`;
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
  dom.paperRotationLabel.textContent = data.aiPapers.rotationLabel ?? "Daily Rotation";
  renderWeather(data.weather);
  renderTodayInHistory(data.todayInHistory);
  renderClassicQuote(data.classicQuote);
  renderFeaturedPlace(
    data.featuredPlaces ??
      (data.featuredPlace ? [data.featuredPlace] : []),
  );
  renderNews(dom.domesticNews, data.news.domestic ?? [], "domestic");
  renderNews(dom.internationalNews, data.news.international ?? [], "international");
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
  dom.weatherCurrent.classList.remove("skeleton");
  dom.weatherCurrent.innerHTML = `<div class="error-state"><p>${message}</p></div>`;
  dom.classicQuoteCard.classList.remove("skeleton");
  dom.classicQuoteCard.innerHTML = `<div class="error-state"><p>${message}</p></div>`;
  dom.featuredPlacePanel.classList.remove("skeleton");
  dom.featuredPlacePanel.innerHTML = `<div class="error-state"><p>${message}</p></div>`;
  clearElement(dom.weatherDaily);
  dom.historyTodayMeta.textContent = "今天";
  dom.historyTodayList.innerHTML = `<p>${message}</p>`;
  renderEmpty(dom.domesticNews);
  renderEmpty(dom.internationalNews);
  clearElement(dom.nbaScoreboard);
  dom.nbaScoreboard.innerHTML = `<div class="empty-state"><p>${message}</p></div>`;
  renderEmpty(dom.nbaNews);
  renderEmpty(dom.paperHighlights);
}

async function loadBrief() {
  try {
    const response = await fetch(dataUrl, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    renderPage(data);
  } catch (error) {
    renderError(`读取每日摘要失败：${error.message}`);
  }
}

setupViewNavigation();
setupCalendarNavigation();
setupNbaScheduleNavigation();
renderClock();
setInterval(renderClock, 1000);
loadBrief();
