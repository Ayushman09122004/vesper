/* Vesper — wider search: who a name is (actor, director, studio, network) and everything they made, straight from Wikidata
   (free, no key, answers web pages). Filmographies are remembered for a week. window.VSEEK = { find, works } */
(function () {
  var LS = window.localStorage;
  function ld(k) { try { return JSON.parse(LS.getItem("vesper.wd." + k)); } catch (e) { return null; } }
  function sv(k, v) {
    try { LS.setItem("vesper.wd." + k, JSON.stringify(v)); } catch (e) {   // storage full: forget old filmographies, try once more
      try { Object.keys(LS).filter(function (x) { return x.indexOf("vesper.wd.w.") === 0; }).forEach(function (x) { LS.removeItem(x); }); LS.setItem("vesper.wd." + k, JSON.stringify(v)); } catch (e2) {} }
  }
  function xhr(url, ms, cb) {
    var x = new XMLHttpRequest(); x.open("GET", url, true); x.timeout = ms;
    x.onload = function () { var j = null; try { j = JSON.parse(x.responseText); } catch (e) {} cb(x.status < 400 ? j : null); };
    x.onerror = x.ontimeout = function () { cb(null); }; x.send();
  }

  // ---- who is it? ("tom cr" → Tom Cruise · American actor; "a24" → A24 · entertainment company) ----
  var STUDIO = /\b(company|studio|studios|network|broadcaster|distributor|channel|streaming service|conglomerate|production house|film label|banner)\b/i;
  var PERSON = /\b(actor|actress|director|filmmaker|comedian|screenwriter|producer|presenter|singer|rapper|musician|model|entertainer|personality|stuntman|animator|cinematographer|idol|host|youtuber)\b/i;
  var NOT = /filmography|list of|album|\bsong\b|single by|episode|motorway|\broad\b|character|novel|\bbook\b|award|portrait|video game|family name|given name|disambiguation/i;
  var FIND = {};
  function find(q, cb) {
    var k = (q || "").toLowerCase().trim(); if (k.length < 2) return cb([]);
    if (FIND[k]) return cb(FIND[k]);
    xhr("https://www.wikidata.org/w/api.php?action=wbsearchentities&format=json&origin=*&language=en&uselang=en&type=item&limit=12&search=" + encodeURIComponent(q), 8000, function (j) {
      var out = [];
      ((j && j.search) || []).forEach(function (r) {
        var d = r.description || ""; if (!d || NOT.test(d)) return;
        var kind = STUDIO.test(d) && !/\b(actor|actress)\b/i.test(d) ? "studio" : PERSON.test(d) ? "person" : "";
        if (kind) out.push({ id: r.id, name: r.label || q, desc: d, kind: kind });
      });
      if (j) FIND[k] = out; cb(out);
    });
  }

  // ---- everything they made: films + series, with year, fame (Wikipedia languages), IMDb id, and whether they directed it ----
  var MT = { Q11424: 1, Q506240: 1, Q202866: 1, Q29168811: 1, Q93204: 1, Q18011172: 1, Q226730: 1, Q24869: 1, Q17517379: 1, Q110039749: 1, Q130232: 1 };
  var ST = { Q5398426: 1, Q15416: 1, Q526877: 1, Q1259759: 1, Q581714: 1, Q63952888: 1, Q1366112: 1, Q117467246: 1, Q7725310: 1, Q21664088: 0 };
  var BUSY = {};
  function works(id, kind, cb) {
    var c = ld("w." + id); if (c && c.list && Date.now() - c.at < 7 * 864e5) return cb(c.list);
    if (BUSY[id]) return BUSY[id].push(cb); BUSY[id] = [cb];
    var Q = "wd:" + id, rel = kind === "studio" ? "{ ?w wdt:P272|wdt:P750|wdt:P449 " + Q + " }"
      : "{ ?w wdt:P161|wdt:P725 " + Q + " } UNION { ?w wdt:P57 " + Q + " . BIND(1 AS ?dr) }";
    var sparql = "SELECT ?w (SAMPLE(?l) AS ?t) (MIN(YEAR(?d)) AS ?y) (GROUP_CONCAT(DISTINCT STRAFTER(STR(?c),'entity/');separator=' ') AS ?cs) " +
      "(SAMPLE(?sl) AS ?s) (MAX(?dr) AS ?isd) (SAMPLE(?im) AS ?imdb) WHERE { hint:Query hint:optimizer 'None' . " + rel +
      " ?w wdt:P31 ?c . OPTIONAL { ?w rdfs:label ?l . FILTER(LANG(?l) IN ('en','mul')) } OPTIONAL { ?w wdt:P577|wdt:P580 ?d }" +
      " OPTIONAL { ?w wikibase:sitelinks ?sl } OPTIONAL { ?w wdt:P345 ?im } } GROUP BY ?w";
    xhr("https://query.wikidata.org/sparql?format=json&query=" + encodeURIComponent(sparql), 25000, function (j) {
      var seen = {}, list = [];
      (((j && j.results) || {}).bindings || []).forEach(function (b) {
        var cs = (b.cs && b.cs.value || "").split(" "), type = cs.some(function (x) { return ST[x]; }) ? "SHOW" : cs.some(function (x) { return MT[x]; }) ? "MOVIE" : null;
        var t = b.t && b.t.value; if (!type || !t || /^Q\d+$/.test(t)) return;
        var y = b.y ? +b.y.value || 0 : 0, k = t.toLowerCase() + "|" + y; if (seen[k]) return; seen[k] = 1;
        list.push({ t: t, y: y, type: type, f: b.s ? +b.s.value || 0 : 0, d: b.isd ? 1 : 0, imdb: b.imdb ? b.imdb.value : "" });
      });
      list.sort(function (a, b) { return b.f - a.f; });
      if (j) sv("w." + id, { at: Date.now(), list: list });
      var w = BUSY[id]; delete BUSY[id]; w.forEach(function (f) { f(j ? list : null); });
    });
  }

  window.VSEEK = { find: find, works: works };
})();
