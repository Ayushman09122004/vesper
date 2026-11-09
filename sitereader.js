/* Vesper TV — Sites reader. Runs on the TV by itself: fetches a website's page (webOS apps have no CORS limits and share
   one cookie jar), parses it with DOMParser and turns it into cards / search / title details / episodes / FebBox links.
   Layout-free port of the Mac reader (no innerText/offsetWidth: a parsed page has no layout). window.SR = {...} */
(function () {
  // one retry: sites are often slow for a moment
  function get(url, done, tries) {
    var x = new XMLHttpRequest(); x.open("GET", url, true); x.withCredentials = false; x.timeout = 25000;
    function fail(code) { if (!tries && (code === 0 || code >= 500)) return setTimeout(function () { get(url, done, 1); }, 1200); done(null, code, url); }
    x.onload = function () { if (x.status >= 400) return fail(x.status); done(x.responseText, x.status, x.responseURL || url); };
    x.onerror = x.ontimeout = function () { fail(0); }; x.send();
  }
  function parse(html, base) {
    var d = new DOMParser().parseFromString(html, "text/html");
    if (!d.querySelector("base")) { var b = d.createElement("base"); b.href = base; (d.head || d.documentElement).appendChild(b); }
    return d;
  }
  function txt(e) { return ((e && e.textContent) || "").replace(/\s+/g, " ").trim(); }
  function mkAbs(base) { return function (u) { try { return new URL(u, base).href; } catch (e) { return ""; } }; }
  function hostOf(u) { try { return new URL(u).hostname.replace(/^www\./, ""); } catch (e) { return ""; } }
  function baseDom(h) { return h.split(".").slice(-2).join("."); }

  // "checking your browser" / Turnstile / captcha pages
  function isCheck(d) {
    var t = (d.title || "") + " " + txt(d.body).slice(0, 600);
    return /just a moment|checking (your|the) browser|attention required|generating access token|verify(ing)? (you are|that you are) (a )?human|ddos-guard|security check|one more step/i.test(t) ||
      !!d.querySelector(".cf-turnstile,#challenge-form,iframe[src*='challenges.cloudflare'],iframe[src*='hcaptcha'],iframe[src*='recaptcha']");
  }

  function reader(d, url) {
    var abs = mkAbs(url), host = hostOf(url);
    function same(u) { var h = hostOf(u); return h && baseDom(h) === baseDom(host); }
    function imgUrl(i) {
      if (!i) return "";
      var s = i.getAttribute("data-src") || i.getAttribute("data-lazy-src") || i.getAttribute("data-original") || i.getAttribute("data-lazy") || "";
      if (!s) { var ss = i.getAttribute("data-srcset") || i.getAttribute("srcset") || ""; if (ss) s = ss.split(",").pop().trim().split(" ")[0]; }
      if (!s || /^data:/.test(s)) s = i.getAttribute("src") || "";
      return /^data:/.test(s) ? "" : abs(s);
    }
    function bgUrl(e) {
      for (var k = 0, n = e; n && k < 2; k++) { var b = n.getAttribute && (n.getAttribute("data-bg") || n.getAttribute("data-background")); if (b) return abs(b);
        var st = (n.getAttribute && n.getAttribute("style")) || ""; var m = /url\(["']?([^"')]+)/.exec(st); if (m) return abs(m[1]); n = n.querySelector && n.querySelector("[style*=background],[data-bg],[data-background]"); }
      return "";
    }
    function og(p) { var m = d.querySelector('meta[property="' + p + '"],meta[name="' + p + '"]'); return m ? m.getAttribute("content") || "" : ""; }
    var BAD = /\/(login|register|signup|sign-in|contact|dmca|privacy|terms|faq|about|request|user|account|profile|cart|blog|news|tag)s?(\/|$|\?)/i;
    function oneLink(e) { var hs = {}; [].forEach.call(e.querySelectorAll("a[href]"), function (x) { hs[abs(x.getAttribute("href"))] = 1; }); return Object.keys(hs).length <= 1; }
    function inCard(x) { for (var q = x.parentElement, k = 0; q && k < 3; q = q.parentElement, k++) if (oneLink(q) && q.querySelector("img,[style*=background],[data-bg]")) return true; return false; }
    function headTxt(x) {
      var t = txt(x).replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{FE0F}\u{2B00}-\u{2BFF}]/gu, "").replace(/\s+/g, " ").replace(/^[\s•·|»›>\-–—:]+|[\s•·|»›>\-–—:]+$/g, "").trim();
      if (t === t.toUpperCase() && /[A-Z]{3}/.test(t)) t = t.toLowerCase().replace(/(^|\s)\S/g, function (c) { return c.toUpperCase(); }).replace(/\bTv\b/g, "TV");
      return t;
    }
    var here = url.split("#")[0];

    function cards() {
      var out = [], seen = {};
      [].forEach.call(d.querySelectorAll("a[href]"), function (a) {
        var href = abs(a.getAttribute("href")); if (!href || href.split("#")[0] === here || !same(href) || BAD.test(href)) return;
        if (a.closest("nav,header,footer,[class*=menu],[class*=pagination],[class*=breadcrumb]")) return;
        var box = a, img = a.querySelector("img"), bg = img ? "" : bgUrl(a);
        if (img || bg) for (var k0 = 0; k0 < 3 && box.parentElement && box.parentElement !== d.body && oneLink(box.parentElement); k0++) box = box.parentElement;
        for (var k = 0; k < 3 && !img && !bg && box.parentElement; k++) { box = box.parentElement; if (box.querySelectorAll("a[href]").length > 4) break; img = box.querySelector("img"); bg = img ? "" : bgUrl(box); }
        var poster = img ? imgUrl(img) : bg; if (!poster || /logo|avatar|icon|sprite|flag/i.test(poster)) return;
        var th = box.querySelector("h1,h2,h3,h4,h5,[class*=title],[class*=name],[id*=title],[id*=name]");
        var title = (a.getAttribute("title") || "").trim() || txt(th) || (img && img.getAttribute("alt") || "").trim() || txt(a);
        title = title.replace(/^(watch|play)\s+/i, "").replace(/\s+(online|free)(\s+.*)?$/i, "").trim();
        if (!title || title.length > 140) return;
        var meta = [];
        [].forEach.call(box.querySelectorAll("span,small,em,i,div,b"), function (s) { if (s.children.length) return; var t = txt(s); if (t && /[a-z0-9]/i.test(t) && t.length <= 14 && t !== title && meta.indexOf(t) < 0 && meta.length < 3) meta.push(t); });
        var hd = "";
        for (var p = box, dd = 0; p && p !== d.body && dd < 9 && !hd; p = p.parentElement, dd++) {
          var hs = [].filter.call(p.querySelectorAll("h1,h2,h3,h4,[class*=section-title],[class*=block-title],[class*=heading],[id*=title]"), function (x) {
            return !x.contains(a) && !box.contains(x) && (x.compareDocumentPosition(a) & 4) && !x.closest("a") && txt(x).length > 1 && txt(x).length < 60 && !inCard(x); });
          if (hs.length) hd = headTxt(hs[hs.length - 1]);
        }
        if (seen[href + "|" + hd]) return; seen[href + "|" + hd] = 1;
        out.push({ url: href, title: title, img: poster, meta: meta.join(" · "), row: hd });
      });
      return out;
    }
    function rows(list) {
      var by = {}, order = [];
      list.forEach(function (c) { var k = c.row || "More"; if (!by[k]) { by[k] = []; order.push(k); } by[k].push(c); });
      return order.map(function (k) { return { title: k, items: by[k] }; }).filter(function (r) { return r.items.length >= 2; });
    }
    function searchTpl() {
      var IN = "input[type=search],input[name=q],input[name=s],input[name=keyword],input[name=query],input[name=search],input[type=text]";
      var f = [].filter.call(d.querySelectorAll("form"), function (f) { return f.querySelector(IN) && (f.getAttribute("method") || "get").toLowerCase() === "get"; })[0];
      if (!f) return "";
      var inp = f.querySelector(IN); if (!inp.getAttribute("name")) return "";
      var u = new URL(f.getAttribute("action") || new URL(url).pathname, url), ps = [];
      [].forEach.call(f.querySelectorAll("input[type=hidden][name]"), function (x) { ps.push(encodeURIComponent(x.name) + "=" + encodeURIComponent(x.value)); });
      ps.push(encodeURIComponent(inp.getAttribute("name")) + "={q}");
      return u.origin + u.pathname + "?" + ps.join("&");
    }
    function navLinks() {
      var out = [], seen = {};
      [].forEach.call(d.querySelectorAll("nav a[href],header a[href],[class*=menu] a[href]"), function (a) {
        var u = abs(a.getAttribute("href")), t = txt(a);
        if (!u || !same(u) || seen[u] || !t || t.length > 22 || BAD.test(u) || u === new URL(url).origin + "/") return;
        seen[u] = 1; out.push({ title: t, url: u });
      });
      var main = /^(movies?|tv( shows?)?|series|shows?|top( imdb)?|trending|popular|latest|new|anime|k-?drama|drama)$/i;
      out.sort(function (a, b) { return (main.test(b.title) ? 1 : 0) - (main.test(a.title) ? 1 : 0); });
      return out.slice(0, 120);
    }
    // wrapper pages (real site in a full-page frame) and "Watch now" landing pages
    function hop() {
      var nl = d.querySelectorAll("a[href]").length, c = cards().length;
      var fr = [].filter.call(d.querySelectorAll("iframe[src]"), function (f) { return /^https?:/.test(abs(f.getAttribute("src"))) && /fullscreen|embed-full|site/i.test((f.parentElement && f.parentElement.className) + " " + (f.getAttribute("title") || "") + " " + (f.getAttribute("style") || "")) || d.querySelectorAll("iframe").length === 1; })[0];
      if (fr && nl < 25 && c < 4) return abs(fr.getAttribute("src"));
      if (c < 4) { var go = [].filter.call(d.querySelectorAll("a[href]"), function (a) { return /^(watch( now)?|enter( site)?|go to (the )?(site|website)|visit( site)?|start watching|browse( now)?|watch free|stream now)\b/i.test(txt(a)) && abs(a.getAttribute("href")) !== here; })[0];
        if (go) return abs(go.getAttribute("href")); }
      return "";
    }
    // FebBox links on a page: plain links, buttons/data attributes, or text inside scripts
    function febbox() {
      var out = [], seen = {};
      function add(u, label) { if (!u) return; var m = /https?:\/\/(?:www\.)?febbox\.com\/(?:share|s)\/[A-Za-z0-9_\-]+/i.exec(u); if (!m || seen[m[0]]) return; seen[m[0]] = 1; out.push({ url: m[0], label: label || "" }); }
      [].forEach.call(d.querySelectorAll("a[href],[data-url],[data-link],[data-href],[data-src],[onclick],iframe[src]"), function (e) {
        ["href", "data-url", "data-link", "data-href", "data-src", "onclick", "src"].forEach(function (k) { var v = e.getAttribute(k); if (v && /febbox/i.test(v)) add(v, txt(e)); }); });
      var re = /https?:\\?\/\\?\/(?:www\.)?febbox\.com\\?\/(?:share|s)\\?\/[A-Za-z0-9_\-]+/gi, m, html = d.documentElement.innerHTML;
      while ((m = re.exec(html))) add(m[0].replace(/\\\//g, "/"), "");
      // the player choice the user means: anything labelled FebBox (button/tab) — its target, if it has one
      var choice = [].filter.call(d.querySelectorAll("a,button,li,[role=tab],[data-server],[data-provider-id]"), function (e) { return /febbox/i.test(txt(e) + " " + (e.getAttribute("data-provider-id") || "") + " " + (e.getAttribute("data-server") || "")); })
        .map(function (e) { return { label: txt(e), url: abs(e.getAttribute("href") || e.getAttribute("data-url") || e.getAttribute("data-provider-url") || e.getAttribute("data-link") || "") }; });
      return { links: out, choices: choice };
    }
    function detail() {
      var title = (og("og:title") || txt(d.querySelector("h1")) || d.title).replace(/^(watch|play)\s+/i, "").replace(/\s*[|\-–]\s*[^|\-–]*$/, "").replace(/\s+(online|free)(\s+.*)?$/i, "")
        .replace(/\s*[(\[]\s*(episode|ep\.?)\s*\d+\s*[)\]]\s*$/i, "").replace(/\s*[|\-–—:]\s*(watch|stream|online|free|full)\b.*$/i, "").trim();
      var poster = og("og:image") ? abs(og("og:image")) : imgUrl(d.querySelector("[class*=poster] img,[class*=cover] img,main img,img"));
      var desc = og("og:description") || og("description");
      var dEl = [].filter.call(d.querySelectorAll("[class*=description],[class*=synopsis],[class*=overview],[itemprop=description],.desc,.summary,[id*=description],[id*=synopsis]"),
        function (e) { return !e.closest("[class*=jw-],[class*=player],[id*=player],[class*=vjs],[class*=plyr],[class*=shortcut]"); })[0];
      if (dEl && txt(dEl).length > desc.length) desc = txt(dEl);
      var facts = [];
      [].forEach.call(d.querySelectorAll("li,p,div,span"), function (e) { if (e.children.length > 3 || facts.length >= 7) return; var t = txt(e);
        if (/^(released?|year|date|genres?|duration|runtime|country|rating|imdb|status|type|quality)\s*:\s*\S/i.test(t) && t.length < 90 && facts.indexOf(t) < 0) facts.push(t); });
      var EP = /\b(ep|eps|episode)\b[\s.\-:#]*\d+|\bE\d{1,4}\b|^\d{1,4}$|[-\/]ep(isode)?-?\d+/i, eps = [], seen = {};
      function epLabel(a, t) {
        var num = a.getAttribute("data-episode") || a.getAttribute("data-ep") || ((/\b(?:e|ep\.?|eps|episode)\s*0*(\d{1,4})\b/i.exec(t) || [])[1]) || ((/^\s*0*(\d{1,4})\s*$/.exec(t) || [])[1]);
        var te = a.querySelector("h3,h4,h5,[class*=title],[class*=name]"), nm = te ? txt(te) : "";
        if (nm && num && nm.replace(/\D/g, "") === String(+num) && nm.length < 12) nm = "";
        if (!num && !nm) return t.slice(0, 60);
        return (num ? "E" + (+num) : "") + (num && nm ? " · " : "") + nm.slice(0, 50);
      }
      [].forEach.call(d.querySelectorAll("a[href]"), function (a) {
        var u = abs(a.getAttribute("href")), t = txt(a) || a.getAttribute("title") || "";
        if (!u || !same(u) || seen[u] || u === here || a.closest("nav,header,footer")) return;
        if (!(EP.test(t) || /[-\/](episode|ep)[-\/]?\d+|[?&]e=\d+/i.test(u)) || t.length > 120) return;
        var se = null; for (var p = a; p && !se && p !== d.body; p = p.parentElement) { var ds = p.getAttribute && p.getAttribute("data-season"); var m = /season\s*(\d+)/i.exec(ds ? "season " + ds : (p.id + " " + (typeof p.className === "string" ? p.className : ""))); if (m) se = +m[1]; }
        if (!se) { var ms = /[?&]s=(\d+)/.exec(u) || /season[-_\/]?(\d+)/i.exec(u); if (ms) se = +ms[1]; }
        seen[u] = 1; eps.push({ label: epLabel(a, t) || ("Episode " + (eps.length + 1)), url: u, season: se || 1, img: a.querySelector("img") ? imgUrl(a.querySelector("img")) : "" });
      });
      var seasons = [], have = {};
      [].forEach.call(d.querySelectorAll("[data-season],button,a,li,option,[role=tab]"), function (e) {
        var t = txt(e), m = /^\s*(?:season|s)\s*0*(\d{1,3})\b[^\n]{0,20}$/i.exec(t);
        if (!m && e.getAttribute("data-season") && t.length < 20 && !e.querySelector("[data-season]") && !/episode|\bE\d/i.test(t)) m = [0, e.getAttribute("data-season")];
        if (!m || have[+m[1]] || (e.tagName === "A" && /[?&]e=|episode/i.test(e.getAttribute("href") || ""))) return;
        have[+m[1]] = 1; seasons.push({ n: +m[1], url: e.tagName === "A" ? abs(e.getAttribute("href")) : (e.tagName === "OPTION" && /^https?:|^\//.test(e.value) ? abs(e.value) : "") });
      });
      var watch = [].filter.call(d.querySelectorAll("a[href]"), function (a) { return /^(watch( now| online| movie)?|play( now)?|stream( now)?|download)$/i.test(txt(a)) && same(abs(a.getAttribute("href"))); })[0];
      return { title: title, poster: poster, desc: desc.replace(/(\s*[^.!?]*\b(free movies|watch free|movies? online|browse our|our database|download (it|now)|full hd|for free)\b[^.!?]*[.!?]?)+\s*$/i, "").slice(0, 700), facts: facts, eps: eps.slice(0, 800), seasons: seasons.length > 1 ? seasons : [], watch: watch ? abs(watch.getAttribute("href")) : "", febbox: febbox(), more: cards().slice(0, 30) };
    }
    return { cards: cards, rows: rows, searchTpl: searchTpl, navLinks: navLinks, hop: hop, detail: detail, febbox: febbox,
      name: function () { return og("og:site_name") || (d.title || "").split(/[|\-–—:]/)[0].trim() || host; } };
  }

  // read(url, mode, cb): mode home | list | detail.  cb(err, result) — err "check" means the site wants its human check
  function read(url, mode, cb, hops) {
    get(url, function (html, code, final) {
      if (html == null) return cb(code ? "HTTP " + code : "offline");
      var d = parse(html, final), R = reader(d, final);
      if (isCheck(d)) return cb("check", { url: final });
      if (mode !== "detail" && (hops || 0) < 3) { var hp = R.hop(); if (hp && hp !== url) return read(hp, mode, cb, (hops || 0) + 1); }
      if (mode === "home") return cb(null, { url: final, name: R.name(), rows: R.rows(R.cards()), nav: R.navLinks(), search: R.searchTpl() });
      if (mode === "list") return cb(null, { url: final, items: R.cards(), nav: R.navLinks() });
      var det = R.detail(); det.url = final; cb(null, det);
    });
  }
  // fast scan: links that carry a title (most listing pages), with the poster near them — a few ms, no page build
  function lite(html, base) {
    var o = (/^https?:\/\/[^\/]+/.exec(base) || [""])[0], abs = function (u) { return /^https?:/.test(u) ? u : u.charAt(0) === "/" ? (u.charAt(1) === "/" ? "https:" + u : o + u) : o + "/" + u; },
      host = hostOf(base), bd0 = baseDom(host), out = [], seen = {}, re = /<a\b[^>]*?href="([^"#]+)"[^>]*?>/gi, m;
    while ((m = re.exec(html))) {
      var tag = m[0], tm = /\btitle="([^"]{2,140})"/i.exec(tag); if (!tm) continue;
      var u = abs(m[1].replace(/&amp;/g, "&")); if (!u || seen[u] || (/^https?:/.test(m[1]) && baseDom(hostOf(u)) !== bd0) || /\/(login|register|genre|country|tag|search)\b|[?&](genre|country|page)=/i.test(u)) continue;
      var seg = html.slice(Math.max(0, m.index - 700), m.index + 900), im = /<img\b[^>]*?(?:data-src|data-original|src)="([^"]+)"[^>]*>/gi, best = "", mm;
      while ((mm = im.exec(seg))) { if (!/logo|icon|avatar|sprite|default_cover|data:/i.test(mm[1])) { best = mm[1]; if (mm.index >= 700) break; } }
      if (!best) continue; seen[u] = 1;
      var t = tm[1].replace(/&amp;/g, "&").replace(/&#0?39;|&apos;/g, "'").replace(/&quot;/g, '"').trim();
      out.push({ url: u, title: t, img: abs(best.replace(/&amp;/g, "&")), meta: ((/\b(19|20)\d\d\b/.exec(u) || [""])[0]), row: "" });
    }
    return out;
  }
  // search: the site's own form first, then the usual address patterns
  function search(site, q, cb) {
    var o = new URL(site.url).origin, tpls = (site.search ? [site.search] : []).concat([o + "/search?q={q}", o + "/?s={q}", o + "/search/{q}", o + "/search?keyword={q}"]);
    tpls = tpls.filter(function (t, i) { return tpls.indexOf(t) === i; });
    var words = q.toLowerCase().split(/\s+/).filter(function (w) { return w.length > 1; });
    (function next(i) {
      if (i >= tpls.length) return cb(null, [], "");
      var qq = encodeURIComponent(q), tu = tpls[i].replace("{q}", /\/search\/\{q\}/.test(tpls[i]) ? qq.replace(/%20/g, "-") : qq);
      get(tu, function (html, code, final) {
        if (html == null) return next(i + 1);
        var r = { items: lite(html, final) };
        if (!r.items.length) { var d = parse(html, final); if (isCheck(d)) return cb("check", { url: final }); r.items = reader(d, final).cards(); }
        var cq = q.toLowerCase().replace(/[^a-z0-9]/g, ""), items = ((r && r.items) || []).filter(function (c) { var t = c.title.toLowerCase(), ct = t.replace(/[^a-z0-9]/g, ""); return ct.indexOf(cq) >= 0 || words.some(function (w) { var cw = w.replace(/[^a-z0-9]/g, ""); return cw && ct.indexOf(cw) >= 0; }); });
        if (!items.length) return next(i + 1);
        cb(null, items, tpls[i]);
      });
    })(0);
  }
  // another season of a series: its own link, else the same address with ?s=N
  function season(det, n, cb) {
    var s = (det.seasons || []).filter(function (x) { return x.n === n; })[0], u = s && s.url;
    if (!u) { var e = det.eps[0] && det.eps[0].url; if (e && /[?&]s=\d+/.test(e)) u = e.replace(/([?&]s=)\d+/, "$1" + n).replace(/([?&]e=)\d+/, "$11"); }
    if (!u) return cb([]);
    read(u, "detail", function (err, r) { cb(((r && r.eps) || []).filter(function (e) { return e.season === n; })); });
  }
  window.SR = { lite: lite, read: read, search: search, season: season, hostOf: hostOf, get: get, parse: parse, reader: reader, isCheck: isCheck };
})();
/* FebBox share for a title page: a plain febbox.com/share link on the page, or the site's own "get FebBox link"
   request found in its scripts (e.g. url:'/index/share_link', data:{id:81821,type:1}) — called the same way its button does. */
(function () {
  function shareFrom(text) { var m = /https?:\\?\/\\?\/(?:www\.)?febbox\.com\\?\/(?:share|s)\\?\/([A-Za-z0-9_\-]+)/i.exec(text || ""); return m ? m[1] : ""; }
  function findShare(pageUrl, cb) {
    SR.get(pageUrl, function (html, code, final) {
      if (html == null) return cb("", "Couldn't open the page");
      var key = shareFrom(html); if (key) return cb(key);
      var calls = [], re = /url\s*:\s*['"]([^'"]*(?:share|febbox|feb)[^'"]*)['"][\s\S]{0,300}?data\s*:\s*(\{[^}]*\})/gi, m;
      while ((m = re.exec(html))) {
        var q = [], kv = /['"]?(\w+)['"]?\s*:\s*['"]?([\w.\-]+)['"]?/g, k;
        while ((k = kv.exec(m[2]))) q.push(encodeURIComponent(k[1]) + "=" + encodeURIComponent(k[2]));
        calls.push(new URL(m[1], final).href + (m[1].indexOf("?") >= 0 ? "&" : "?") + q.join("&"));
      }
      (function next(i) {
        if (i >= calls.length) return cb("", "No FebBox link on this page");
        SR.get(calls[i], function (t) { var k2 = shareFrom(t); if (k2) cb(k2); else next(i + 1); });
      })(0);
    });
  }
  // saving = what FebBox's own "Accept Collaboration" does: open the console with the share id while signed in
  // what FebBox's own share page does: look the share up, then "Accept / Save" it into the top of your FebBox
  function fbj(path, cb) { var x = new XMLHttpRequest(); x.open("GET", "https://www.febbox.com" + path, true); x.withCredentials = false; x.timeout = 20000;
    x.setRequestHeader("X-Requested-With", "XMLHttpRequest");
    x.onload = function () { var j = null; try { j = JSON.parse(x.responseText); } catch (e) {} cb(j); }; x.onerror = x.ontimeout = function () { cb(null); }; x.send(); }
  function saveShare(key, cb) {
    fbj("/console/file_share_query?key=" + encodeURIComponent(key) + "&pwd=", function (q) {
      if (!q || q.code !== 1) return cb(false, (q && q.msg) || "FebBox couldn't open the share");
      var f = q.share_file || {}, ids = f.fid || f.fids || f.file_ids || [];
      if (!Array.isArray(ids)) ids = String(ids).split(",").filter(Boolean);
      fbj("/console/file_share_save?key=" + encodeURIComponent(q.key || key) + "&pwd=" + encodeURIComponent(q.pwd || "") + "&parent_id=0&fids=" + encodeURIComponent(JSON.stringify(ids)), function (r) {
        if (r && r.code === 1) return cb(true, "", f.file_name || "");
        cb(false, (r && r.msg) || "FebBox didn't save it", f.file_name || "");
      });
    });
  }
  SR.findShare = findShare; SR.saveShare = saveShare; SR.shareFrom = shareFrom;
})();
