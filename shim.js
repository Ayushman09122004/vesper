/* Vesper for iPhone — stands in for the Mac app's native bridge.
   Saves your lists on the phone, fetches through the browser (JustWatch via the optional proxy), and opens each service's own app. */
(function (G) {
  "use strict";
  var KEY = "vesper.state.v1";
  // optional helper for episode lists (JustWatch blocks direct calls from browsers). Set in config.js.
  var PROXY = (G.VESPER_CONFIG || {}).proxy || "";
  var JW = "https://apis.justwatch.com/graphql";

  function load() { try { return JSON.parse(localStorage.getItem(KEY) || "{}") || {}; } catch (e) { return {}; } }
  var state = load();
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} }

  G.vesperFetch = function (url, opt) {
    opt = opt || {};
    if (url === JW) {
      if (!PROXY) return Promise.reject(new Error("no proxy"));
      url = PROXY.replace(/\/$/, "") + "/jw";
    }
    return fetch(url, { method: opt.method || "GET", body: opt.body, headers: opt.body ? { "content-type": "application/json" } : undefined })
      .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); });
  };
  G.vesperHasProxy = !!PROXY;
  // wake the free helper early, so episodes are ready by the time you open a show
  if (PROXY) setTimeout(function () { fetch(PROXY.replace(/\/$/, "") + "/ping").catch(function () {}); }, 400);

  // ---------- opening the real apps ----------
  function gtiOf(u) { var m = (u || "").match(/(amzn1\.dv\.gti\.[\w-]+)/); return m ? m[1] : null; }
  // the service's own app link (custom scheme) and its web link as a fallback
  function links(app, url) {
    var web = (url || "").replace(/^http:/, "https:"), m;
    if (app === "netflix") {
      m = web.match(/netflix\.com\/(?:[a-z-]+\/)?(?:watch|title)\/(\d+)/);
      if (m) { var kind = /\/watch\//.test(web) ? "watch" : "title"; return { app: "nflx://www.netflix.com/" + kind + "/" + m[1], web: "https://www.netflix.com/" + kind + "/" + m[1] }; }
      return { app: "nflx://", web: web || "https://www.netflix.com/" };
    }
    if (app === "amazon") { var g = gtiOf(web); return g ? { app: "aiv://aiv/detail?gti=" + g + "&action=detail", web: "https://app.primevideo.com/detail?gti=" + g } : { app: "aiv://", web: web || "https://www.primevideo.com/" }; }
    return { app: null, web: web };
  }
  function openUrl(u) { var a = document.createElement("a"); a.href = u; a.rel = "noopener"; document.body.appendChild(a); a.click(); a.remove(); }
  function openService(app, url) {
    var L = links(app, url);
    if (!L.app) return openUrl(L.web);
    var left = false;
    function gone() { if (document.hidden) left = true; }
    document.addEventListener("visibilitychange", gone);
    openUrl(L.app);
    setTimeout(function () { document.removeEventListener("visibilitychange", gone); if (!left && !document.hidden) openUrl(L.web); }, 1600);
  }
  G.vesperOpen = openService;

  // the same calls the Mac app answers
  G.V = {
    call: function (name, a) {
      a = a || {};
      switch (name) {
        case "stateAll": return Promise.resolve(state);
        case "stateSet": state[a.k] = a.v; save(); return Promise.resolve(true);
        case "play": openService(a.app, a.url); return Promise.resolve(true);
        case "netflixMeta": return Promise.reject(new Error("not on iPhone"));
        default: return Promise.resolve(null);
      }
    }
  };
  G.vesperState = state;
})(window);
