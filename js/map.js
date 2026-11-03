/* 图纸视图：把站点画成一张目录式示意图。
 *
 * 结构：一条主轴线串起全部条目，分区用小标题标出，文章缩进挂在「文字」聚合节点下面。
 * 宽屏排两栏（作品 | 文字 + 其他），像一张真正的图纸：文字不缩放，清晰可读。
 * 交互（拖拽 / 滚轮缩放 / 双击复位）沿用原来那套实现，换掉的只是布局与画法。
 */

const ROW_H = 44;       // 条目行高
const SECTION_H = 64;   // 分区标题占位
const BOX = 32;         // 节点方块边长
const SPINE_X = 0;      // 主轴线
const STUB_GAP = 12;    // 引线到方块之间的留白
const STUB_W = 36;      // 一级引线长度
const CHILD_STUB_W = 6; // 二级引线长度
const RAIL_X = SPINE_X + STUB_W + STUB_GAP + BOX + 18; // 子级竖线
const COL_GAP = 560;    // 第二栏的 x
const TWO_COL_MIN = 760; // 窄于此宽度就并成一栏

const SECTION_OF = { project: "projects", blog: "writing", moon: "other" };

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
const easeOutCubic = (p) => 1 - Math.pow(1 - p, 3);

function sectionOf(data) {
  return SECTION_OF[data.kind] || "other";
}

/* 文章（kind=blog 且不是聚合节点本身）挂在「文字」下面。 */
function isChild(data) {
  return data.kind === "blog" && data.id !== "blog";
}

function ellipsis(text, limit) {
  const clean = String(text || "").trim();
  return clean.length > limit ? `${clean.slice(0, limit - 1)}…` : clean;
}

