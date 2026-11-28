/* Vesper web — laptop extras (big window + mouse/trackpad only; phones never load this behaviour):
   arrows on rows, keyboard shortcuts, click outside a title pop-up to close it. */
(function () {
  var mq = window.matchMedia && matchMedia("(min-width: 960px) and (hover: hover) and (pointer: fine)");
  function on() { return !!(mq && mq.matches); }
  window.VDESK = on();
  document.documentElement.classList.toggle("desk", on());
  if (mq && mq.addEventListener) mq.addEventListener("change", function () { window.VDESK = on(); document.documentElement.classList.toggle("desk", on()); });

  // row arrows: added the first time you hover a row
  var L = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>';
  document.addEventListener("mouseover", function (e) {
    if (!on()) return; var row = e.target.closest && e.target.closest(".row"); if (!row || row._arr) return;
    var rail = row.querySelector(".rail"); if (!rail) return; row._arr = 1;
    ["l", "r"].forEach(function (d) { var b = document.createElement("button"); b.className = "rarr " + d; b.innerHTML = L; b.setAttribute("aria-label", d === "l" ? "Back" : "More");
      b.addEventListener("click", function (ev) { ev.stopPropagation(); rail.scrollBy({ left: (d === "l" ? -1 : 1) * rail.clientWidth * 0.86, behavior: "smooth" }); });
      row.appendChild(b); });
    function upd() { row.classList.toggle("can-l", rail.scrollLeft > 6); row.classList.toggle("can-r", rail.scrollLeft + rail.clientWidth < rail.scrollWidth - 6); }
    rail.addEventListener("scroll", upd, { passive: true }); upd();
  }, { passive: true });

  // keys: "/" search · Esc closes a title or sheet
  document.addEventListener("keydown", function (e) {
    if (!on()) return; var typing = /INPUT|TEXTAREA/.test((document.activeElement || {}).tagName || "");
    if (e.key === "/" && !typing) { var s = document.querySelector('#tabs [data-tab="search"]'); if (s) { e.preventDefault(); s.click(); setTimeout(function () { var i = document.querySelector(".sbox input"); if (i) i.focus(); }, 350); } }
    if (e.key === "Escape") { var d = document.getElementById("detail"), sh = document.getElementById("sheet");
      if ((d && d.classList.contains("on")) || (sh && sh.classList.contains("on"))) { e.preventDefault(); history.back(); } else if (typing) document.activeElement.blur(); }
  });
  // title pop-up: a click on the dimmed area around it closes it
  document.addEventListener("click", function (e) {
    if (!on()) return; var d = document.getElementById("detail"); if (!d || e.target !== d || !d.classList.contains("on")) return;
    var w = Math.min(960, innerWidth), x0 = (innerWidth - w) / 2; if (e.clientX < x0 || e.clientX > x0 + w) history.back();
  });
})();
