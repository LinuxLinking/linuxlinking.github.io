/* ---------- Configuration Editor ---------- */
var SoulConfigEditor = (function() {
  var editor = null;
  var toggleBtn = null;
  var isOpen = false;
  var animating = false;

  /* i18n 辅助:优先取 SoulI18n 字典,回退英文 */
  function t(key) {
    if (window.SoulI18n && SoulI18n.i18n[SoulI18n.currentLang] && SoulI18n.i18n[SoulI18n.currentLang][key] !== undefined) {
      return SoulI18n.i18n[SoulI18n.currentLang][key];
    }
    return key;
  }

  function init() {
    /* 将齿轮按钮挂载到底部 dock-bar 内(播放器旁边) */
    createToggleButton();
  }

  function createToggleButton() {
    toggleBtn = document.createElement('button');
    toggleBtn.className = 'config-toggle-btn';
    toggleBtn.innerHTML = '⚙️';
    toggleBtn.title = t('cfg_title');
    toggleBtn.setAttribute('aria-label', t('cfg_open'));

    toggleBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      if (isOpen) {
        close();
      } else {
        open();
      }
    });

    /* 挂载到 dock-bar;若 dock 不存在则回退到 body(固定定位样式兜底) */
    var dockBar = document.querySelector('.dock-bar');
    if (dockBar) {
      dockBar.appendChild(toggleBtn);
    } else {
      document.body.appendChild(toggleBtn);
    }
  }

  /* FLIP:计算齿轮中心,让面板"从哪里来" */
  function getGearTransform(panel) {
    if (!toggleBtn) return 'scale(.6)';
    var rect = toggleBtn.getBoundingClientRect();
    var pRect = panel.getBoundingClientRect();
    var gearCX = rect.left + rect.width / 2;
    var gearCY = rect.top + rect.height / 2;
    var panelCX = pRect.left + pRect.width / 2;
    var panelCY = pRect.top + pRect.height / 2;
    var dx = gearCX - panelCX;
    var dy = gearCY - panelCY;
    var scale = Math.max(0.05, Math.min(rect.width / pRect.width, rect.height / pRect.height));
    return 'translate(' + dx + 'px, ' + dy + 'px) scale(' + scale + ')';
  }

  function open() {
    if (isOpen || animating) return;
    isOpen = true;
    animating = true;

    editor = createEditorPanel();
    document.body.appendChild(editor);

    loadCurrentConfig();

    /* F+I:先摆到齿轮位置(无过渡),下一帧加 visible 过渡到位(L) */
    var panel = editor.querySelector('.config-editor-panel');
    panel.style.transition = 'none';
    panel.style.transform = getGearTransform(panel);
    panel.style.opacity = '0';

    requestAnimationFrame(function() {
      requestAnimationFrame(function() {
        panel.style.transition = '';
        panel.style.transform = '';
        panel.style.opacity = '';
        editor.classList.add('visible');
      });
    });

    /* 面板展开动画约 .55s */
    setTimeout(function() { animating = false; }, 580);

    toggleBtn.classList.add('active');

    /* Esc 关闭 */
    document.addEventListener('keydown', onKeydown);

    /* 打开面板时保持 dock 可见 */
    keepDockVisible(true);
  }

  function onKeydown(e) {
    if (e.key === 'Escape') close();
  }

  function close() {
    if (!isOpen || !editor || animating) return;
    isOpen = false;
    animating = true;

    toggleBtn.classList.remove('active');

    /* 收起:面板飞回齿轮位置,"到哪里去" */
    var panel = editor.querySelector('.config-editor-panel');
    editor.classList.remove('visible');
    editor.classList.add('closing');
    panel.style.transform = getGearTransform(panel);
    panel.style.opacity = '0';

    setTimeout(function() {
      if (editor && editor.parentNode) {
        editor.parentNode.removeChild(editor);
      }
      editor = null;
      animating = false;
      document.removeEventListener('keydown', onKeydown);
      keepDockVisible(false);
    }, 480);
  }

  function keepDockVisible(show) {
    /* 编辑器打开期间禁止 dock 自动收回 */
    var dock = document.getElementById('dock');
    if (!dock) return;
    if (show) {
      dock.querySelector('.dock-bar').classList.add('peek');
      dock.classList.remove('leaving');
    }
    /* 关闭时由 removePeek 恢复 */
    else if (!editor) {
      scheduleDockHide();
    }
  }

  function scheduleDockHide() {
    var dock = document.getElementById('dock');
    if (!dock) return;
    dock.classList.add('leaving'); /* CSS 中延迟 .45s 收回 */
    setTimeout(function() {
      var bar = dock.querySelector('.dock-bar');
      if (bar && !dock.matches(':hover')) {
        bar.classList.remove('peek');
      }
      dock.classList.remove('leaving');
    }, 500);
  }

  function createEditorPanel() {
    var overlay = document.createElement('div');
    overlay.className = 'config-editor';
    overlay.innerHTML =
      '<div class="config-editor-panel">' +
        '<div class="config-editor-header">' +
          '<h2>' + t('cfg_title') + '</h2>' +
          '<button class="config-close-btn" aria-label="Close editor">&times;</button>' +
        '</div>' +
        '<div class="config-editor-body">' +
          '<div class="config-section">' +
            '<h3>' + t('cfg_hero') + '</h3>' +
            '<div class="config-field">' +
              '<label>' + t('cfg_title_label') + '</label>' +
              '<input type="text" id="config-hero-title" placeholder="SOUL for U">' +
            '</div>' +
            '<div class="config-field">' +
              '<label>' + t('cfg_sub_en') + '</label>' +
              '<textarea id="config-hero-subtitle-en" rows="3"></textarea>' +
            '</div>' +
            '<div class="config-field">' +
              '<label>' + t('cfg_sub_zh') + '</label>' +
              '<textarea id="config-hero-subtitle-zh" rows="3"></textarea>' +
            '</div>' +
          '</div>' +
          '<div class="config-section">' +
            '<h3>' + t('cfg_audio') + '</h3>' +
            '<div class="config-field">' +
              '<label><input type="checkbox" id="config-audio-enabled" checked> ' + t('cfg_audio_enable') + '</label>' +
            '</div>' +
            '<div class="config-field">' +
              '<label>' + t('cfg_audio_url') + '</label>' +
              '<input type="url" id="config-audio-src" placeholder="https://example.com/music.mp3">' +
            '</div>' +
          '</div>' +
          '<div class="config-section">' +
            '<h3>' + t('cfg_actions') + '</h3>' +
            '<div class="config-actions">' +
              '<button id="config-save-btn" class="config-btn primary">' + t('cfg_save') + '</button>' +
              '<button id="config-reset-btn" class="config-btn secondary">' + t('cfg_reset') + '</button>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';

    /* 绑定事件 */
    overlay.querySelector('.config-close-btn').addEventListener('click', function(e) {
      e.stopPropagation();
      close();
    });
    overlay.querySelector('#config-save-btn').addEventListener('click', saveConfig);
    overlay.querySelector('#config-reset-btn').addEventListener('click', resetConfig);

    /* 点击遮罩关闭(点面板本身不关) */
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) {
        close();
      }
    });

    return overlay;
  }

  function loadCurrentConfig() {
    if (!window.SoulConfig) return;

    var config = SoulConfig.getAll();
    if (!config) return;

    /* 加载 Hero 配置 */
    var titleInput = document.getElementById('config-hero-title');
    var subtitleEnInput = document.getElementById('config-hero-subtitle-en');
    var subtitleZhInput = document.getElementById('config-hero-subtitle-zh');

    if (titleInput) titleInput.value = config.hero ? config.hero.title || '' : '';
    if (subtitleEnInput) subtitleEnInput.value = config.hero && config.hero.subtitle ? config.hero.subtitle.en || '' : '';
    if (subtitleZhInput) subtitleZhInput.value = config.hero && config.hero.subtitle ? config.hero.subtitle.zh || '' : '';

    /* 加载音频配置 */
    var audioEnabledInput = document.getElementById('config-audio-enabled');
    var audioSrcInput = document.getElementById('config-audio-src');

    if (audioEnabledInput) audioEnabledInput.checked = config.audio ? config.audio.enabled !== false : true;
    if (audioSrcInput) audioSrcInput.value = config.audio ? config.audio.src || '' : '';
  }

  function saveConfig() {
    if (!window.SoulConfig) return;

    /* 保存 Hero 配置 */
    var title = document.getElementById('config-hero-title').value;
    var subtitleEn = document.getElementById('config-hero-subtitle-en').value;
    var subtitleZh = document.getElementById('config-hero-subtitle-zh').value;

    SoulConfig.update('hero.title', title);
    SoulConfig.update('hero.subtitle.en', subtitleEn);
    SoulConfig.update('hero.subtitle.zh', subtitleZh);

    /* 保存音频配置 */
    var audioEnabled = document.getElementById('config-audio-enabled').checked;
    var audioSrc = document.getElementById('config-audio-src').value;

    SoulConfig.update('audio.enabled', audioEnabled);
    SoulConfig.update('audio.src', audioSrc);

    /* 保存到本地存储 */
    if (SoulConfig.save()) {
      showNotification(t('cfg_saved'));

      /* 应用更改 */
      applyConfigChanges();
    } else {
      showNotification(t('cfg_save_failed'), 'error');
    }
  }

  function resetConfig() {
    if (confirm(t('cfg_reset_confirm'))) {
      SoulConfig.reset().then(function() {
        loadCurrentConfig();
        showNotification(t('cfg_reset_done'));
      });
    }
  }

  function applyConfigChanges() {
    var config = SoulConfig.getAll();
    if (!config) return;

    /* 应用 Hero 更改 */
    var lang = window.SoulI18n ? SoulI18n.currentLang : 'en';

    var heroTitle = document.querySelector('.hero h1.title');
    if (heroTitle && config.hero && config.hero.title) {
      heroTitle.innerHTML = config.hero.title.replace('for U', '<em>for U</em>');
    }

    var heroSubtitle = document.querySelector('.hero .subtitle');
    if (heroSubtitle && config.hero && config.hero.subtitle) {
      heroSubtitle.textContent = config.hero.subtitle[lang] || config.hero.subtitle.en;
    }

    /* 应用音频更改 */
    if (window.SoulAudio) {
      if (config.audio && config.audio.enabled) {
        SoulAudio.init({
          src: config.audio.src,
          title: config.audio.title[lang] || config.audio.title.en,
          artist: config.audio.artist,
          autoplay: config.audio.autoplay,
          loop: config.audio.loop,
          volume: config.audio.volume
        });
      } else {
        SoulAudio.pause();
      }
    }
  }

  function showNotification(message, type) {
    var notification = document.createElement('div');
    notification.className = 'config-notification ' + (type || 'success');
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(function() {
      notification.classList.add('show');
    }, 10);

    setTimeout(function() {
      notification.classList.remove('show');
      setTimeout(function() {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }

  return {
    init: init,
    open: open,
    close: close
  };
})();

/* 暴露全局接口 */
window.SoulConfigEditor = SoulConfigEditor;
