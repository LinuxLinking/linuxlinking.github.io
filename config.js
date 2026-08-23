/* ---------- Configuration Loader ---------- */
var SoulConfig = (function() {
  var config = null;
  var configUrl = 'config.json';

  function load() {
    return fetch(configUrl)
      .then(function(response) {
        if (!response.ok) {
          throw new Error('Failed to load config: ' + response.status);
        }
        return response.json();
      })
      .then(function(data) {
        config = data;
        return config;
      })
      .catch(function(error) {
        console.warn('Using default configuration:', error.message);
        config = getDefaultConfig();
        return config;
      });
  }

  function getDefaultConfig() {
    return {
      site: {
        title: 'Soul for U',
        description: 'A soulful page written just for you',
        author: 'Anonymous',
        url: ''
      },
      audio: {
        enabled: true,
        src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
        title: { en: 'Gentle Thoughts', zh: '温柔的思绪' },
        artist: 'Soul for U',
        autoplay: false,
        loop: true,
        volume: 0.7
      }
    };
  }

  function get(key, defaultValue) {
    if (!config) return defaultValue;
    
    var keys = key.split('.');
    var value = config;
    
    for (var i = 0; i < keys.length; i++) {
      if (value && typeof value === 'object' && keys[i] in value) {
        value = value[keys[i]];
      } else {
        return defaultValue;
      }
    }
    
    return value;
  }

  function getLocalized(key, lang, defaultValue) {
    var value = get(key, null);
    if (!value) return defaultValue;
    
    if (typeof value === 'object' && lang in value) {
      return value[lang];
    }
    
    return defaultValue;
  }

  function getAll() {
    return config;
  }

  function update(key, value) {
    if (!config) return false;
    
    var keys = key.split('.');
    var current = config;
    
    for (var i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }
    
    current[keys[keys.length - 1]] = value;
    return true;
  }

  function save() {
    if (!config) return false;
    
    try {
      localStorage.setItem('soul-config', JSON.stringify(config));
      return true;
    } catch (error) {
      console.error('Failed to save config:', error);
      return false;
    }
  }

  function loadFromStorage() {
    try {
      var saved = localStorage.getItem('soul-config');
      if (saved) {
        config = JSON.parse(saved);
        return true;
      }
    } catch (error) {
      console.error('Failed to load config from storage:', error);
    }
    return false;
  }

  function reset() {
    localStorage.removeItem('soul-config');
    config = null;
    return load();
  }

  return {
    load: load,
    get: get,
    getLocalized: getLocalized,
    getAll: getAll,
    update: update,
    save: save,
    loadFromStorage: loadFromStorage,
    reset: reset
  };
})();

/* 暴露全局接口 */
window.SoulConfig = SoulConfig;
