const dataUrl = `./data/daily-brief.json?ts=${Date.now()}`;

const dom = {
  generatedAt: document.querySelector("#generatedAt"),
  weatherLocation: document.querySelector("#weatherLocation"),
  weatherCurrent: document.querySelector("#weatherCurrent"),
  weatherDaily: document.querySelector("#weatherDaily"),
  currentDate: document.querySelector("#currentDate"),
  currentTime: document.querySelector("#currentTime"),
  schedulePanel: document.querySelector("#schedulePanel"),
  domesticNews: document.querySelector("#domesticNews"),
  internationalNews: document.querySelector("#internationalNews"),
  nbaNews: document.querySelector("#nbaNews"),
  paperHighlights: document.querySelector("#paperHighlights"),
  paperRotationLabel: document.querySelector("#paperRotationLabel"),
  emptyStateTemplate: document.querySelector("#emptyStateTemplate"),
};

const weatherCodeMap = {
  0: "晴朗",
  1: "基本晴",
  2: "局部多云",
  3: "阴天",
  45: "有雾",
  48: "雾凇",
  51: "小毛毛雨",
  53: "毛毛雨",
  55: "强毛毛雨",
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
}

function clearElement(element) {
  element.innerHTML = "";
}

function renderEmpty(element) {
  clearElement(element);
  element.append(dom.emptyStateTemplate.content.cloneNode(true));
}

function renderWeather(weather) {
  dom.weatherLocation.textContent = weather.location;
  dom.weatherCurrent.classList.remove("skeleton");
  dom.weatherCurrent.innerHTML = `
    <div>
      <strong>${weather.current.temperature}°C</strong>
      <p>${weatherCodeMap[weather.current.weatherCode] ?? "天气更新中"}</p>
    </div>
    <div>
      <p>风速 ${weather.current.windSpeed} km/h</p>
      <p>最高 ${weather.today.max}°C / 最低 ${weather.today.min}°C</p>
      <p>降水概率 ${weather.today.precipitationProbability}%</p>
    </div>
  `;

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

function renderNews(container, items) {
  clearElement(container);
  if (!items.length) {
    renderEmpty(container);
    return;
  }

  items.forEach((item) => {
    const node = document.createElement("a");
    node.className = "news-item";
    node.href = item.link;
    node.target = "_blank";
    node.rel = "noreferrer";
    node.innerHTML = `
      <time datetime="${item.publishedAt}">${formatDateTime(item.publishedAt)}</time>
      <h3>${item.title}</h3>
      <p>${item.summary}</p>
      <span class="news-source">${item.source ?? ""}</span>
    `;
    container.append(node);
  });
}

function formatScheduleTime(value) {
  const date = new Date(value);
  return new Intl.DateTimeFormat("zh-CN", {
    month: "numeric",
    day: "numeric",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Shanghai",
  }).format(date);
}

function renderSchedule(schedule) {
  clearElement(dom.schedulePanel);

  if (!schedule?.enabled) {
    dom.schedulePanel.innerHTML = `
      <div class="empty-state neutral-state">
        <p>??????? Google Calendar ??????????</p>
      </div>
    `;
    return;
  }

  if (!schedule.items?.length) {
    dom.schedulePanel.innerHTML = `
      <div class="empty-state neutral-state">
        <p>Google Calendar ???????????????????????????????</p>
      </div>
    `;
    return;
  }

  const list = document.createElement("div");
  list.className = "schedule-list";
  list.innerHTML = schedule.items
    .map(
      (item) => `
        <article class="schedule-item">
          <p class="schedule-time">${formatScheduleTime(item.start)}</p>
          <h3>${item.title}</h3>
          <p>${item.location ?? "Google Calendar"}</p>
        </article>
      `,
    )
    .join("");
  dom.schedulePanel.append(list);
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
  renderSchedule(data.schedule);
  renderNews(dom.domesticNews, data.news.domestic ?? []);
  renderNews(dom.internationalNews, data.news.international ?? []);
  renderNews(dom.nbaNews, data.news.nba ?? []);
  renderPaperSections(data.aiPapers.sections ?? []);
}

function renderError(message) {
  dom.generatedAt.textContent = message;
  dom.weatherCurrent.classList.remove("skeleton");
  dom.weatherCurrent.innerHTML = `<div class="error-state"><p>${message}</p></div>`;
  clearElement(dom.weatherDaily);
  renderEmpty(dom.domesticNews);
  renderEmpty(dom.internationalNews);
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
