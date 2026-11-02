import { escapeHtml } from "./shared.js?v=2e114873";

function row(node) {
  const c1 = (node.accent && node.accent[0]) || "#7c5cff";
  const c2 = (node.accent && node.accent[1]) || "#3ad0ff";
  const glyphClass = node.kind === "moon" ? "orb row-orb is-glyph" : "orb row-orb";
  return `<a class="row" href="${escapeHtml(node.href)}">
    <span class="${glyphClass}" style="--c1:${c1};--c2:${c2}"><span>${escapeHtml(node.monogram)}</span></span>
    <span class="row-main">
      <span class="row-title">${escapeHtml(node.titleText)}</span>
      <span class="row-sub">${escapeHtml(node.taglineText)}</span>
    </span>
    <span class="row-go" aria-hidden="true">↗</span>
  </a>`;
}

export function renderList(root, { nodes, t, onAbout }) {
  const groups = [
    { key: "list.projects", items: nodes.filter((n) => n.kind === "project") },
    { key: "list.writing", items: nodes.filter((n) => n.kind === "blog") },
    { key: "list.more", items: nodes.filter((n) => n.kind === "moon") }
  ];

  const parts = groups
    .filter((group) => group.items.length)
    .map(
      (group) =>
        `<section class="list-group"><h2 class="kicker">${escapeHtml(t(group.key))}</h2>${group.items
          .map(row)
          .join("")}</section>`
    );

  parts.push(
    `<section class="list-group"><h2 class="kicker">${escapeHtml(t("list.about"))}</h2>
      <button class="row" type="button" data-about>
        <span class="orb row-orb" style="--c1:#4a5568;--c2:#2d3548"><span>?</span></span>
        <span class="row-main">
          <span class="row-title">${escapeHtml(t("list.about"))}</span>
          <span class="row-sub">${escapeHtml(t("list.aboutSub"))}</span>
        </span>
        <span class="row-go" aria-hidden="true">→</span>
      </button>
    </section>`
  );

  root.innerHTML = `<div class="list-inner">${parts.join("")}</div>`;

  const aboutRow = root.querySelector("[data-about]");
  if (aboutRow && typeof onAbout === "function") {
    aboutRow.addEventListener("click", onAbout);
  }
}
