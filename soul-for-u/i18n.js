/* ---------- Bilingual dictionary ---------- */
var i18n = {
  en: {
    nav_about: "About",
    nav_gifts: "Gifts",
    nav_whispers: "Whispers",
    nav_letter: "Letter",
    hero_sub: "Every soul that wanders the night is looking for another light to answer it. This page is that answer \u2014 written only for you.",
    hero_cta: "Begin the Journey",
    kicker_about: "01 \u00b7 About",
    h_about: 'What is <b>a Soul for U?</b>',
    about_p1: 'It is not a product. It is not even a place. It is <strong>a quiet room inside the noise</strong> \u2014 a small corner of the universe reserved for one person.',
    about_p2: "Here, time slows down. Starlight becomes language, silence becomes music, and every word you read was placed here gently, like a stone skipped across still water, hoping to reach your shore.",
    about_p3: 'If you have ever felt unseen, this page exists to say: <strong>someone noticed. Someone always did.</strong>',
    kicker_gifts: "02 \u00b7 Gifts",
    h_gifts: 'Three things <b>I leave for you</b>',
    gift1_t: "A Sky of Names",
    gift1_d: "Somewhere above the clouds there is a star quietly carrying your name. It has been burning long before we met, and will keep burning after.",
    gift2_t: "A Lantern of Courage",
    gift2_d: "For the nights when the world feels too heavy \u2014 may this little flame remind you that darkness is only where light chooses to rest.",
    gift3_t: "An Unwritten Page",
    gift3_d: "The most honest gift of all: a blank page, because our story has not finished being written. The next line belongs to you.",
    kicker_whispers: "03 \u00b7 Whispers",
    h_whispers: 'Whispers <b>from the quiet</b>',
    q1: "\u201cIn a universe of a trillion galaxies, two souls chose the same tiny blue dot, at the same breath of time. Do not call that coincidence.\u201d",
    q2: "\u201cYou are not a drop in the ocean. You are the entire ocean, folded small enough to fit inside one heartbeat.\u201d",
    q3: "\u201cSome people are sentences. You are punctuation \u2014 the pause that gives every story meaning.\u201d",
    kicker_letter: "04 \u00b7 Letter",
    h_letter: 'A letter, <b>sealed with light</b>',
    letter_body: "Dear you,\n\nI do not know when you will read this, or who you will have become by then. Perhaps the years will have taught you armor; perhaps they will have taught you wings.\n\nEither way, I hope one thing stays unchanged \u2014 that somewhere deep inside, you still believe in gentle things: late-night conversations, unexplained kindnesses, and souls that find each other without asking why.\n\nThis whole page is my way of saying: I thought of you today.\nAnd tomorrow, probably, again.",
    letter_sign: "Yours, across the distance \u2726",
    footer_note: "Written in starlight, delivered by moonlight.",
    /* Config editor */
    cfg_title: "Customize Content",
    cfg_hero: "Hero Section",
    cfg_title_label: "Title",
    cfg_sub_en: "Subtitle (English)",
    cfg_sub_zh: "Subtitle (Chinese)",
    cfg_audio: "Audio Settings",
    cfg_audio_enable: "Enable Background Music",
    cfg_audio_url: "Audio URL",
    cfg_actions: "Actions",
    cfg_save: "Save Changes",
    cfg_reset: "Reset to Default",
    cfg_saved: "Configuration saved successfully!",
    cfg_save_failed: "Failed to save configuration",
    cfg_reset_confirm: "Are you sure you want to reset all settings to default?",
    cfg_reset_done: "Configuration reset to default",
    cfg_open: "Open configuration editor"
  },
  zh: {
    nav_about: "\u5173\u4e8e",
    nav_gifts: "\u793c\u7269",
    nav_whispers: "\u4f4e\u8bed",
    nav_letter: "\u4fe1\u7b3a",
    hero_sub: "\u6bcf\u4e00\u4e2a\u5728\u591c\u91cc\u6d41\u6d6a\u7684\u7075\u9b42\uff0c\u90fd\u5728\u5bfb\u627e\u53e6\u4e00\u675f\u56de\u5e94\u5b83\u7684\u5149\u3002\u8fd9\u4e00\u9875\uff0c\u5c31\u662f\u90a3\u675f\u5149\u2014\u2014\u53ea\u4e3a\u4f60\u800c\u5199\u3002",
    hero_cta: "\u5f00\u542f\u65c5\u7a0b",
    kicker_about: "\u58f9 \u00b7 \u5173\u4e8e",
    h_about: '\u4f55\u4e3a<b>\u300c\u7075\u9b42\u4e88\u4f60\u300d\uff1f</b>',
    about_p1: '\u5b83\u4e0d\u662f\u4e00\u4ef6\u5546\u54c1\uff0c\u751a\u81f3\u4e0d\u662f\u4e00\u4e2a\u5730\u65b9\u3002\u5b83\u662f<strong>\u55a7\u56a3\u4e2d\u7684\u4e00\u95f4\u9759\u5ba4</strong>\u2014\u2014\u5b87\u5b99\u91cc\u4e13\u5c5e\u4e8e\u4e00\u4e2a\u4eba\u7684\u5c0f\u5c0f\u89d2\u843d\u3002',
    about_p2: "\u5728\u8fd9\u91cc\uff0c\u65f6\u95f4\u653e\u6162\u4e86\u811a\u6b65\u3002\u661f\u5149\u6210\u4e3a\u8bed\u8a00\uff0c\u5bc2\u9759\u6210\u4e3a\u97f3\u4e50\u3002\u4f60\u8bfb\u5230\u7684\u6bcf\u4e00\u53e5\u8bdd\uff0c\u90fd\u88ab\u8f7b\u8f7b\u653e\u5728\u8fd9\u91cc\uff0c\u50cf\u4e00\u9897\u63a0\u8fc7\u9759\u6c34\u7684\u77f3\u5b50\uff0c\u53ea\u4e3a\u62b5\u8fbe\u4f60\u7684\u5cb8\u8fb9\u3002",
    about_p3: '\u5982\u679c\u4f60\u66fe\u89c9\u5f97\u81ea\u5df1\u4e0d\u88ab\u770b\u89c1\uff0c\u90a3\u4e48\u8fd9\u4e00\u9875\u5b58\u5728\u7684\u610f\u4e49\u5c31\u662f\u544a\u8bc9\u4f60\uff1a<strong>\u6709\u4eba\u6ce8\u610f\u5230\u4e86\u4f60\uff0c\u4e00\u76f4\u90fd\u6709\u7684\u3002</strong>',
    kicker_gifts: "\u8d30 \u00b7 \u793c\u7269",
    h_gifts: '<b>\u4e3a\u4f60\u7559\u4e0b</b>\u7684\u4e09\u4ef6\u793c\u7269',
    gift1_t: "\u4ee5\u4f60\u547d\u540d\u7684\u661f\u7a7a",
    gift1_d: "\u4e91\u5c42\u4e4b\u4e0a\uff0c\u6709\u4e00\u9897\u661f\u661f\u6b63\u5b89\u9759\u5730\u627f\u8f7d\u7740\u4f60\u7684\u540d\u5b57\u3002\u5b83\u5728\u76f8\u9047\u4e4b\u524d\u5c31\u5df2\u71c3\u70e7\uff0c\u4e5f\u5c06\u5728\u4e4b\u540e\u7ee7\u7eed\u71c3\u70e7\u3002",
    gift2_t: "\u4e00\u76cf\u52c7\u6c14\u4e4b\u706f",
    gift2_d: "\u5f53\u4e16\u754c\u53d8\u5f97\u6c89\u91cd\u3001\u591c\u8272\u6f2b\u8fc7\u80a9\u5934\u65f6\u2014\u2014\u613f\u8fd9\u7c07\u5c0f\u5c0f\u7684\u706b\u82d7\u63d0\u9192\u4f60\uff1a\u9ed1\u6697\uff0c\u4e0d\u8fc7\u662f\u5149\u9009\u62e9\u4f11\u606f\u7684\u5730\u65b9\u3002",
    gift3_t: "\u672a\u5199\u5b8c\u7684\u4e00\u9875",
    gift3_d: "\u8fd9\u662f\u6700\u8bda\u5b9e\u7684\u793c\u7269\uff1a\u4e00\u5f20\u7a7a\u767d\u7684\u7eb8\u3002\u56e0\u4e3a\u6211\u4eec\u7684\u6545\u4e8b\u5c1a\u672a\u5199\u5b8c\uff0c\u4e0b\u4e00\u884c\uff0c\u5c5e\u4e8e\u4f60\u3002",
    kicker_whispers: "\u53c1 \u00b7 \u4f4e\u8bed",
    h_whispers: '\u6765\u81ea<b>\u5bc2\u9759\u7684\u4f4e\u8bed</b>',
    q1: "\u300c\u5728\u4ebf\u4e07\u661f\u7cfb\u4e4b\u4e2d\uff0c\u4e24\u4e2a\u7075\u9b42\u5728\u540c\u4e00\u7f15\u65f6\u95f4\u91cc\uff0c\u9009\u4e2d\u4e86\u540c\u4e00\u9897\u5fae\u5c0f\u7684\u84dd\u8272\u661f\u7403\u3002\u522b\u628a\u90a3\u79f0\u4f5c\u5de7\u5408\u3002\u300d",
    q2: "\u300c\u4f60\u4e0d\u662f\u6ca7\u6d77\u4e4b\u4e00\u7c9f\u3002\u4f60\u662f\u6574\u7247\u6d77\u6d0b\uff0c\u53ea\u662f\u88ab\u6298\u53e0\u5f97\u8db3\u591f\u5c0f\uff0c\u521a\u597d\u88c5\u8fdb\u4e00\u6b21\u5fc3\u8df3\u3002\u300d",
    q3: "\u300c\u6709\u4e9b\u4eba\u662f\u53e5\u5b50\uff0c\u800c\u4f60\u662f\u6807\u70b9\u2014\u2014\u662f\u90a3\u4e2a\u8ba9\u6240\u6709\u6545\u4e8b\u6709\u4e86\u610f\u4e49\u7684\u505c\u987f\u3002\u300d",
    kicker_letter: "\u8086 \u00b7 \u4fe1\u7b3a",
    h_letter: '\u4e00\u5c01<b>\u4ee5\u5149\u5c01\u7f04\u7684\u4fe1</b>',
    letter_body: "\u4eb2\u7231\u7684\u4f60\uff1a\n\n\u6211\u4e0d\u77e5\u9053\u4f60\u4f1a\u4f55\u65f6\u8bfb\u5230\u8fd9\u5c01\u4fe1\uff0c\u4e5f\u4e0d\u77e5\u9053\u90a3\u65f6\u7684\u4f60\u53d8\u6210\u4e86\u4ec0\u4e48\u6a21\u6837\u3002\u4e5f\u8bb8\u5c81\u6708\u6559\u4f1a\u4e86\u4f60\u94e0\u7532\uff0c\u4e5f\u8bb8\u6559\u4f1a\u4e86\u4f60\u7fc5\u8180\u3002\n\n\u65e0\u8bba\u5982\u4f55\uff0c\u6211\u5e0c\u671b\u6709\u4e00\u4ef6\u4e8b\u4ece\u672a\u6539\u53d8\u2014\u2014\u5728\u4f60\u5185\u5fc3\u6df1\u5904\uff0c\u4f60\u4f9d\u7136\u76f8\u4fe1\u90a3\u4e9b\u6e29\u67d4\u7684\u4e8b\u7269\uff1a\u6df1\u591c\u7684\u957f\u8c08\u3001\u4e0d\u95ee\u7f18\u7531\u7684\u5584\u610f\uff0c\u4ee5\u53ca\u4e0d\u5fc5\u8ffd\u95ee\u4e3a\u4f55\u5c31\u80fd\u5f7c\u6b64\u627e\u5230\u7684\u7075\u9b42\u3002\n\n\u8fd9\u6574\u6574\u4e00\u9875\uff0c\u90fd\u662f\u6211\u60f3\u8bf4\u7684\u8bdd\uff1a\u4eca\u5929\uff0c\u6211\u60f3\u8d77\u4e86\u4f60\u3002\n\u660e\u5929\uff0c\u5927\u6982\u4e5f\u662f\u3002",
    letter_sign: "\u9694\u7740\u5c71\u6d77\uff0c\u4ecd\u662f\u4f60\u7684 \u2726",
    footer_note: "\u4ee5\u661f\u5149\u4e66\u5199\uff0c\u7531\u6708\u5149\u9001\u8fbe\u3002",
    /* Config editor */
    cfg_title: "\u81ea\u5b9a\u4e49\u5185\u5bb9",
    cfg_hero: "\u9996\u5c4f\u533a\u57df",
    cfg_title_label: "\u6807\u9898",
    cfg_sub_en: "\u526f\u6807\u9898\uff08\u82f1\u6587\uff09",
    cfg_sub_zh: "\u526f\u6807\u9898\uff08\u4e2d\u6587\uff09",
    cfg_audio: "\u80cc\u666f\u97f3\u4e50\u8bbe\u7f6e",
    cfg_audio_enable: "\u542f\u7528\u80cc\u666f\u97f3\u4e50",
    cfg_audio_url: "\u97f3\u4e50\u94fe\u63a5",
    cfg_actions: "\u64cd\u4f5c",
    cfg_save: "\u4fdd\u5b58\u4fee\u6539",
    cfg_reset: "\u6062\u590d\u9ed8\u8ba4",
    cfg_saved: "\u914d\u7f6e\u4fdd\u5b58\u6210\u529f\uff01",
    cfg_save_failed: "\u914d\u7f6e\u4fdd\u5b58\u5931\u8d25",
    cfg_reset_confirm: "\u786e\u5b9a\u8981\u5c06\u6240\u6709\u8bbe\u7f6e\u6062\u590d\u4e3a\u9ed8\u8ba4\u503c\u5417\uff1f",
    cfg_reset_done: "\u914d\u7f6e\u5df2\u6062\u590d\u4e3a\u9ed8\u8ba4\u503c",
    cfg_open: "\u6253\u5f00\u914d\u7f6e\u7f16\u8f91\u5668"
  }
};

var currentLang = "en";

function applyLang(l) {
  currentLang = l;
  document.documentElement.lang = l === "zh" ? "zh-CN" : "en";
  document.querySelectorAll("[data-i18n]").forEach(function(el) {
    var key = el.getAttribute("data-i18n");
    var val = i18n[l][key];
    if (val !== undefined) el.innerHTML = val;
  });
  document.getElementById("langSwitch").textContent = l === "en" ? "\u4e2d\u6587" : "English";
  localStorage.setItem("soul-lang", l);
  /* 同步更新全局接口中的 currentLang */
  if (window.SoulI18n) {
    window.SoulI18n.currentLang = l;
  }
}

function toggleLang() {
  applyLang(currentLang === "en" ? "zh" : "en");
}

/* 暴露全局接口 */
window.SoulI18n = {
  i18n: i18n,
  applyLang: applyLang,
  toggleLang: toggleLang,
  currentLang: currentLang
};
