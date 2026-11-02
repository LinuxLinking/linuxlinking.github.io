/* 文章正文在构建期渲染成静态 HTML（tools/markdown.py），这里只剩 mermaid 图表。

   mermaid 体积大（约 2.6MB），所以只在文中真的出现 mermaid 代码块时才加载。 */

const bodyEl = document.getElementById("post-body");

/* Mermaid 配色跟着纸面主题走：白底、墨线、朱红强调。 */
const MERMAID_THEME_VARS = {
  background: "transparent",
  primaryColor: "#ffffff",
  primaryTextColor: "#1a1a18",
  primaryBorderColor: "#cbc7ba",
  lineColor: "#57554e",
  secondaryColor: "#fbfaf7",
  tertiaryColor: "#f6f5f0",
  textColor: "#1a1a18",
  fontSize: "13px",
};

async function renderMermaidBlocks() {
  const blocks = Array.from(bodyEl.querySelectorAll("pre > code.language-mermaid"));
  if (!blocks.length) return;

  let mermaid;
  try {
    mermaid = (await import("./vendor/mermaid/mermaid.esm.min.mjs")).default;
    mermaid.initialize({
      startOnLoad: false,
      theme: "base",
      themeVariables: MERMAID_THEME_VARS,
      fontFamily: "var(--font-mono, monospace)",
    });
  } catch (err) {
    console.warn("[post] mermaid load failed:", err);
    markMermaidFailure(blocks);
    return;
  }

  for (let i = 0; i < blocks.length; i++) {
    const codeEl = blocks[i];
    const source = codeEl.textContent;
    try {
      const { svg } = await mermaid.render(`mermaid-${i}-${Date.now()}`, source);
      const holder = document.createElement("figure");
      holder.className = "md-mermaid";
      holder.innerHTML = svg;
      codeEl.closest("pre").replaceWith(holder);
    } catch (err) {
      console.warn(`[post] mermaid block ${i} failed:`, err);
      markMermaidFailure([codeEl]);
    }
  }
}

function markMermaidFailure(blocks) {
  for (const codeEl of blocks) {
    const pre = codeEl.closest("pre");
    if (!pre) continue;
    pre.classList.add("md-mermaid-fail");
    const note = document.createElement("p");
    note.className = "md-mermaid-note";
    note.textContent = "图表渲染失败，以上为 Mermaid 源码 · Diagram failed to render; the Mermaid source is above.";
    pre.after(note);
  }
}

renderMermaidBlocks();
