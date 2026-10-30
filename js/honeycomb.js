const BASE_RADIUS = 90;
const RING_RADIUS = 214;
const LABEL_THRESHOLD = 0.85;

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
const easeOutCubic = (p) => 1 - Math.pow(1 - p, 3);

export function createHoneycomb({ container, stage, reducedMotion = false, onOpen }) {
  let nodes = [];
  let scale = 1;
  let tx = 0;
  let ty = 0;
  let fitScale = 1;
  let fitOffsetY = 0;
  let minScale = 0.4;
  let maxScale = 2.4;
  let box = { x: 0, y: 0, w: 1, h: 1 };
  let built = false;

  let tweenId = 0;
  let frameQueued = false;
  let resizeTimer = 0;

  const pointers = new Map();
  let drag = null;
  let pinch = null;
  let suppressClick = false;
  let lastPointerAt = 0;

  function layout(list) {
    const laid = list.map((data) => ({
      data,
      x: 0,
      y: 0,
      r: BASE_RADIUS * (data.size || 0.8)
    }));

    const ring = laid.slice(1);
    if (ring.length) {
      const step = 360 / ring.length;
      ring.forEach((node, i) => {
        const jitterDeg = (((i * 97) % 11) - 5) * 0.55;
        const angle = ((-90 + i * step + jitterDeg) * Math.PI) / 180;
        const radius = RING_RADIUS + (((i * 61) % 9) - 4) * 1.4;
        node.x = Math.cos(angle) * radius;
        node.y = Math.sin(angle) * radius;
      });
    }

    return laid;
  }

  function measure() {
    const rect = container.getBoundingClientRect();
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    nodes.forEach((node) => {
      minX = Math.min(minX, node.x - node.r);
      maxX = Math.max(maxX, node.x + node.r);
      minY = Math.min(minY, node.y - node.r);
      maxY = Math.max(maxY, node.y + node.r + 30);
    });

    box = {
      x: (minX + maxX) / 2,
      y: (minY + maxY) / 2,
      w: Math.max(1, maxX - minX),
      h: Math.max(1, maxY - minY)
    };

    const padX = Math.max(26, rect.width * 0.05);
    const padTop = 84;
    const padBottom = 88;
    const availW = Math.max(80, rect.width - padX * 2);
    const availH = Math.max(80, rect.height - padTop - padBottom);

    fitScale = clamp(Math.min(availW / box.w, availH / box.h), 0.3, 1.2);
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
      stage.classList.toggle("show-labels", scale >= LABEL_THRESHOLD);
    });
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
    tweenTo(
      {
        s: fitScale,
        tx: -box.x * fitScale,
        ty: -box.y * fitScale + fitOffsetY
      },
      animate ? 520 : 0
    );
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
    lastPointerAt = performance.now();
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
    const targetScale = Math.max(scale, 1.15);
    node.el.classList.add("is-opening");
    tweenTo(
      { s: targetScale, tx: -node.x * targetScale, ty: -node.y * targetScale },
      440,
      () => {
        if (typeof onOpen === "function") onOpen(node.data);
      }
    );
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
      if (performance.now() - lastPointerAt > 500) centerNode(node, 320);
    });

    el.addEventListener("blur", clearActive);
  }

  function setNodes(list) {
    nodes = layout(list);
    stage.innerHTML = "";

    nodes.forEach((node) => {
      const data = node.data;
      const el = document.createElement("a");
      el.className = `node${data.kind === "moon" ? " is-moon" : ""}`;
      el.href = data.href;
      el.style.left = `${node.x.toFixed(2)}px`;
      el.style.top = `${node.y.toFixed(2)}px`;
      el.style.setProperty("--r", `${node.r.toFixed(2)}px`);
      el.style.setProperty("--c1", (data.accent && data.accent[0]) || "#7c5cff");
      el.style.setProperty("--c2", (data.accent && data.accent[1]) || "#3ad0ff");
      el.setAttribute("aria-label", `${data.titleText} — ${data.taglineText}`.trim());

      const orb = document.createElement("span");
      orb.className = "orb";
      const glyph = document.createElement("span");
      glyph.textContent = data.monogram || data.titleText.slice(0, 2);
      orb.appendChild(glyph);

      const label = document.createElement("span");
      label.className = "node-label";
      label.textContent = data.labelText || data.titleText;

      el.append(orb, label);
      node.el = el;
      bindNode(node, el);
      stage.appendChild(el);
    });

    if (!built) {
      built = true;
      fit(false);
    } else {
      apply();
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
      if (built) fit(false);
    }, 160);
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !e.defaultPrevented) fit(true);
  });

  return {
    setNodes,
    fit,
    reset: () => fit(true),
    zoom: zoomAt
  };
}