export function createMap({ container, stage, labels = {}, reducedMotion = false, onOpen }) {
  let nodes = [];
  let lastList = [];
  let twoColumns = true;
  let scale = 1;
  let tx = 0;
  let ty = 0;
  let fitScale = 1;
  let fitOffsetY = 0;
  let minScale = 0.4;
  let maxScale = 2.4;
  let box = { x: 0, y: 0, w: 1, h: 1 };
  let built = false;
  let intro = !reducedMotion;

  let tweenId = 0;
  let frameQueued = false;
  let resizeTimer = 0;
  let introTimer = 0;

  const pointers = new Map();
  let drag = null;
  let pinch = null;
  let suppressClick = false;

  /* 目录布局：分区标题 + 条目行；宽屏分两栏，文章缩进一层。 */
  function layout(list) {
    const rows = [];
    const yByCol = [0, 0];
    let section = null;
    let parentRow = null;
    let col = 0;

    for (const data of list) {
      const key = sectionOf(data);
      if (key !== section) {
        section = key;
        parentRow = null;
        col = twoColumns && key !== "projects" ? 1 : 0;
        rows.push({ type: "section", key, y: yByCol[col], col });
        yByCol[col] += SECTION_H;
      }
      const child = isChild(data);
      if (!child) parentRow = { data, y: yByCol[col] };
      const stubW = child ? CHILD_STUB_W : STUB_W;
      const stubFrom = child ? RAIL_X : SPINE_X;
      rows.push({
        type: "node",
        data,
        y: yByCol[col],
        col,
        child,
        parent: child ? parentRow : null,
        stubW,
        stubFrom,
        left: stubFrom + stubW + STUB_GAP
      });
      yByCol[col] += ROW_H;
    }
    return rows;
  }

  function measure() {
    const rect = container.getBoundingClientRect();
    let minX = SPINE_X - 8;
    let maxX = SPINE_X + 60;
    let minY = Infinity;
    let maxY = -Infinity;

    for (const node of nodes) {
      minX = Math.min(minX, node.left - 4);
      maxX = Math.max(maxX, node.left + node.width);
      minY = Math.min(minY, node.y - node.height / 2);
      maxY = Math.max(maxY, node.y + node.height / 2);
    }
    if (!nodes.length) {
      minY = 0;
      maxY = 1;
    }

    box = {
      x: (minX + maxX) / 2,
      y: (minY + maxY) / 2,
      w: Math.max(1, maxX - minX),
      h: Math.max(1, maxY - minY)
    };

    const padX = Math.max(24, rect.width * 0.05);
    const padTop = 76;
    const padBottom = 84;
    const availW = Math.max(80, rect.width - padX * 2);
    const availH = Math.max(80, rect.height - padTop - padBottom);

    fitScale = clamp(Math.min(availW / box.w, availH / box.h), 0.3, 1.15);
    fitOffsetY = padTop + availH / 2 - rect.height / 2;
    minScale = Math.min(0.5, fitScale * 0.72);
    maxScale = Math.max(2.2, fitScale * 2.2);
  }

  function apply() {
    if (frameQueued) return;
    frameQueued = true;
    requestAnimationFrame(() => {
      frameQueued = false;
      stage.style.transform = `translate3d(${tx.toFixed(2)}px, ${ty.toFixed(2)}px, 0) scale(${scale.toFixed(3)})`;
    });
  }

  /* 同步落位。首屏不能等动画帧：标签页在后台时 requestAnimationFrame 会被暂停，
     那一帧不来，图纸就会以未缩放的位置先露出来，点击也会落在错的地方。 */
  function applyNow() {
    frameQueued = false;
    stage.style.transform = `translate3d(${tx.toFixed(2)}px, ${ty.toFixed(2)}px, 0) scale(${scale.toFixed(3)})`;
  }

  function clampPan() {
    const rect = container.getBoundingClientRect();
    const limitX = (box.w * scale) / 2 + rect.width * 0.22;
    const limitY = (box.h * scale) / 2 + rect.height * 0.22;
    tx = clamp(tx, -limitX, limitX);
    ty = clamp(ty, -limitY, limitY);
  }

  function cancelTween() {
    if (tweenId) {
      cancelAnimationFrame(tweenId);
      tweenId = 0;
    }
  }

  function tweenTo(target, duration, done) {
    cancelTween();

    if (reducedMotion || !duration) {
      scale = target.s;
      tx = target.tx;
      ty = target.ty;
      apply();
      if (done) done();
      return;
    }

    const from = { s: scale, tx, ty };
    const start = performance.now();

    function step(now) {
      const p = Math.min(1, (now - start) / duration);
      const e = easeOutCubic(p);
      scale = from.s + (target.s - from.s) * e;
      tx = from.tx + (target.tx - from.tx) * e;
      ty = from.ty + (target.ty - from.ty) * e;
      apply();
      if (p < 1) {
        tweenId = requestAnimationFrame(step);
      } else {
        tweenId = 0;
        if (done) done();
      }
    }

    tweenId = requestAnimationFrame(step);
  }

  function fit(animate = false) {
    measure();
    const target = {
      s: fitScale,
      tx: -box.x * fitScale,
      ty: -box.y * fitScale + fitOffsetY
    };
    if (!animate) {
      cancelTween();
      scale = target.s;
      tx = target.tx;
      ty = target.ty;
      applyNow();
      return;
    }
    tweenTo(target, 560);
  }

  function zoomAt(factor, clientX, clientY) {
    const rect = container.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const next = clamp(scale * factor, minScale, maxScale);
    if (Math.abs(next - scale) < 0.0006) return;

    const worldX = (clientX - cx - tx) / scale;
    const worldY = (clientY - cy - ty) / scale;

    scale = next;
    tx = clientX - cx - worldX * scale;
    ty = clientY - cy - worldY * scale;
    clampPan();
    apply();
  }

  function pointDistance() {
    const pts = Array.from(pointers.values());
    return Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
  }

  function pointMid() {
    const pts = Array.from(pointers.values());
    return { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 };
  }

  function onPointerDown(e) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    cancelTween();
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.size === 1) {
      drag = { x: e.clientX, y: e.clientY, tx, ty, moved: false };
      suppressClick = false;
    } else if (pointers.size === 2) {
      pinch = { dist: pointDistance() };
      drag = null;
    }
  }

  function onPointerMove(e) {
    if (!pointers.has(e.pointerId)) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pinch && pointers.size >= 2) {
      const dist = pointDistance();
      if (pinch.dist > 0 && dist > 0) {
        const factor = clamp(dist / pinch.dist, 0.7, 1.45);
        const mid = pointMid();
        zoomAt(factor, mid.x, mid.y);
        pinch.dist = dist;
      }
      return;
    }

    if (drag && pointers.size === 1) {
      const dx = e.clientX - drag.x;
      const dy = e.clientY - drag.y;
      if (!drag.moved && Math.hypot(dx, dy) > 6) {
        drag.moved = true;
        suppressClick = true;
      }
      if (drag.moved) {
        tx = drag.tx + dx;
        ty = drag.ty + dy;
        clampPan();
        apply();
      }
    }
  }

  function onPointerUp(e) {
    pointers.delete(e.pointerId);
    if (pointers.size < 2) pinch = null;
    if (pointers.size === 0) {
      drag = null;
    } else if (pointers.size === 1) {
      const rest = Array.from(pointers.values())[0];
      drag = { x: rest.x, y: rest.y, tx, ty, moved: true };
    }
  }

  function onWheel(e) {
    e.preventDefault();
    cancelTween();
    const rect = container.getBoundingClientRect();
    const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? rect.height : 1;
    const factor = clamp(Math.exp(-e.deltaY * unit * 0.0014), 0.6, 1.7);
    zoomAt(factor, e.clientX, e.clientY);
  }

  function setActive(node) {
    stage.classList.add("is-focusing");
    nodes.forEach((n) => n.el.classList.toggle("is-active", n === node));
  }

  function clearActive() {
    stage.classList.remove("is-focusing");
    nodes.forEach((n) => n.el.classList.remove("is-active"));
  }

  function centerNode(node, duration = 320) {
    tweenTo({ s: scale, tx: -node.x * scale, ty: -node.y * scale }, duration);
  }

  function openNode(node) {
    node.el.classList.add("is-opening");
    // 跳转不挂在动画回调上：标签页切到后台时 requestAnimationFrame 会暂停，
    // 挂在它上面的跳转就永远不会发生。
    if (typeof onOpen === "function") onOpen(node.data);
  }

  function bindNode(node, el) {
    el.addEventListener("click", (e) => {
        if (suppressClick) {
        e.preventDefault();
        return;
      }
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      openNode(node);
    });

    el.addEventListener("pointerenter", () => setActive(node));
    el.addEventListener("pointerleave", () => {
      if (document.activeElement !== el) clearActive();
    });

    el.addEventListener("focus", () => {
      setActive(node);
      // 只有键盘 Tab 过来时才把节点移到画面中央。鼠标点击时立刻平移，节点会
      // 从光标下挪走，mouseup 落在别处，浏览器就不发 click，节点也就点不开。
      if (el.matches(":focus-visible")) centerNode(node, 320);
    });

    el.addEventListener("blur", clearActive);
  }

  function endIntro() {
    intro = false;
    stage.classList.remove("is-intro");
  }

  /* 把一行条目画成：方块 + 编号 + 标题 + 一行摘要。 */
  function buildNode(data, row, index) {
    const el = document.createElement("a");
    el.className = `node${row.child ? " is-child" : ""}`;
    el.href = data.href;

    el.style.left = `${row.left}px`;
    el.style.top = `${row.y}px`;
    el.style.setProperty("--stub-w", `${row.stubW}px`);
    el.setAttribute("aria-label", `${data.titleText} — ${data.taglineText}`.trim());

    const boxEl = document.createElement("span");
    boxEl.className = "node-box";
    boxEl.textContent = data.monogram || data.titleText.slice(0, 2);

    const textEl = document.createElement("span");
    textEl.className = "node-text";

    const numEl = document.createElement("span");
    numEl.className = "node-index";
    numEl.textContent = String(index).padStart(2, "0");

    const titleEl = document.createElement("span");
    titleEl.className = "node-title";
    titleEl.textContent = data.labelText || data.titleText;

    const tagEl = document.createElement("span");
    tagEl.className = "node-tag";
    tagEl.textContent = ellipsis(data.taglineText, 42);

    textEl.append(numEl, titleEl, tagEl);
    el.append(boxEl, textEl);
    return el;
  }

  function setNodes(list) {
    lastList = list;
    twoColumns = container.getBoundingClientRect().width >= TWO_COL_MIN;

    const rows = layout(list);
    stage.innerHTML = "";
    stage.style.setProperty("--box", `${BOX}px`);
    stage.style.setProperty("--stub-gap", `${STUB_GAP}px`);

    const colX = (col) => (twoColumns && col === 1 ? COL_GAP : 0);

    // 每栏一条主轴线
    for (const col of twoColumns ? [0, 1] : [0]) {
      const inCol = rows.filter((row) => row.col === col);
      if (!inCol.length) continue;
      const top = Math.min(...inCol.map((row) => row.y));
      const bottom = Math.max(...inCol.map((row) => row.y));
      const spine = document.createElement("div");
      spine.className = "map-spine";
      spine.style.left = `${colX(col)}px`;
      spine.style.top = `${top}px`;
      spine.style.height = `${bottom - top}px`;
      stage.appendChild(spine);
    }

    // 子级竖线：从父节点那一行拉到最后一个子节点
    const rails = [];
    for (const row of rows) {
      if (row.type !== "node" || !row.child) continue;
      const prev = rails[rails.length - 1];
      if (prev && prev.parentId === row.parent.data.id) {
        prev.bottom = row.y;
      } else {
        rails.push({ parentId: row.parent.data.id, top: row.parent.y, bottom: row.y, col: row.col });
      }
    }

    for (const rail of rails) {
      const el = document.createElement("div");
      el.className = "map-rail";
      el.style.left = `${colX(rail.col) + RAIL_X}px`;
      el.style.top = `${rail.top}px`;
      el.style.height = `${rail.bottom - rail.top}px`;
      stage.appendChild(el);
    }

    nodes = [];
    let index = 0;

    for (const row of rows) {
      if (row.type === "section") {
        const head = document.createElement("div");
        head.className = "map-section";
        head.style.left = `${colX(row.col)}px`;
        head.style.top = `${row.y}px`;
        const dot = document.createElement("span");
        dot.className = "map-dot";
        dot.setAttribute("aria-hidden", "true");
        const label = document.createElement("span");
        label.className = "map-section-label";
        label.dataset.key = row.key;
        label.textContent = labels[row.key] || row.key;
        head.append(dot, label);
        stage.appendChild(head);
        continue;
      }

      const el = buildNode(row.data, row, ++index);
      el.style.left = `${colX(row.col) + row.left}px`;
      stage.appendChild(el);
      const node = {
        data: row.data,
        el,
        x: 0,
        y: row.y,
        left: parseFloat(el.style.left),
        width: 0,
        height: 0
      };
      nodes.push(node);
      bindNode(node, el);
    }

    // 量出实际宽度，fit 才知道整张图纸有多宽
    for (const node of nodes) {
      node.width = node.el.offsetWidth;
      node.height = node.el.offsetHeight;
      node.x = node.left + BOX / 2;
    }

    if (!built) {
      built = true;
      fit(false);
    } else {
      apply();
    }

    if (intro) {
      nodes.forEach((node, i) => {
        node.el.style.setProperty("--d", `${i * 34}ms`);
      });
      stage.classList.add("is-intro");
      clearTimeout(introTimer);
      introTimer = setTimeout(endIntro, 900);
    }
  }

  container.addEventListener("pointerdown", onPointerDown, { passive: true });
  window.addEventListener("pointermove", onPointerMove, { passive: true });
  window.addEventListener("pointerup", onPointerUp, { passive: true });
  window.addEventListener("pointercancel", onPointerUp, { passive: true });
  container.addEventListener("wheel", onWheel, { passive: false });

  container.addEventListener("dblclick", (e) => {
    if (e.target.closest(".node")) return;
    fit(true);
  });

  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (!built) return;
      // 窄屏改成一栏时重新排一次
      const wantTwo = container.getBoundingClientRect().width >= TWO_COL_MIN;
      if (wantTwo !== twoColumns) {
        setNodes(lastList);
        return;
      }
      fit(false);
    }, 160);
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !e.defaultPrevented) fit(true);
  });

  return {
    setNodes,
    /* 语言换了，分区标题要跟着换：改掉闭包里的 labels 再重画标题，节点位置不动 */
    setLabels(next) {
      labels = next;
      stage.querySelectorAll(".map-section-label").forEach((el) => {
        el.textContent = labels[el.dataset.key] || el.dataset.key;
      });
    },
    fit,
    reset: () => fit(true),
    zoom: zoomAt
  };
}
