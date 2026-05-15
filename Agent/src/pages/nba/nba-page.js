let dom = null;

function getNbaDom() {
  return {
    scoreboard: document.querySelector("#nbaScoreboard"),
  };
}

function clearElement(element) {
  if (element) {
    element.replaceChildren();
  }
}

const nbaScheduleState = {
  days: [],
  activeIndex: 0,
  currentIndex: 0,
};

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
  clearElement(dom.scoreboard);

  if (!nbaScheduleState.days.length) {
    dom.scoreboard.innerHTML = `
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

  dom.scoreboard.append(wrapper);
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

export function setupNbaScheduleNavigation() {
  dom = dom || getNbaDom();

  dom.scoreboard?.addEventListener("click", (event) => {
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


export function renderNbaPage(scoreboard) {
  dom = dom || getNbaDom();
  renderNbaScoreboard(scoreboard);
}
