/* ---------- Main Entry ---------- */
document.addEventListener("DOMContentLoaded", function() {
  /* 0. 初始化加载动画 */
  if (window.SoulLoader) {
    SoulLoader.init();
  }

  /* 1. 初始化星星动画 */
  if (window.SoulStars) {
    SoulStars.initStars();
  }

  /* 2. 初始化滚动渐入 */
  if (window.SoulScroll) {
    SoulScroll.initReveal();
  }

  /* 3. 恢复语言设置 */
  if (window.SoulI18n) {
    var saved = localStorage.getItem("soul-lang");
    if (saved && (saved === "en" || saved === "zh")) {
      SoulI18n.applyLang(saved);
    }
  }

  /* 4. 初始化阅读进度条 */
  if (window.SoulProgress) {
    SoulProgress.init();
  }

  /* 5. 初始化音频播放器(使用默认配置) */
  if (window.SoulAudio) {
    SoulAudio.init({
      src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
      title: 'Gentle Thoughts',
      artist: 'Soul for U',
      autoplay: false,
      loop: true,
      volume: 0.7
    });
  }

  /* 8. 绑定语言切换按钮 */
  var langSwitch = document.getElementById("langSwitch");
  if (langSwitch && window.SoulI18n) {
    langSwitch.addEventListener("click", SoulI18n.toggleLang);
    langSwitch.addEventListener("keydown", function(e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        SoulI18n.toggleLang();
      }
    });
  }

  /* 7. Dock 悬停逻辑:进入立即滑入,离开延迟收回 */
  var dock = document.getElementById("dock");
  if (dock) {
    dock.addEventListener("mouseenter", function() {
      dock.classList.remove("leaving");
    });
    dock.addEventListener("mouseleave", function() {
      dock.classList.add("leaving");
      setTimeout(function() {
        if (!dock.matches(":hover")) {
          dock.classList.remove("leaving");
        }
      }, 600);
    });
  }
});
