let dom = null;

function getPapersDom() {
  return {
    highlights: document.querySelector("#paperHighlights"),
    rotationLabel: document.querySelector("#paperRotationLabel"),
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
  clearElement(dom.highlights);

  if (!sections.length) {
    renderEmpty(dom.highlights);
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

    dom.highlights.append(wrapper);
  });
}


export function renderPapersPage(aiPapers = {}) {
  dom = dom || getPapersDom();

  if (dom.rotationLabel) {
    dom.rotationLabel.textContent = aiPapers.rotationLabel ?? "Daily Rotation";
  }

  renderPaperSections(aiPapers.sections ?? []);
}
