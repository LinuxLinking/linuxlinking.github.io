/* ---------- Reading Progress Bar ---------- */
var SoulProgress = (function() {
  var progressBar = null;
  var ticking = false;

  function init() {
    progressBar = document.getElementById('progressBar');
    if (!progressBar) return;

    /* 监听滚动事件 */
    window.addEventListener('scroll', onScroll, { passive: true });
    
    /* 初始化进度 */
    updateProgress();
  }

  function onScroll() {
    if (!ticking) {
      requestAnimationFrame(function() {
        updateProgress();
        ticking = false;
      });
      ticking = true;
    }
  }

  function updateProgress() {
    if (!progressBar) return;

    var scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    var docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    var progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;

    /* 限制在 0-100 范围内 */
    progress = Math.min(100, Math.max(0, progress));

    progressBar.style.width = progress + '%';
  }

  function destroy() {
    if (progressBar) {
      window.removeEventListener('scroll', onScroll);
    }
  }

  return {
    init: init,
    destroy: destroy
  };
})();

/* 暴露全局接口 */
window.SoulProgress = SoulProgress;
