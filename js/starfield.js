export function startStarfield(canvas) {
  if (!canvas || !canvas.getContext) return;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  let width = 0;
  let height = 0;
  let stars = [];
  let meteors = [];
  let rafId = 0;
  let nextMeteorAt = 0;
  let resizeRaf = 0;

  function build() {
    const cores = navigator.hardwareConcurrency || 4;
    let count = Math.round((width * height) / 11000);
    if (cores <= 4) count = Math.round(count * 0.72);
    if (width < 760) count = Math.round(count * 0.62);
    count = Math.max(64, Math.min(240, count));

    stars = Array.from({ length: count }, () => {
      const depth = 0.25 + Math.random() * 0.75;
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        r: 0.45 + depth * 1.45,
        a: 0.22 + Math.random() * 0.58,
        depth,
        phase: Math.random() * Math.PI * 2,
        speed: 0.4 + Math.random() * 1.1,
        warm: Math.random() < 0.16
      };
    });
  }

  function resize() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    build();
    if (reduced) draw(performance.now());
  }

  function spawnMeteor() {
    const fromLeft = Math.random() < 0.5;
    const x = fromLeft ? Math.random() * width * 0.6 : width * (0.4 + Math.random() * 0.6);
    const y = Math.random() * height * 0.42;
    const speed = 340 + Math.random() * 320;
    const angle = Math.PI / 4 + (Math.random() - 0.5) * 0.28;
    meteors.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1,
      len: 90 + Math.random() * 90
    });
  }

  function draw(time) {
    ctx.clearRect(0, 0, width, height);

    const px = pointer.x;
    const py = pointer.y;

    for (const star of stars) {
      const sx = star.x + px * 16 * star.depth;
      const sy = star.y + py * 16 * star.depth;
      const twinkle = reduced
        ? star.a
        : star.a *
          (0.66 + 0.34 * Math.sin(time * 0.001 * star.speed + star.phase));
      const color = star.warm ? "255, 226, 186" : "188, 214, 255";
      ctx.fillStyle = `rgba(${color}, ${Math.max(0.04, twinkle)})`;
      ctx.beginPath();
      ctx.arc(sx, sy, star.r, 0, Math.PI * 2);
      ctx.fill();
    }

    if (reduced) return;

    for (const m of meteors) {
      const tailX = m.x - m.vx * 0.09 * (m.len / 90);
      const tailY = m.y - m.vy * 0.09 * (m.len / 90);
      const grad = ctx.createLinearGradient(m.x, m.y, tailX, tailY);
      grad.addColorStop(0, `rgba(206, 226, 255, ${0.85 * m.life})`);
      grad.addColorStop(1, "rgba(206, 226, 255, 0)");
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(m.x, m.y);
      ctx.lineTo(tailX, tailY);
      ctx.stroke();
    }
  }

  function frame(time) {
    pointer.x += (pointer.tx - pointer.x) * 0.06;
    pointer.y += (pointer.ty - pointer.y) * 0.06;

    for (const m of meteors) {
      m.x += m.vx / 60;
      m.y += m.vy / 60;
      m.life -= 0.012;
    }
    meteors = meteors.filter((m) => m.life > 0);

    if (time > nextMeteorAt) {
      if (Math.random() < 0.75) spawnMeteor();
      nextMeteorAt = time + 5200 + Math.random() * 9000;
    }

    draw(time);
    rafId = requestAnimationFrame(frame);
  }

  function start() {
    if (reduced || rafId) return;
    nextMeteorAt = performance.now() + 3200;
    rafId = requestAnimationFrame(frame);
  }

  function stop() {
    if (!rafId) return;
    cancelAnimationFrame(rafId);
    rafId = 0;
  }

  window.addEventListener("pointermove", (e) => {
    pointer.tx = (e.clientX / Math.max(1, width) - 0.5) * 2;
    pointer.ty = (e.clientY / Math.max(1, height) - 0.5) * 2;
  });

  window.addEventListener("resize", () => {
    cancelAnimationFrame(resizeRaf);
    resizeRaf = requestAnimationFrame(resize);
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop();
    else start();
  });

  resize();
  start();
}
