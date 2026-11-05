/* Vesper for Mac — catalog engine. Builds the whole catalog straight from JustWatch (India region,
   subscription-only, quality-filtered) with Originals, Top 10, new arrivals, coming-soon dates and a people index.
   Network calls go through the app (window.vesperFetch) because JustWatch sends no CORS headers. */
(function (G) {
  "use strict";
  var ENDPOINT = "https://apis.justwatch.com/graphql";
  // JustWatch package -> TV app. "with ads"/kids variants fold into the same service.
  var FAMILY = { nfx: "netflix", nfk: "netflix", nfa: "netflix", prv: "amazon", pva: "amazon", amp: "amazon",
    jhs: "hotstar", hst: "hotstar", atp: "com.apple.appletv", cru: "com.crunchyroll.webapp" };
  var OURS = ["nfx", "prv", "jhs", "atp", "cru"];
  var SUBS = ["FLATRATE", "FREE", "ADS"];

  var FIELDS = "id objectType\n" +
    " ... on Show { totalSeasonCount seasons { totalEpisodeCount } }\n" +
    " content(country:IN,language:\"en\"){ title originalReleaseYear shortDescription posterUrl runtime ageCertification productionCountries" +
    "  backdrops{backdropUrl} genres{shortName} scoring{imdbScore imdbVotes tmdbPopularity} credits{role name} externalIds{imdbId} }\n" +
    " popularityRank(country:IN){ rank trend }\n" +
    " offers(country:IN,platform:WEB){ monetizationType standardWebURL package{shortName} }";
  var Q_SEG = "query Seg($first:Int!,$after:String,$filter:TitleFilter,$sortBy:PopularTitlesSorting!){" +
    " popularTitles(country:IN,first:$first,after:$after,sortBy:$sortBy,filter:$filter){ pageInfo{endCursor hasNextPage} edges{node{ " + FIELDS + " }} } }";
  var Q_NEW = "query New($date:Date!,$first:Int!,$filter:TitleFilter){ newTitles(country:IN,date:$date,first:$first,filter:$filter){ edges{" +
    " newOffer(platform:WEB){ monetizationType package{shortName} }" +
    " node{ __typename ... on MovieOrShow{ " + FIELDS + " } ... on Season{ content(country:IN,language:\"en\"){seasonNumber} show{ " + FIELDS + " } } } } } }";
  var Q_SOON = "query Soon($first:Int!,$after:String,$filter:TitleFilter){ popularTitles(country:IN,first:$first,after:$after,sortBy:POPULAR,filter:$filter){" +
    " pageInfo{endCursor hasNextPage} edges{node{ " + FIELDS + " content(country:IN,language:\"en\"){ upcomingReleases{ releaseDate releaseType package{shortName} } } }} } }";

  // Hand-picked weather library (title|year|moods). Moods: r rainy & gloomy · c cold & wet · f foggy & mysterious ·
  // s snowy noir · m magic for grey days · v dark romance & vampires · t stormy gothic · n rain-soaked city noir · a rainy anime.
  // Only titles streaming on your apps make it in; the app tops each mood up with smart matching.
  var WX_SEEDS = "Dark|2017|rf;1899|2022|fc;Broadchurch|2013|rfc;A Good Girl's Guide to Murder|2024|rf;Sherlock|2010|rn;Twin Peaks|1990|f;The Killing|2011|rfc;The Bridge|2011|cs;Trapped|2015|cs;Fortitude|2015|cs;Cardinal|2017|cs;Fargo|2014|s;True Detective|2014|fn;Mindhunter|2017|rn;Sharp Objects|2018|f;Mare of Easttown|2021|rfc;The Sinner|2017|f;Top of the Lake|2013|fc;Happy Valley|2014|rc;Luther|2010|rn;Marcella|2016|rn;The Fall|2013|rn;Shetland|2013|cf;Vera|2011|cf;Peaky Blinders|2013|rn;Ripper Street|2012|rn;Penny Dreadful|2014|tv;The Haunting of Hill House|2018|t;The Haunting of Bly Manor|2020|tv;Midnight Mass|2021|tf;The Fall of the House of Usher|2023|t;Stranger Things|2016|f;Wednesday|2022|mt;Chilling Adventures of Sabrina|2018|mt;Shadow and Bone|2021|m;His Dark Materials|2019|mc;The Witcher|2019|m;Locke & Key|2020|m;A Discovery of Witches|2018|mv;The Vampire Diaries|2009|v;The Originals|2013|v;Interview with the Vampire|2022|v;Outlander|2014|vc;Poldark|2015|v;Jane Eyre|2006|v;The Returned|2012|f;Marianne|2019|t;Babylon Berlin|2017|n;Ragnarok|2020|cm;Kingdom|2019|t;Signal|2016|rf;Stranger|2017|rn;Mouse|2021|rn;Beyond Evil|2021|f;Through the Darkness|2022|n;The Guest|2018|t;Sweet Home|2020|t;Hellbound|2021|t;Monster|2004|af;Death Note|2006|an;Erased|2016|acs;Mushishi|2005|af;Psycho-Pass|2012|an;Tokyo Ghoul|2014|an;Vinland Saga|2019|ac;Ghost in the Shell: Stand Alone Complex|2002|an;Kohrra|2023|rfc;Paatal Lok|2020|rn;Asur|2020|rn;Delhi Crime|2019|rn;Aranyak|2021|fc;Kaala Paani|2023|r;The Night Of|2016|rn;Bodies|2023|rn;Slow Horses|2022|rn;Line of Duty|2012|n;Black Mirror|2011|f;The Rain|2018|rc;Black Spot|2017|fc;The Woods|2020|f;The Valhalla Murders|2019|cs;Katla|2021|cf;The Missing|2014|rfc;Ozark|2017|f;Yellowjackets|2021|cs;The Terror|2018|cs;Severance|2022|c;Silo|2023|f;The Leftovers|2014|rf;Castle Rock|2018|f;Hannibal|2013|nv;Bates Motel|2013|f;Riverdale|2017|fv;Pretty Little Liars|2010|f;You|2018|n;Gotham|2014|n;Daredevil|2015|n;Arcane|2021|n;Unbelievable|2019|r;Sherwood|2022|c;Bloodlands|2021|rc;Lupin|2021|n;The Chestnut Man|2021|rcs;Borderliner|2017|cf;Deadwind|2018|cs;Bordertown|2016|cs;Wisting|2019|cs;Dead Wind|2018|cs;Perfume|2018|n;The Invisible Guardian|2017|rf;Prisoners|2013|rcf;Se7en|1995|rn;Zodiac|2007|rn;Gone Girl|2014|f;Shutter Island|2010|rt;Mystic River|2003|r;The Batman|2022|rn;Blade Runner|1982|rn;Blade Runner 2049|2017|rn;Memories of Murder|2003|rf;The Wailing|2016|rt;Parasite|2019|r;Burning|2018|f;A Tale of Two Sisters|2003|t;Oldboy|2003|n;I Saw the Devil|2010|cn;The Others|2001|ft;The Woman in Black|2012|ft;Crimson Peak|2015|tv;Rebecca|2020|vf;Pride & Prejudice|2005|rv;Jane Eyre|2011|rv;Wuthering Heights|2011|vc;Atonement|2007|rv;The Notebook|2004|rv;Midnight in Paris|2011|r;About Time|2013|r;Little Women|2019|c;Harry Potter and the Philosopher's Stone|2001|m;Harry Potter and the Chamber of Secrets|2002|m;Harry Potter and the Prisoner of Azkaban|2004|mrc;Harry Potter and the Goblet of Fire|2005|m;Harry Potter and the Order of the Phoenix|2007|mr;Harry Potter and the Half-Blood Prince|2009|mr;Harry Potter and the Deathly Hallows: Part 1|2010|mrc;Harry Potter and the Deathly Hallows: Part 2|2011|mr;Fantastic Beasts and Where to Find Them|2016|m;The Chronicles of Narnia: The Lion, the Witch and the Wardrobe|2005|ms;Coraline|2009|mt;Corpse Bride|2005|mv;Sleepy Hollow|1999|tf;Edward Scissorhands|1990|vs;The Prestige|2006|n;Interview with the Vampire|1994|v;Twilight|2008|rvf;The Twilight Saga: New Moon|2009|rv;Let the Right One In|2008|vs;Only Lovers Left Alive|2013|v;Nosferatu|2024|tv;Bram Stoker's Dracula|1992|tv;The Lighthouse|2019|tc;The Witch|2015|t;Hereditary|2018|t;The Conjuring|2013|t;The Shining|1980|st;Fargo|1996|s;Wind River|2017|s;The Revenant|2015|s;The Hateful Eight|2015|s;The Thing|1982|s;Insomnia|2002|f;The Girl with the Dragon Tattoo|2011|s;Snowpiercer|2013|s;The Body|2012|rn;Perfume: The Story of a Murderer|2006|n;Nightcrawler|2014|n;Taxi Driver|1976|n;Collateral|2004|n;Enemy|2013|f;Tumbbad|2018|rt;Bulbbul|2020|tv;Talaash|2012|rn;Andhadhun|2018|n;Drishyam|2015|r;Kahaani|2012|n;Raman Raghav 2.0|2016|rn;Ugly|2013|n;Badla|2019|cf;Ratsasan|2018|n;Kumbalangi Nights|2019|r;Bramayugam|2024|rt;Bhoothakaalam|2022|t;The Garden of Words|2013|ar;Weathering with You|2019|ar;Your Name.|2016|a;Spirited Away|2001|am;Howl's Moving Castle|2004|am;Princess Mononoke|1997|a;Grave of the Fireflies|1988|a;A Silent Voice|2016|ar;Perfect Blue|1997|an;Akira|1988|an;Ghost in the Shell|1995|an;Wolf Children|2012|a;Joker|2019|n;The Dark Knight|2008|n;Sin City|2005|n;Inception|2010|n;Memento|2000|n;Gone Baby Gone|2007|rc;The Girl on the Train|2016|r;Knives Out|2019|c;Murder on the Orient Express|2017|s;Enola Holmes|2020|rm;Sherlock Holmes|2009|rn;The Ring|2002|rt;Dark Water|2002|rt;Arrival|2016|f;Children of Men|2006|rc;Never Let Me Go|2010|rv;Manchester by the Sea|2016|c;The Silence of the Lambs|1991|n;Lamb|2021|cf;The Hunt|2012|cs;Headhunters|2011|cs;In Order of Disappearance|2014|s;Department Q|2025|rcs;The Snowman|2017|s";

  // key, label, filter, count, sort, minVotes
  function segments(year) {
    return [
      ["trend", "Trending in India", {}, 300, "POPULAR", 0],
      ["movies", "Popular Movies", { objectTypes: ["MOVIE"] }, 300, "POPULAR", 2000],
      ["shows", "Popular Shows", { objectTypes: ["SHOW"] }, 300, "POPULAR", 800],
      ["new", "New Releases", { releaseYear: { min: year - 1 } }, 250, "POPULAR", 0],
      ["acc_m", "Critically Acclaimed Films", { objectTypes: ["MOVIE"], imdbScore: { min: 7.8 } }, 300, "IMDB_SCORE", 30000],
      ["acc_s", "Critically Acclaimed Series", { objectTypes: ["SHOW"], imdbScore: { min: 8.0 } }, 250, "IMDB_SCORE", 12000],
      ["us_m", "Hollywood", { objectTypes: ["MOVIE"], productionCountries: ["US"] }, 300, "POPULAR", 5000],
      ["us_s", "American Series", { objectTypes: ["SHOW"], productionCountries: ["US"] }, 250, "POPULAR", 3000],
      ["gb_m", "British Films", { objectTypes: ["MOVIE"], productionCountries: ["GB"] }, 120, "POPULAR", 3000],
      ["gb_s", "British Series", { objectTypes: ["SHOW"], productionCountries: ["GB"] }, 150, "POPULAR", 1500],
      ["kr_s", "K-Dramas", { objectTypes: ["SHOW"], productionCountries: ["KR"] }, 220, "POPULAR", 300],
      ["kr_m", "Korean Films", { objectTypes: ["MOVIE"], productionCountries: ["KR"] }, 140, "POPULAR", 1500],
      ["ani_s", "Anime Series", { objectTypes: ["SHOW"], genres: ["ani"], productionCountries: ["JP"] }, 220, "POPULAR", 500],
      ["ani_m", "Anime Films", { objectTypes: ["MOVIE"], genres: ["ani"], productionCountries: ["JP"] }, 90, "POPULAR", 1500],
      ["in_m", "Indian Films", { objectTypes: ["MOVIE"], productionCountries: ["IN"] }, 250, "POPULAR", 400],
      ["in_s", "Indian Series", { objectTypes: ["SHOW"], productionCountries: ["IN"] }, 180, "POPULAR", 300],
      ["world_m", "World Cinema", { objectTypes: ["MOVIE"], excludeProductionCountries: ["IN", "US", "GB", "KR", "JP"] }, 160, "POPULAR", 3000],
      ["world_s", "International Series", { objectTypes: ["SHOW"], excludeProductionCountries: ["IN", "US", "GB", "KR", "JP"] }, 140, "POPULAR", 1000],
      ["us_e05", "American Films 2005–2009", { objectTypes: ["MOVIE"], productionCountries: ["US"], releaseYear: { min: 2005, max: 2009 } }, 300, "POPULAR", 15000],
      ["us_e10", "American Films 2010–2014", { objectTypes: ["MOVIE"], productionCountries: ["US"], releaseYear: { min: 2010, max: 2014 } }, 300, "POPULAR", 15000],
      ["us_e15", "American Films 2015–2019", { objectTypes: ["MOVIE"], productionCountries: ["US"], releaseYear: { min: 2015, max: 2019 } }, 300, "POPULAR", 15000],
      ["jp_live", "Japanese Live-Action", { productionCountries: ["JP"], excludeGenres: ["ani"] }, 80, "POPULAR", 1000],
      ["kids", "Kids & Family", { genres: ["fml"] }, 160, "POPULAR", 1000],
      ["docs", "Documentaries", { genres: ["doc"] }, 120, "POPULAR", 1500],
      ["app_netflix", "On Netflix", { packages: ["nfx"] }, 300, "POPULAR", 800],
      ["app_amazon", "On Prime Video", { packages: ["prv"] }, 300, "POPULAR", 800],
      ["app_hotstar", "On JioHotstar", { packages: ["jhs"] }, 300, "POPULAR", 500],
      ["app_com.apple.appletv", "On Apple TV+", { packages: ["atp"] }, 150, "POPULAR", 500],
      ["app_com.crunchyroll.webapp", "On Crunchyroll", { packages: ["cru"] }, 300, "POPULAR", 200]
    ];
  }

  function deepId(app, url) {
    if (!url) return null; var m;
    if (app === "netflix") { m = url.match(/\/title\/(\d+)/); return m ? m[1] : null; }
    if (app === "amazon") { m = url.match(/gti=([^&]+)/) || url.match(/(amzn1\.dv\.gti\.[\w-]+)/); return m ? decodeURIComponent(m[1]) : null; }
    if (app === "hotstar") { m = url.match(/\/(\d{6,})(?:[/?#]|$)/); return m ? m[1] : null; }
    if (app === "com.apple.appletv") { m = url.match(/(umc\.cmc\.[a-z0-9]+)/i); return m ? m[1] : null; }
    if (app === "com.crunchyroll.webapp") { m = url.match(/crunchyroll\.com\/(?:[a-z-]+\/)?(watch|series)\/([A-Z0-9]+)/i); return m ? m[1] + "/" + m[2] : null; }
    return null;
  }
  function path(p) { return p ? p.replace("{format}", "jpg") : null; }

  // one JustWatch node -> Vesper title (allowEmpty keeps titles not yet streaming, for "Coming Soon")
  function mapNode(n, allowEmpty) {
    var c = n && n.content || {}; if (!c.title) return null;
    var apps = {}, links = {};
    (n.offers || []).forEach(function (o) {
      var app = FAMILY[o.package && o.package.shortName]; if (!app || SUBS.indexOf(o.monetizationType) < 0) return;
      apps[app] = 1; var id = deepId(app, o.standardWebURL);
      if (!links[app] || (!links[app].id && id)) links[app] = { id: id, url: o.standardWebURL || null };
    });
    var avail = Object.keys(apps), b = c.backdrops && c.backdrops[0] && path(c.backdrops[0].backdropUrl);
    if ((!avail.length && !allowEmpty) || !b) return null;
    var cast = [], dirs = [];
    (c.credits || []).forEach(function (cr) { if (cr.role === "ACTOR" && cast.length < 6) cast.push(cr.name); else if (cr.role === "DIRECTOR" && dirs.length < 3) dirs.push(cr.name); });
    var s = c.scoring || {}, eps = 0;
    (n.seasons || []).forEach(function (se) { eps += se.totalEpisodeCount || 0; });
    return { id: n.id, type: n.objectType, title: c.title, year: c.originalReleaseYear || null,
      desc: (c.shortDescription || "").slice(0, 320), imdb: s.imdbScore != null ? s.imdbScore : null, votes: s.imdbVotes || 0,
      pop: +(s.tmdbPopularity || 0).toFixed(2), rank: n.popularityRank && n.popularityRank.rank || null, trend: n.popularityRank && n.popularityRank.trend || null,
      genres: (c.genres || []).map(function (g) { return g.shortName; }).slice(0, 5), countries: (c.productionCountries || []).slice(0, 3),
      runtime: c.runtime || null, cert: c.ageCertification || null, seasons: n.totalSeasonCount || null, eps: eps || null,
      cast: cast, dirs: dirs, imdb_id: (c.externalIds || {}).imdbId || null, poster: path(c.posterUrl), backdrop: b, avail: avail, links: links, segs: [] };
  }
  function decent(t, minVotes) { return (t.votes >= minVotes && (t.imdb || 0) >= 5.5) || (t.rank && t.rank <= 300); }
  function ymd(d) { return d.toISOString().slice(0, 10); }

  async function gql(query, variables, opts) {
    for (var i = 0; i < 3; i++) {
      if (opts && opts.pause) await opts.pause();
      try {
        var j = await G.vesperFetch(ENDPOINT, { method: "POST", body: JSON.stringify({ query: query, variables: variables }) }); if (j.errors) throw new Error(j.errors[0].message); return j.data;
      } catch (e) { if (i === 2) throw e; await new Promise(function (res) { setTimeout(res, 1200 * (i + 1)); }); }
    }
  }

  /* build({prev, onProgress, pause}) -> catalog
     prev: the previous catalog (keeps Originals flags so only new titles need checking) */
  async function build(opts) {
    opts = opts || {};
    var now = new Date(), year = now.getFullYear(), titles = {}, segs = {}, SEGS = segments(year);
    var steps = SEGS.length + 10, done = 0;
    function tick(label) { done++; if (opts.onProgress) opts.onProgress(Math.min(1, done / steps), label); }
    function add(n, allowEmpty) { if (!n) return null; if (titles[n.id]) return titles[n.id]; var t = mapNode(n, allowEmpty); if (t) titles[n.id] = t; return t; }

    // 1) the sections
    for (var s = 0; s < SEGS.length; s++) {
      var S = SEGS[s], filter = Object.assign({ packages: OURS, monetizationTypes: SUBS }, S[2]), after = null, nodes = [];
      while (nodes.length < S[3]) {
        var d = await gql(Q_SEG, { first: Math.min(100, S[3] - nodes.length), after: after, filter: filter, sortBy: S[4] }, opts);
        var pt = d.popularTitles; nodes = nodes.concat(pt.edges.map(function (e) { return e.node; }));
        if (!pt.pageInfo.hasNextPage) break; after = pt.pageInfo.endCursor;
      }
      var ids = [];
      nodes.forEach(function (n) { var t = add(n); if (t && decent(t, S[5]) && ids.indexOf(t.id) < 0) { ids.push(t.id); t.segs.push(S[0]); } });
      segs[S[0]] = { label: S[1], ids: ids };
      tick(S[1]);
    }

    // 2) new on your apps — the last 7 days, incl. new seasons
    var arrivals = [], seenArr = {};
    for (var k = 0; k < 7; k++) {
      var day = new Date(now.getTime() - k * 864e5);
      try {
        var nd = await gql(Q_NEW, { date: ymd(day), first: 100, filter: { packages: OURS, monetizationTypes: SUBS } }, opts);
        nd.newTitles.edges.forEach(function (e) {
          var node = e.node || {}, isSeason = node.__typename === "Season", base = isSeason ? node.show : node, t = add(base);
          var app = FAMILY[e.newOffer && e.newOffer.package && e.newOffer.package.shortName];
          if (!t || !app) return;
          var sn = isSeason && node.content ? node.content.seasonNumber : null, key = t.id + "|" + sn;
          if (seenArr[key]) return; seenArr[key] = 1;
          if (t.segs.indexOf("arr") < 0) t.segs.push("arr");
          arrivals.push({ id: t.id, app: app, season: sn, date: ymd(day) });
        });
      } catch (err) { /* one bad day shouldn't sink the refresh */ }
    }
    tick("New arrivals");

    // 3) coming soon — announced release dates on your apps
    var soon = [], after2 = null;
    for (var p = 0; p < 2; p++) {
      try {
        var sd = await gql(Q_SOON, { first: 100, after: after2, filter: {} }, opts);
        sd.popularTitles.edges.forEach(function (e) {
          var n = e.node, ups = (n.content && n.content.upcomingReleases || []).filter(function (u) { return FAMILY[u.package && u.package.shortName] && u.releaseDate >= ymd(now); });
          if (!ups.length) return;
          ups.sort(function (a, b) { return a.releaseDate < b.releaseDate ? -1 : 1; });
          var t = add(n, true); if (!t) return;
          if (t.segs.indexOf("soon") < 0) t.segs.push("soon");
          soon.push({ id: t.id, app: FAMILY[ups[0].package.shortName], date: ups[0].releaseDate });
        });
        if (!sd.popularTitles.pageInfo.hasNextPage) break; after2 = sd.popularTitles.pageInfo.endCursor;
      } catch (err) { break; }
    }
    tick("Coming soon");

    // 4) the weather library — 20 searches per request
    var wx = {}, seeds = WX_SEEDS.split(";").map(function (x) { var p = x.split("|"); return { t: p[0], y: +p[1], k: p[2] }; });
    for (var w = 0; w < seeds.length; w += 20) {
      var batch = seeds.slice(w, w + 20);
      var wq = "{" + batch.map(function (sd, j) { return "s" + j + ":popularTitles(country:IN,first:4,filter:{searchQuery:" + JSON.stringify(sd.t) + "}){edges{node{ " + FIELDS + " }}}"; }).join(" ") + "}";
      try {
        var wd = await gql(wq, {}, opts);
        batch.forEach(function (sd, j) {
          var edges = (wd["s" + j] || {}).edges || [], hit = null;
          edges.forEach(function (e) { var c = e.node.content || {}; if (!hit && c.originalReleaseYear && Math.abs(c.originalReleaseYear - sd.y) <= 1) hit = e.node; });
          var t = add(hit); if (!t) return;
          if (t.segs.indexOf("wx") < 0) t.segs.push("wx");
          sd.k.split("").forEach(function (k) { (wx[k] = wx[k] || []).indexOf(t.id) < 0 && wx[k].push(t.id); });
        });
      } catch (err) { /* skip this batch */ }
    }
    tick("Weather library");

    var list = Object.keys(titles).map(function (id) { return titles[id]; }).filter(function (t) { return t.segs.length; });

    // 4) Originals: streaming on exactly one service across India, US and UK (only new titles are checked)
    var prevOrig = {}, prevChecked = {};
    if (opts.prev && opts.prev.titles) opts.prev.titles.forEach(function (t) { prevChecked[t.id] = 1; if (t.orig) prevOrig[t.id] = t.orig; });
    list.forEach(function (t) { if (prevOrig[t.id]) t.orig = prevOrig[t.id]; });
    var cand = list.filter(function (t) { return t.avail.length === 1 && !prevChecked[t.id] && t.avail[0] !== "com.crunchyroll.webapp"; });
    var OFF = "us:offers(country:US,platform:WEB){monetizationType package{shortName}} gb:offers(country:GB,platform:WEB){monetizationType package{shortName}}";
    for (var i = 0; i < cand.length; i += 40) {
      var chunk = cand.slice(i, i + 40);
      var q = "{" + chunk.map(function (t, j) { return "t" + j + ":node(id:\"" + t.id + "\"){... on MovieOrShow{" + OFF + "}}"; }).join(" ") + "}";
      try {
        var od = await gql(q, {}, opts);
        chunk.forEach(function (t, j) {
          var n = od["t" + j]; if (!n) return;
          var fam = {}, nf = 1, foreign = 0; fam[t.avail[0]] = 1;
          (n.us || []).concat(n.gb || []).forEach(function (o) {
            if (SUBS.indexOf(o.monetizationType) < 0) return; foreign++;
            var f = FAMILY[o.package && o.package.shortName] || ("other:" + (o.package && o.package.shortName));
            if (!fam[f]) { fam[f] = 1; nf++; }
          });
          if (nf === 1 && (t.avail[0] === "com.apple.appletv" || foreign > 0 || t.avail[0] === "hotstar")) t.orig = t.avail[0];
        });
      } catch (err) { /* skip this chunk */ }
    }
    list.forEach(function (t) {
      if (t.orig === "netflix" && !(+((t.links.netflix || {}).id || 0) >= 80000000)) delete t.orig;  // licensed shows have older ids
      if (t.orig === "hotstar" && t.countries.indexOf("IN") < 0) delete t.orig;                        // imports are just exclusives
      if (!t.orig && t.avail.indexOf("com.apple.appletv") >= 0) t.orig = "com.apple.appletv";          // Apple TV+ is all Originals
    });
    tick("Originals");

    // 5) Top 10, people index, done
    function top10(type) { return list.filter(function (t) { return t.type === type && t.rank && t.avail.length; }).sort(function (a, b) { return a.rank - b.rank; }).slice(0, 10).map(function (t) { return t.id; }); }
    var pm = {};
    list.forEach(function (t) { t.cast.concat(t.dirs).forEach(function (nm) { var o = pm[nm] || (pm[nm] = [nm, 0, 0]); o[1]++; o[2] += t.pop || 0; }); });
    var people = Object.keys(pm).map(function (nm) { var o = pm[nm]; o[2] = Math.round(o[2]); return o; }).filter(function (o) { return o[1] >= 2; });
    var catalog = { v: 4, generated: now.toISOString(), year: year,
      titles: list.map(function (t) { var o = Object.assign({}, t); delete o.segs; return o; }),
      segs: segs, top10: { shows: top10("SHOW"), movies: top10("MOVIE") }, people: people,
      arrivals: arrivals, soon: soon.sort(function (a, b) { return a.date < b.date ? -1 : 1; }), wx: wx };
    tick("Done");
    return catalog;
  }

  G.VesperCore = { build: build, FAMILY: FAMILY, OURS: OURS, deepId: deepId, mapNode: mapNode };
})(typeof window !== "undefined" ? window : globalThis);
