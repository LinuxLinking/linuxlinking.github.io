/* ---------- Audio Player ---------- */
var SoulAudio = (function() {
  var audio = null;
  var player = null;
  var playBtn = null;
  var volumeBar = null;
  var seekBar = null;
  var seekEl = null;
  var timeCurrent = null;
  var timeTotal = null;
  var isPlaying = false;
  var isExpanded = false;
  var currentVolume = 0.7;

  /* 默认音频配置 */
  var config = {
    src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', /* 示例音乐，可替换 */
    title: 'Gentle Thoughts',
    artist: 'Soul for U',
    autoplay: false,
    loop: true,
    volume: 0.7
  };

  function init(customConfig) {
    /* 合并自定义配置 */
    if (customConfig) {
      Object.assign(config, customConfig);
    }

    player = document.getElementById('audio-player');
    if (!player) return;

    /* 获取元素 */
    audio = player.querySelector('audio');
    playBtn = player.querySelector('.audio-btn');
    volumeBar = player.querySelector('.audio-volume-bar');
    seekBar = player.querySelector('.audio-seek-bar');
    seekEl = player.querySelector('.audio-seek');
    timeCurrent = player.querySelector('.time-current');
    timeTotal = player.querySelector('.time-total');

    if (!audio) return;

    /* 设置音频属性 */
    audio.src = config.src;
    audio.loop = config.loop;
    audio.volume = config.volume;
    currentVolume = config.volume;

    /* 同步音量条显示 */
    if (volumeBar) {
      volumeBar.style.width = (config.volume * 100) + '%';
    }

    /* 绑定事件 */
    bindEvents();

    /* 更新显示信息 */
    updateInfo();

    /* 尝试自动播放（可能会被浏览器阻止） */
    if (config.autoplay) {
      tryAutoplay();
    }
  }

  function bindEvents() {
    if (playBtn) {
      playBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        togglePlay();
      });
    }

    /* 点击播放器其他区域:展开/收起 */
    player.addEventListener('click', function(e) {
      if (player.contains(e.target) && !e.target.closest('.audio-btn') && !e.target.closest('.audio-seek')) {
        toggleExpand();
      }
    });

    if (volumeBar) {
      volumeBar.parentElement.addEventListener('click', setVolume);
    }

    if (seekEl) {
      seekEl.addEventListener('click', seekTo);
    }

    if (audio) {
      audio.addEventListener('play', function() {
        isPlaying = true;
        player.classList.add('playing');
        updatePlayButton();
      });

      audio.addEventListener('pause', function() {
        isPlaying = false;
        player.classList.remove('playing');
        updatePlayButton();
      });

      audio.addEventListener('ended', function() {
        if (!config.loop) {
          isPlaying = false;
          player.classList.remove('playing');
          updatePlayButton();
        }
      });

      /* 进度与时间更新 */
      audio.addEventListener('loadedmetadata', updateTimeTotal);
      audio.addEventListener('timeupdate', updateProgress);
    }
  }

  /* ---------- 展开/收起 ---------- */
  function toggleExpand() {
    if (!player) return;
    isExpanded = !isExpanded;
    if (isExpanded) {
      player.classList.add('expanded');
      updateTimeTotal();
      updateProgress();
    } else {
      player.classList.remove('expanded');
    }
  }

  function formatTime(sec) {
    if (!isFinite(sec) || sec < 0) sec = 0;
    var m = Math.floor(sec / 60);
    var s = Math.floor(sec % 60);
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  function updateTimeTotal() {
    if (timeTotal && audio && isFinite(audio.duration)) {
      timeTotal.textContent = formatTime(audio.duration);
    }
  }

  function updateProgress() {
    if (!audio) return;
    var pct = (audio.currentTime / audio.duration) * 100;
    if (isFinite(pct) && seekBar) {
      seekBar.style.width = pct + '%';
    }
    if (timeCurrent) {
      timeCurrent.textContent = formatTime(audio.currentTime);
    }
  }

  function seekTo(e) {
    if (!audio || !isFinite(audio.duration)) return;
    var rect = e.currentTarget.getBoundingClientRect();
    var percentage = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    audio.currentTime = percentage * audio.duration;
    updateProgress();
  }

  function togglePlay() {
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(function(error) {
        console.log('Audio play failed:', error);
      });
    }
  }

  function setVolume(e) {
    if (!audio) return;

    var rect = e.currentTarget.getBoundingClientRect();
    var x = e.clientX - rect.left;
    var percentage = x / rect.width;
    
    percentage = Math.min(1, Math.max(0, percentage));
    audio.volume = percentage;
    currentVolume = percentage;

    if (volumeBar) {
      volumeBar.style.width = (percentage * 100) + '%';
    }
  }

  function updatePlayButton() {
    if (!playBtn) return;

    var playIcon = playBtn.querySelector('.play-icon');
    var pauseIcon = playBtn.querySelector('.pause-icon');

    if (playIcon && pauseIcon) {
      if (isPlaying) {
        playIcon.style.display = 'none';
        pauseIcon.style.display = 'block';
      } else {
        playIcon.style.display = 'block';
        pauseIcon.style.display = 'none';
      }
    }
  }

  function updateInfo() {
    var titleEl = player.querySelector('.audio-title');
    var artistEl = player.querySelector('.audio-artist');

    if (titleEl) titleEl.textContent = config.title;
    if (artistEl) artistEl.textContent = config.artist;
  }

  function tryAutoplay() {
    /* 现代浏览器通常会阻止自动播放，需要用户交互 */
    audio.play().then(function() {
      isPlaying = true;
      player.classList.add('playing');
      updatePlayButton();
    }).catch(function() {
      console.log('Autoplay prevented by browser. User interaction required.');
    });
  }

  function play() {
    if (audio) {
      audio.play().catch(function(error) {
        console.log('Audio play failed:', error);
      });
    }
  }

  function pause() {
    if (audio) {
      audio.pause();
    }
  }

  function setVolumeLevel(level) {
    if (audio) {
      level = Math.min(1, Math.max(0, level));
      audio.volume = level;
      currentVolume = level;
      if (volumeBar) {
        volumeBar.style.width = (level * 100) + '%';
      }
    }
  }

  function destroy() {
    if (audio) {
      audio.pause();
      audio.src = '';
    }
    if (player) {
      player.classList.remove('playing');
    }
    isPlaying = false;
  }

  return {
    init: init,
    play: play,
    pause: pause,
    togglePlay: togglePlay,
    setVolume: setVolumeLevel,
    destroy: destroy
  };
})();

/* 暴露全局接口 */
window.SoulAudio = SoulAudio;
