// Tiny helper for Vesper for iPhone: passes episode-list requests to JustWatch (which blocks browsers) and adds CORS.
const http = require("http");
const ALLOW = process.env.ALLOW_ORIGIN || "https://ayushman09122004.github.io";
http.createServer(async (req, res) => {
  const origin = req.headers.origin || "";
  res.setHeader("Access-Control-Allow-Origin", origin === ALLOW || origin.startsWith("http://localhost") ? origin : ALLOW);
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "content-type");
  if (req.method === "OPTIONS") { res.writeHead(204); return res.end(); }
  if (req.url === "/ping") { res.writeHead(200); return res.end("ok"); }
  if (req.url !== "/jw" || req.method !== "POST") { res.writeHead(404); return res.end(); }
  let body = ""; for await (const c of req) { body += c; if (body.length > 20000) { res.writeHead(413); return res.end(); } }
  try {
    const r = await fetch("https://apis.justwatch.com/graphql", { method: "POST", body, headers: { "content-type": "application/json" } });
    res.writeHead(r.status, { "content-type": "application/json" }); res.end(await r.text());
  } catch (e) { res.writeHead(502); res.end("{}"); }
}).listen(process.env.PORT || 10000);
