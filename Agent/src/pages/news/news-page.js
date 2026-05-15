let dom = null;

function getNewsDom() {
  return {
    chinaTopNews: document.querySelector("#chinaTopNews"),
    chinaSocietyNews: document.querySelector("#chinaSocietyNews"),
    chinaFinanceNews: document.querySelector("#chinaFinanceNews"),
    worldTopNews: document.querySelector("#worldTopNews"),
    worldBusinessNews: document.querySelector("#worldBusinessNews"),
    worldTechNews: document.querySelector("#worldTechNews"),
    nbaNews: document.querySelector("#nbaNews"),
    emptyStateTemplate: document.querySelector("#emptyStateTemplate"),
  };
}

function clearElement(element) {
  if (element) {
    element.replaceChildren();
  }
}

function renderEmpty(element) {
  clearElement(element);
  if (!element) {
    return;
  }

  if (dom.emptyStateTemplate?.content) {
    element.append(dom.emptyStateTemplate.content.cloneNode(true));
    return;
  }

  element.innerHTML = '<div class="empty-state"><p>No items to show yet.</p></div>';
}

function formatDateTime(value) {
  const date = new Date(value);
  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "Asia/Shanghai",
  }).format(date);
}

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


export function renderNewsPage(news = {}) {
  dom = dom || getNewsDom();

  renderNews(dom.chinaTopNews, news.chinaTop ?? news.domestic ?? [], "chinaTop");
  renderNews(dom.chinaSocietyNews, news.chinaSociety ?? [], "chinaSociety");
  renderNews(dom.chinaFinanceNews, news.chinaFinance ?? [], "chinaFinance");
  renderNews(dom.worldTopNews, news.worldTop ?? news.international ?? [], "worldTop");
  renderNews(dom.worldBusinessNews, news.worldBusiness ?? [], "worldBusiness");
  renderNews(dom.worldTechNews, news.worldTech ?? [], "worldTech");
  renderNews(dom.nbaNews, news.nba ?? [], "nba");
}
