const availableViews = new Set(["home", "news", "nba", "papers"]);

let previousNavActiveIndex = null;

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


let dom = null;

function getNavigationDom() {
  return {
    viewButtons: Array.from(document.querySelectorAll("[data-view-target]")),
    views: Array.from(document.querySelectorAll("[data-view]")),
  };
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

function getNextViewByDirection(direction) {
  const currentView = document.body.dataset.activeView || getRequestedView();
  const currentIndex = Math.max(navigationCycle.indexOf(currentView), 0);
  const nextIndex =
    (currentIndex + direction + navigationCycle.length) % navigationCycle.length;
  return navigationCycle[nextIndex];
}

export function setupViewNavigation() {
  dom = getNavigationDom();
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

  setActiveView(getRequestedView(), { updateHash: false });
}
