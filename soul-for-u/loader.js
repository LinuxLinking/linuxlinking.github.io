/* ---------- Page Loader ---------- */
var SoulLoader = (function() {
  var loader = null;
  var progressBar = null;
  var progress = 0;
  var targetProgress = 0;
  var animationFrame = null;

  function init() {
    loader = document.getElementById('loader-screen');
    progressBar = document.querySelector('.loader-progress-bar');
    
    if (!loader || !progressBar) return;

    /* 创建装饰性星星 */
    createLoaderStars();

    /* 模拟加载进度 */
    simulateLoading();
  }

  function createLoaderStars() {
    var starsContainer = loader.querySelector('.loader-stars');
    if (!starsContainer) return;

    var fragment = document.createDocumentFragment();
    for (var i = 0; i < 30; i++) {
      var star = document.createElement('span');
      star.className = 'loader-star';
      star.style.left = Math.random() * 100 + '%';
      star.style.top = Math.random() * 100 + '%';
      star.style.animationDelay = (Math.random() * 2) + 's';
      star.style.animationDuration = (Math.random() * 2 + 1.5) + 's';
      fragment.appendChild(star);
    }
    starsContainer.appendChild(fragment);
  }

  function simulateLoading() {
    /* 模拟资源加载进度 */
    var steps = [
      { progress: 20, delay: 100 },
      { progress: 40, delay: 200 },
      { progress: 60, delay: 300 },
      { progress: 80, delay: 400 },
      { progress: 100, delay: 500 }
    ];

    var currentStep = 0;

    function nextStep() {
      if (currentStep < steps.length) {
        setProgress(steps[currentStep].progress);
        currentStep++;
        setTimeout(nextStep, steps[currentStep - 1].delay);
      }
    }

    nextStep();
  }

  function setProgress(value) {
    targetProgress = value;
    if (!animationFrame) {
      animateProgress();
    }
  }

  function animateProgress() {
    if (progress < targetProgress) {
      progress += (targetProgress - progress) * 0.1;
      if (progress > targetProgress - 0.5) {
        progress = targetProgress;
      }
      progressBar.style.width = progress + '%';
      
      if (progress < targetProgress) {
        animationFrame = requestAnimationFrame(animateProgress);
      } else {
        animationFrame = null;
        if (progress >= 100) {
          hideLoader();
        }
      }
    }
  }

  function hideLoader() {
    /* 等待一小段时间确保动画完成 */
    setTimeout(function() {
      if (loader) {
        loader.classList.add('hidden');
        /* 移除加载屏幕 */
        setTimeout(function() {
          if (loader.parentNode) {
            loader.parentNode.removeChild(loader);
          }
        }, 600);
      }
    }, 300);
  }

  function forceHide() {
    if (loader) {
      setProgress(100);
    }
  }

  return {
    init: init,
    forceHide: forceHide
  };
})();

/* 暴露全局接口 */
window.SoulLoader = SoulLoader;
