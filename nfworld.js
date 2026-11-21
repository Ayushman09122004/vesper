/* Vesper web — "Netflix worldwide": switch it on in Search and every search also shows which countries have the title on
   Netflix (48 countries, India first). The data is built daily by the bots (tools/netflix-world.mjs → netflix-world.json)
   and is only downloaded while the switch is on. */
(function () {
  var S = window.VS; if (!S) return;
  var LS = window.localStorage, KEY = "vesper.nfw.on";
  var ON = false; try { ON = LS.getItem(KEY) === "1"; } catch (e) {}
  var DATA = null, BYID = null, LIST = null, waiting = [], busy = false, failed = false, tok = 0;
  var IMG = "https://images.justwatch.com";
  var NAME = {}; try { var dn = new Intl.DisplayNames(["en"], { type: "region" }); NAME = { of: function (c) { return dn.of(c); } }; } catch (e) { NAME = { of: function (c) { return c; } }; }
  function cname(c) { return c === "GB" ? "UK" : c === "US" ? "USA" : c === "AE" ? "UAE" : NAME.of(c); }
  function flag(c) { return String.fromCodePoint.apply(null, c.split("").map(function (ch) { return 0x1f1a5 + ch.charCodeAt(0); })); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  function load(cb) {
    if (DATA) return cb(true); waiting.push(cb); if (busy) return; busy = true;
    fetch("netflix-world.json?d=" + new Date().toISOString().slice(0, 10)).then(function (r) { if (!r.ok) throw 0; return r.json(); }).then(function (d) {
      DATA = d; BYID = {}; LIST = d.t.map(function (x) { var e = { id: x[0], title: x[1], year: x[2], type: x[3], po: x[4], m: parseInt(x[5], 36), k: S.norm(x[1]) }; BYID[e.id] = e; return e; });
      busy = false; failed = false; var w = waiting; waiting = []; w.forEach(function (f) { f(true); });
    }).catch(function () { busy = false; failed = true; var w = waiting; waiting = []; w.forEach(function (f) { f(false); }); });
  }
  if (ON) setTimeout(function () { load(function () {}); }, 2500);   // ready before you type

  function countries(e) { var out = [], m = e.m; DATA.cc.forEach(function (c, i) { if (Math.floor(m / Math.pow(2, i)) % 2) out.push(c); }); return out; }

  // best matches for what was typed (+ Vesper's own top result by id, so "not on Netflix anywhere" can be said honestly)
  function matches(q, R) {
    var qn = S.norm(q), out = [], seen = {};
    function push(e) { if (e && !seen[e.id]) { seen[e.id] = 1; out.push(e); } }
    if (R && R.top && BYID[R.top.id]) push(BYID[R.top.id]);
    var ex = [], st = [], co = [];
    if (qn.length >= 2) LIST.forEach(function (e) { if (e.k === qn) ex.push(e); else if (e.k.indexOf(qn) === 0) st.push(e); else if (qn.length >= 4 && e.k.indexOf(qn) > 0) co.push(e); });
    function byReach(a, b) { return countries(b).length - countries(a).length || b.year - a.year; }
    ex.sort(byReach).forEach(push); st.sort(byReach).slice(0, 6).forEach(push); co.sort(byReach).slice(0, 4).forEach(push);
    return out.slice(0, 8);
  }

  function card(e) {
    var cs = countries(e), inIN = cs.indexOf("IN") >= 0, rest = cs.filter(function (c) { return c !== "IN"; });
    var t = S.T[e.id], tap = t ? ' data-id="' + esc(e.id) + '"' : "";
    var po = e.po ? IMG + "/poster/" + e.po.replace("/", "/s166/") + ".webp" : "";
    return '<div class="nfwi"' + tap + '>' + (po ? '<img loading="lazy" src="' + po + '">' : '<div class="nfwp"></div>') +
      '<div class="nfwt"><b>' + esc(e.title) + "</b><small>" + (e.year || "") + (e.type === "S" ? " · Series" : " · Film") + "</small>" +
      '<div class="nfwin ' + (inIN ? "y" : "n") + '">' + flag("IN") + (inIN ? " On Netflix in India" : " Not on Netflix in India") + "</div>" +
      (rest.length ? '<div class="nfwf" data-nfwall>' + rest.slice(0, 12).map(flag).join(" ") + (rest.length > 12 ? " +" + (rest.length - 12) : "") +
        ' <span>' + rest.length + (rest.length === 1 ? " country" : " countries") + (inIN ? " more" : "") + '</span></div><div class="nfwl">' +
        rest.map(function (c) { return flag(c) + " " + esc(cname(c)); }).join(" · ") + "</div>" : "") +
      "</div></div>";
  }

  function searchInto(body, q, R) {
    if (!ON || !q) return;
    var my = ++tok, el = document.createElement("div"); el.className = "nfw";
    el.innerHTML = '<div class="sec-h">Netflix around the world <small class="secsub">looking…</small></div>';
    body.insertBefore(el, body.firstChild && body.firstChild.classList && body.firstChild.classList.contains("fixq") ? body.firstChild.nextSibling : body.firstChild);
    load(function (ok) {
      if (my !== tok || !el.isConnected) return;
      if (!ok) { el.innerHTML = '<div class="sec-h">Netflix around the world <small class="secsub">couldn’t load — check your connection</small></div>'; return; }
      var list = matches(q, R), sub = DATA.cc.length + " countries · updated " + new Date(DATA.generated).toLocaleDateString(undefined, { day: "numeric", month: "short" });
      var html = '<div class="sec-h">Netflix around the world <small class="secsub">' + esc(sub) + "</small></div>";
      if (R && R.top && !BYID[R.top.id] && S.norm(R.top.title).indexOf(S.norm(q)) === 0)
        html += '<div class="nfwno">' + esc(R.top.title) + (R.top.year ? " (" + R.top.year + ")" : "") + " isn’t on Netflix in any of the " + DATA.cc.length + " countries.</div>";
      html += list.length ? list.map(card).join("") : '<div class="nfwno">Nothing called “' + esc(q) + '” on Netflix in any of the ' + DATA.cc.length + " countries.</div>";
      el.innerHTML = html;
    });
  }
  // tap the flags → full list of country names
  document.addEventListener("click", function (ev) { var f = ev.target.closest && ev.target.closest("[data-nfwall]"); if (!f) return; ev.stopPropagation(); f.parentNode.classList.toggle("open"); }, true);

  function toggle(onChange) {
    var b = document.createElement("button");
    function paint() { b.className = "sbtog nfwtog" + (ON ? " on" : ""); b.innerHTML = "<i></i>Netflix worldwide " + (ON ? "on" : "off"); }
    paint();
    b.addEventListener("click", function () { ON = !ON; try { LS.setItem(KEY, ON ? "1" : "0"); } catch (e) {} paint(); if (ON) load(function () {}); if (onChange) onChange(); });
    return b;
  }
  window.VNW = { on: function () { return ON; }, toggle: toggle, searchInto: searchInto };
})();
