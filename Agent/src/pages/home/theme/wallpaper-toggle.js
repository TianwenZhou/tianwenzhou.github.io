const wallpaperStorageKey = "agent-dashboard-home-wallpaper-v1";
const wallpaperModes = new Set(["day", "night"]);

function getInitialWallpaperMode() {
  try {
    const savedMode = window.localStorage.getItem(wallpaperStorageKey);
    return wallpaperModes.has(savedMode) ? savedMode : "day";
  } catch {
    return "day";
  }
}

function persistWallpaperMode(mode) {
  try {
    window.localStorage.setItem(wallpaperStorageKey, mode);
  } catch {
    // Keep the toggle usable even when storage is blocked.
  }
}

function applyWallpaperMode(mode) {
  const normalizedMode = wallpaperModes.has(mode) ? mode : "day";
  document.body.dataset.homeWallpaper = normalizedMode;

  const toggle = document.querySelector("#homeWallpaperToggle");
  if (!toggle) {
    return;
  }

  const isNight = normalizedMode === "night";
  toggle.classList.toggle("is-night", isNight);
  toggle.setAttribute("aria-pressed", String(isNight));
  toggle.setAttribute("aria-label", isNight ? "切换日间模式" : "切换夜间模式");
  toggle.setAttribute("title", isNight ? "切换日间模式" : "切换夜间模式");
}

export function setupHomeWallpaperToggle() {
  const toggle = document.querySelector("#homeWallpaperToggle");
  const initialMode = getInitialWallpaperMode();
  applyWallpaperMode(initialMode);

  toggle?.addEventListener("click", () => {
    const nextMode = document.body.dataset.homeWallpaper === "night" ? "day" : "night";
    applyWallpaperMode(nextMode);
    persistWallpaperMode(nextMode);
  });
}
