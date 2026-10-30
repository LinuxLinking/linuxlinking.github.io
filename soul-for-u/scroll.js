/* ---------- Reveal on scroll ---------- */
function initReveal() {
  var io = new IntersectionObserver(function(entries) {
    entries.forEach(function(e) {
      if (e.isIntersecting) {
        e.target.classList.add("visible");
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });

  document.querySelectorAll(".reveal").forEach(function(el) {
    io.observe(el);
  });
}

/* 暴露全局接口 */
window.SoulScroll = { initReveal: initReveal };
