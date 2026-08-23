/* ---------- Twinkling stars ---------- */
function initStars() {
  var starsBox = document.getElementById("stars");
  if (!starsBox) return;

  var fragment = document.createDocumentFragment();
  for (var i = 0; i < 90; i++) {
    var s = document.createElement("span");
    s.className = "star";
    s.style.left = Math.random() * 100 + "%";
    s.style.top = Math.random() * 100 + "%";
    var size = Math.random() * 1.6 + 0.6;
    s.style.width = size + "px";
    s.style.height = size + "px";
    s.style.setProperty("--d", (Math.random() * 3 + 2) + "s");
    s.style.animationDelay = (Math.random() * 4) + "s";
    fragment.appendChild(s);
  }
  starsBox.appendChild(fragment);
}

/* 暴露全局接口 */
window.SoulStars = { initStars: initStars };
