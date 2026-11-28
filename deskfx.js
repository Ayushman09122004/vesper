/* Vesper web — laptop hover previews (big window + mouse/trackpad only; phones never run this).
   Rest the pointer on a poster: it grows into a card with the picture, then the trailer (muted), round Play / My List / Like /
   More buttons, the facts line and mood tags — like Netflix. ShowBox titles get Play with FebBox. */
(function () {
  var S = window.VS, card = null, cur = null, want = null, showT = null, hideT = null, vidT = null, muted = true;
  function on() { return !!window.VDESK && !!window.VUI; }
  function esc(x) { return S.esc(String(x == null ? "" : x)); }
  function G() { return window.VUI.G; }

  function hide(now) {
    clearTimeout(showT); want = null; clearTimeout(vidT); cur = null;
    var c = card; card = null; if (!c) return;
    if (now) return c.remove();
    c.classList.remove("on"); setTimeout(function () { c.remove(); }, 220);
  }
  function btns(t) {
    var g = G(), inL = S.inList("mylist", t.id), liked = S.list("likes").indexOf(t.id) >= 0, app = S.pickApp(t);
    var play = app ? '<button class="hb play" data-play="' + t.id + '" title="Play on ' + esc(S.LABEL[app] || "") + '">' + g.play + "</button>"
      : t.site ? '<button class="hb play feb" data-feb="' + t.id + '" title="Play with FebBox">' + g.play + "</button>" : window.VFS && VFS.can(t) ? '<button class="hb play" data-free="' + t.id + '" title="Watch free">' + g.play + "</button>" : "";
    return play + '<button class="hb" data-list="' + t.id + '" title="My List">' + (inL ? g.check : g.plus) + "</button>" +
      '<button class="hb' + (liked ? " on" : "") + '" data-like="' + t.id + '" title="I like this">' + g.heart + "</button><i></i>" +
      '<button class="hb" data-hmore="' + t.id + '" title="More info">' + g.down + "</button>";
  }
  function show(pc) {
    var t = S.T[pc.dataset.id]; if (!t || !pc.isConnected) return;
    hide(true); cur = pc;
    var r = pc.getBoundingClientRect(), W = Math.max(300, Math.min(380, r.width * 2.1)), artH = W * 9 / 16;
    var left = Math.max(14, Math.min(innerWidth - W - 14, r.left + r.width / 2 - W / 2)), top = r.top + r.height / 2 - artH / 2 - 30;
    var c = document.createElement("div"); c.className = "hov"; c.dataset.id = t.id;
    c.style.cssText = "left:" + left + "px;top:" + Math.max(64, top) + "px;width:" + W + "px;--gh:" + (S.glowHue ? S.glowHue(t) : 260);
    var img = t.sb ? t.poster : (S.bd(t, "s780") || S.po(t, "s592")), tags = (S.vibes(t) || []).slice(0, 3), soon = !S.pickApp(t) && !t.site;
    c.innerHTML = '<div class="hart" data-hopen><img src="' + img + '" onerror="this.style.opacity=0"><div class="hsh"></div><div class="hnm">' + esc(t.title) + "</div>" +
      (window.VUI.trailer(t) ? '<button class="hmute" data-hmute title="Sound">' + (muted ? G().muted : G().sound) + "</button>" : "") + "</div>" +
      '<div class="hin"><div class="hbt">' + btns(t) + "</div>" +
      '<div class="hmeta">' + (t.imdb ? '<b class="hi">IMDb ' + t.imdb.toFixed(1) + "</b>" : "") + (window.VUI.rank(t) ? '<b class="ht">' + esc(window.VUI.rank(t)) + "</b>" : "") +
      (t.sb ? "<span>" + (t.type === "SHOW" ? "Series" : "Film") + (t.year ? " · " + t.year : "") + " · on ShowBox</span>" : window.VUI.meta(t)) + "</div>" +
      (tags.length ? '<div class="htags">' + tags.map(esc).join('<i class="dot"></i>') + "</div>" : "") + (soon ? '<div class="hsoon">Not streaming yet</div>' : "") + "</div>";
    // grows out of the poster
    c.style.transformOrigin = (r.left + r.width / 2 - left) + "px " + (r.top + r.height / 2 - Math.max(64, top)) + "px";
    c.style.setProperty("--s0", (r.width / W).toFixed(3));
    document.body.appendChild(c); card = c;
    void c.offsetWidth; setTimeout(function () { c.classList.add("on"); }, 16);
    // keep it on screen at the bottom
    setTimeout(function () { if (card !== c) return; var b = c.getBoundingClientRect(); if (b.bottom > innerHeight - 10) c.style.top = Math.max(64, innerHeight - 10 - b.height) + "px"; }, 30);
    var id = window.VUI.trailer(t);
    if (id) vidT = setTimeout(function () {
      if (card !== c) return;
      var f = document.createElement("iframe"); f.setAttribute("allow", "autoplay; encrypted-media"); f.tabIndex = -1;
      f.src = "https://www.youtube-nocookie.com/embed/" + id + "?autoplay=1&mute=1&controls=0&playsinline=1&rel=0&modestbranding=1&iv_load_policy=3&disablekb=1&enablejsapi=1&start=5";
      window.VUI.ytWatch(f, function () { setTimeout(function () { if (card !== c) return; c.classList.add("vid"); if (!muted) cmd(c, "unMute"); }, 1200); });
      c.querySelector(".hart").insertBefore(f, c.querySelector(".hsh"));
    }, 900);
  }
  function cmd(c, fn) { var f = c && c.querySelector("iframe"); if (f && f.contentWindow) f.contentWindow.postMessage(JSON.stringify({ event: "command", func: fn, args: [] }), "*"); }

  document.addEventListener("mouseover", function (e) {
    if (!on()) return;
    var el = e.target;
    if (card && card.contains(el)) { clearTimeout(hideT); return; }
    var pc = el.closest && el.closest(".pc");
    if (pc && (pc.closest("#detail,#sheet,.ac") || !pc.dataset.id)) pc = null;
    if (pc) {
      clearTimeout(hideT);
      if (pc === cur && card) return;
      clearTimeout(showT); if (card) hide();
      want = pc; showT = setTimeout(function () { if (want === pc && pc.isConnected) show(pc); }, card ? 180 : 480);
      return;
    }
    clearTimeout(showT); want = null;
    if (card) { clearTimeout(hideT); hideT = setTimeout(function () { hide(); }, 140); }
  }, { passive: true });
  document.addEventListener("click", function (e) {
    if (!card || !card.contains(e.target)) return;
    var c = card, t = S.T[c.dataset.id];
    if (e.target.closest("[data-hmute]")) { e.stopPropagation(); muted = !muted; cmd(c, muted ? "mute" : "unMute"); e.target.closest("[data-hmute]").innerHTML = muted ? G().muted : G().sound; return; }
    if (e.target.closest("[data-hmore],[data-hopen]")) { e.stopPropagation(); var pr = cur && cur.getBoundingClientRect(); hide(true); window.VUI.open(t.id, pr); return; }
    if (e.target.closest("[data-play],[data-feb],[data-free]")) { setTimeout(function () { hide(); }, 50); return; }
    // My List / Like: the app does the work; the buttons catch up a moment later
    setTimeout(function () { if (card === c && t) c.querySelector(".hbt").innerHTML = btns(t); }, 60);
  });
    // the page or that poster's row scrolling closes the card (anything else scrolling — the billboard turning — doesn't)
  document.addEventListener("scroll", function (e) { var tg = e.target; if (card && (tg === document || tg.id === "view" || (cur && tg.contains && tg.contains(cur)))) hide(true); }, { passive: true, capture: true });
  window.addEventListener("blur", function () { hide(true); });
  document.addEventListener("visibilitychange", function () { if (document.hidden) hide(true); });
  window.VHOV = { hide: hide };
})();
