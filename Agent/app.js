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
  currentMonthLabel: document.querySelector("#currentMonthLabel"),
  currentMonthCalendar: document.querySelector("#currentMonthCalendar"),
  nextMonthLabel: document.querySelector("#nextMonthLabel"),
  nextMonthCalendar: document.querySelector("#nextMonthCalendar"),
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
  emptyStateTemplate: document.querySelector("#emptyStateTemplate"),
};

let featuredPlaceTimer = null;
let lastCalendarKey = "";

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
  clear:
    "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80",
  cloudy:
    "https://images.unsplash.com/photo-1499346030926-9a72daac6c63?auto=format&fit=crop&w=1200&q=80",
  rain:
    "https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&w=1200&q=80",
  snow:
    "https://images.unsplash.com/photo-1483664852095-d6cc6870702d?auto=format&fit=crop&w=1200&q=80",
  storm:
    "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1200&q=80",
  fog:
    "https://images.unsplash.com/photo-1487621167305-5d248087c724?auto=format&fit=crop&w=1200&q=80",
};

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
  const calendarKey = `${parts.year}-${parts.month}`;
  if (calendarKey !== lastCalendarKey) {
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
    const weekday = (index % 7) + 1;
    const classNames = [
      "calendar-day",
      isToday ? "is-today" : "",
      weekday >= 6 ? "is-weekend" : "",
    ]
      .filter(Boolean)
      .join(" ");

    cells.push(`<span class="${classNames}">${dayNumber}</span>`);
  }

  return cells.join("");
}

function renderCalendars(todayParts) {
  const currentMonthIndex = todayParts.month - 1;
  const nextMonthIndex = currentMonthIndex === 11 ? 0 : currentMonthIndex + 1;
  const nextMonthYear = currentMonthIndex === 11 ? todayParts.year + 1 : todayParts.year;

  dom.currentMonthLabel.textContent = getMonthLabel(todayParts.year, currentMonthIndex);
  dom.currentMonthCalendar.innerHTML = buildCalendarMonth(
    todayParts.year,
    currentMonthIndex,
    todayParts,
  );

  dom.nextMonthLabel.textContent = getMonthLabel(nextMonthYear, nextMonthIndex);
  dom.nextMonthCalendar.innerHTML = buildCalendarMonth(
    nextMonthYear,
    nextMonthIndex,
    todayParts,
  );
}

function clearElement(element) {
  element.innerHTML = "";
}

function hashString(value) {
  return [...value].reduce(
    (result, character) => result * 31 + character.charCodeAt(0),
    7,
  );
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
  return pool[Math.abs(hashString(key)) % pool.length];
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
  dom.weatherVisual.style.backgroundImage = `linear-gradient(180deg, rgba(7, 25, 46, 0.10), rgba(7, 25, 46, 0.42)), url(${getWeatherVisual(weather.current.weatherCode)})`;

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

function renderNbaScoreboard(scoreboard) {
  clearElement(dom.nbaScoreboard);

  if (!scoreboard?.games?.length) {
    dom.nbaScoreboard.innerHTML = `
      <div class="empty-state neutral-state scoreboard-empty">
        <p>今天暂时还没有抓到 NBA 赛程或比分。</p>
      </div>
    `;
    return;
  }

  const wrapper = document.createElement("div");
  wrapper.className = "scoreboard-list";
  wrapper.innerHTML = scoreboard.games
    .map(
      (game) => `
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
          <p class="scoreboard-note">${game.note}</p>
        </a>
      `,
    )
    .join("");

  dom.nbaScoreboard.append(wrapper);
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

renderClock();
setInterval(renderClock, 1000);
loadBrief();
