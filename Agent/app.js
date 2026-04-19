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
  currentDate: document.querySelector("#currentDate"),
  currentTime: document.querySelector("#currentTime"),
  featuredPlacePanel: document.querySelector("#featuredPlacePanel"),
  domesticNews: document.querySelector("#domesticNews"),
  internationalNews: document.querySelector("#internationalNews"),
  nbaScoreboard: document.querySelector("#nbaScoreboard"),
  nbaNews: document.querySelector("#nbaNews"),
  paperHighlights: document.querySelector("#paperHighlights"),
  paperRotationLabel: document.querySelector("#paperRotationLabel"),
  emptyStateTemplate: document.querySelector("#emptyStateTemplate"),
};

const weatherCodeMap = {
  0: "??",
  1: "???",
  2: "????",
  3: "??",
  45: "??",
  48: "??",
  51: "???",
  53: "??",
  55: "??",
  61: "??",
  63: "??",
  65: "??",
  71: "??",
  73: "??",
  75: "??",
  80: "??",
  81: "???",
  82: "??",
  95: "??",
};

const weatherVisuals = {
  clear: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80",
  cloudy: "https://images.unsplash.com/photo-1499346030926-9a72daac6c63?auto=format&fit=crop&w=1200&q=80",
  rain: "https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&w=1200&q=80",
  snow: "https://images.unsplash.com/photo-1483664852095-d6cc6870702d?auto=format&fit=crop&w=1200&q=80",
  storm: "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1200&q=80",
  fog: "https://images.unsplash.com/photo-1487621167305-5d248087c724?auto=format&fit=crop&w=1200&q=80",
};

const newsFallbacks = {
  domestic: "https://images.unsplash.com/photo-1508804185872-d7badad00f7d?auto=format&fit=crop&w=1200&q=80",
  international: "https://images.unsplash.com/photo-1521295121783-8a321d551ad2?auto=format&fit=crop&w=1200&q=80",
  nba: "https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=1200&q=80",
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
}

function clearElement(element) {
  element.innerHTML = "";
}

function renderEmpty(element) {
  clearElement(element);
  element.append(dom.emptyStateTemplate.content.cloneNode(true));
}

function renderWeather(weather) {
  dom.weatherCurrent.classList.remove("skeleton");
  dom.weatherLocation.textContent = weather.location;
  dom.weatherCondition.textContent = weatherCodeMap[weather.current.weatherCode] ?? "?????";
  dom.weatherTemperature.textContent = `${weather.current.temperature}?C`;
  dom.weatherDescription.textContent = `${weatherCodeMap[weather.current.weatherCode] ?? "?????"} ? ????`;
  dom.weatherWind.textContent = `?? ${weather.current.windSpeed} km/h`;
  dom.weatherRange.textContent = `?? ${weather.today.max}? / ${weather.today.min}?`;
  dom.weatherRain.textContent = `?? ${weather.today.precipitationProbability}%`;
  dom.weatherVisual.style.backgroundImage = `linear-gradient(180deg, rgba(7, 25, 46, 0.10), rgba(7, 25, 46, 0.42)), url(${getWeatherVisual(weather.current.weatherCode)})`;

  clearElement(dom.weatherDaily);
  weather.forecast.forEach((day) => {
    const node = document.createElement("article");
    node.className = "forecast-card";
    node.innerHTML = `
      <p class="date">${formatDate(day.date)}</p>
      <div class="temp">${day.max}? / ${day.min}?</div>
      <p>${weatherCodeMap[day.weatherCode] ?? "?????"}</p>
      <p>?? ${day.precipitationProbability}%</p>
    `;
    dom.weatherDaily.append(node);
  });
}

function renderFeaturedPlace(featuredPlace) {
  clearElement(dom.featuredPlacePanel);

  if (!featuredPlace) {
    dom.featuredPlacePanel.innerHTML = `
      <div class="empty-state neutral-state">
        <p>????????????</p>
      </div>
    `;
    return;
  }

  dom.featuredPlacePanel.classList.remove("skeleton");
  dom.featuredPlacePanel.innerHTML = `
    <a class="featured-place-card" href="${featuredPlace.link}" target="_blank" rel="noreferrer" style="background-image: linear-gradient(180deg, rgba(6, 16, 28, 0.08), rgba(6, 16, 28, 0.75)), url(${featuredPlace.image});">
      <div class="featured-place-content">
        <span class="featured-place-tag">${featuredPlace.region}</span>
        <h3>${featuredPlace.title}</h3>
        <p class="featured-place-location">${featuredPlace.location}</p>
        <p class="featured-place-summary">${featuredPlace.summary}</p>
      </div>
    </a>
  `;
}

function renderNews(container, items, section) {
  clearElement(container);
  if (!items.length) {
    renderEmpty(container);
    return;
  }

  items.forEach((item) => {
    const node = document.createElement("a");
    node.className = "news-item premium-news-card";
    node.href = item.link;
    node.target = "_blank";
    node.rel = "noreferrer";
    const summary = item.summary ? `<p>${item.summary}</p>` : "";
    const image = item.image || newsFallbacks[section] || newsFallbacks.international;
    node.style.backgroundImage = `linear-gradient(180deg, rgba(7, 17, 29, 0.18), rgba(7, 17, 29, 0.88)), url(${image})`;
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
        <p>????????? NBA ??????</p>
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
  const authors = paper.authors?.length ? paper.authors.join(" / ") : "???????";
  const tags = [paper.venue, paper.year, paper.quality].filter(Boolean).join(" ? ");

  return `
    <article class="paper-card">
      <div class="paper-meta">
        <span>${paper.trackLabel ?? "????"}</span>
        <span>${tags}</span>
      </div>
      <h3>${paper.title}</h3>
      <p class="paper-summary">${paper.summary}</p>
      <p class="paper-authors">${authors}</p>
      <footer>
        <span class="pill">${paper.categories.join(", ")}</span>
        <a href="${paper.link}" target="_blank" rel="noreferrer">????</a>
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
      : `<div class="empty-state"><p>??????????????????</p></div>`;

    wrapper.innerHTML = `
      <header class="paper-section-header">
        <div>
          <h3>${section.title}</h3>
          <p>${section.description}</p>
        </div>
        <span class="panel-tag">${section.rotationHint ?? `${section.items.length} ?`}</span>
      </header>
      <div class="paper-grid">
        ${body}
      </div>
    `;

    dom.paperHighlights.append(wrapper);
  });
}

function renderPage(data) {
  dom.generatedAt.textContent = `???????${formatDateTime(data.generatedAt)}`;
  dom.paperRotationLabel.textContent = data.aiPapers.rotationLabel ?? "Daily Rotation";
  renderWeather(data.weather);
  renderFeaturedPlace(data.featuredPlace);
  renderNews(dom.domesticNews, data.news.domestic ?? [], "domestic");
  renderNews(dom.internationalNews, data.news.international ?? [], "international");
  renderNbaScoreboard(data.nbaScoreboard);
  renderNews(dom.nbaNews, data.news.nba ?? [], "nba");
  renderPaperSections(data.aiPapers.sections ?? []);
}

function renderError(message) {
  dom.generatedAt.textContent = message;
  dom.weatherCurrent.classList.remove("skeleton");
  dom.weatherCurrent.innerHTML = `<div class="error-state"><p>${message}</p></div>`;
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
    renderError(`?????????${error.message}`);
  }
}

renderClock();
setInterval(renderClock, 1000);
loadBrief();
