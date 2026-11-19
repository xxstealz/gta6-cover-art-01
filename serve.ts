// Vice Cover Studio — tiny static server for local testing (Node 22,
// standard library only). Serves app/ on port 8080 by default:
//   node serve.ts
//   node serve.ts --port 8123
// Sends the MIME types an offline web app needs and refuses any path that
// escapes app/. A development convenience, not a server for the internet.

import { createReadStream, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("./app", import.meta.url)));
const args = process.argv.slice(2);
const portArg = args.indexOf("--port");
const wanted = portArg === -1 ? 8080 : Number(args[portArg + 1]);
const port = Number.isInteger(wanted) && wanted > 0 && wanted < 65536 ? wanted : 8080;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".ttf": "font/ttf",
  ".otf": "font/otf",
  ".wasm": "application/wasm",
  ".txt": "text/plain; charset=utf-8",
};

createServer((request, response) => {
  const url = new URL(request.url ?? "/", "http://localhost");
  let pathname;
  try {
    pathname = decodeURIComponent(url.pathname);
  } catch {
    response.writeHead(400).end("bad request");
    return;
  }
  if (pathname.endsWith("/")) pathname += "index.html";
  const file = resolve(join(root, normalize(pathname)));
  if (file !== root && !file.startsWith(root + sep)) {
    response.writeHead(403).end("forbidden");
    return;
  }
  let size;
  try {
    const stats = statSync(file);
    if (!stats.isFile()) throw new Error("not a file");
    size = stats.size;
  } catch {
    response.writeHead(404).end("not found");
    return;
  }
  response.writeHead(200, {
    "content-type": MIME[extname(file).toLowerCase()] ?? "application/octet-stream",
    "content-length": size,
    "cache-control": "no-store",
  });
  createReadStream(file).pipe(response);
}).listen(port, "127.0.0.1", () => {
  console.log(`app/ is on http://localhost:${port}`);
});
