import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
let wisp = null;
try { const m = await import("wisp-server-node"); wisp = m.default || m; } catch (e) { console.log("Wisp server not available: " + e.message); }

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "public");
const types = { ".html":"text/html; charset=utf-8", ".js":"text/javascript", ".mjs":"text/javascript", ".css":"text/css", ".json":"application/json",
  ".wasm":"application/wasm", ".png":"image/png", ".jpg":"image/jpeg", ".svg":"image/svg+xml", ".mp3":"audio/mpeg", ".map":"application/json" };

const srv = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (p.endsWith("/")) p += "index.html";
  const f = path.join(root, path.normalize(p));
  if (!f.startsWith(root)) { res.writeHead(403); return res.end(); }
  fs.stat(f, (e, st) => {
    if (e || !st.isFile()) { res.writeHead(404); return res.end("Not found"); }
    const h = { "Content-Type": types[path.extname(f)] || "application/octet-stream", "Cache-Control": f.endsWith("index.html") ? "no-cache" : "public, max-age=3600" };
    if (f.endsWith("sw.js")) h["Service-Worker-Allowed"] = "/";
    res.writeHead(200, h); fs.createReadStream(f).pipe(res);
  });
});
srv.on("upgrade", (req, socket, head) => {
  if (wisp && req.url.startsWith("/wisp/")) wisp.routeRequest(req, socket, head);
  else socket.destroy();
});
srv.listen(process.env.PORT || 8080, "0.0.0.0", () => console.log("Game Hub on :" + (process.env.PORT || 8080)));
