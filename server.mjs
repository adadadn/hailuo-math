import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";

const root = fileURLToPath(new URL(".", import.meta.url));
const port = Number(process.env.PORT || 4173);
const host = process.env.HOST || "127.0.0.1";

const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
};
const textLike = /\.(?:html|css|js|mjs|json|webmanifest|svg|txt)$/i;

const send = (res, status, headers, body) => {
  res.writeHead(status, {
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    ...headers,
  });
  if (body) res.end(body);
  else res.end();
};

createServer(async (req, res) => {
  const requestPath = decodeURIComponent((req.url || "/").split("?")[0]);
  const relative = requestPath === "/" || requestPath.endsWith("/") ? `${requestPath}index.html` : requestPath;
  const filePath = normalize(join(root, relative));

  // 只允许访问项目目录内的文件
  if (!filePath.startsWith(root.endsWith(sep) ? root : root + sep)) {
    send(res, 403, { "Content-Type": "text/plain; charset=utf-8" }, "Forbidden");
    return;
  }

  try {
    const info = await stat(filePath);
    if (!info.isFile()) throw new Error("not a file");
    const body = await readFile(filePath);
    const type = mime[extname(filePath).toLowerCase()] || "application/octet-stream";
    const etag = `W/"${info.size.toString(16)}-${Math.trunc(info.mtimeMs).toString(16)}"`;
    // 题库文件大，允许浏览器短期缓存；页面与脚本必须每次校验，避免更新后拿到旧版本
    const cacheControl = /\.(?:json)$/i.test(filePath) ? "public, max-age=3600" : "no-cache";

    if (req.headers["if-none-match"] === etag) {
      send(res, 304, { ETag: etag, "Cache-Control": cacheControl });
      return;
    }

    const wantsGzip = textLike.test(filePath) && /\bgzip\b/i.test(req.headers["accept-encoding"] || "");
    if (wantsGzip && body.length > 1024) {
      const zipped = gzipSync(body);
      send(res, 200, {
        "Content-Type": type,
        "Content-Encoding": "gzip",
        "Content-Length": zipped.length,
        "Cache-Control": cacheControl,
        "Vary": "Accept-Encoding",
        ETag: etag,
      }, zipped);
      return;
    }

    send(res, 200, {
      "Content-Type": type,
      "Content-Length": body.length,
      "Cache-Control": cacheControl,
      ETag: etag,
    }, body);
  } catch {
    send(res, 404, { "Content-Type": "text/plain; charset=utf-8" }, "Not found");
  }
}).listen(port, host, () => {
  console.log(`海螺游学已启动：http://${host === "0.0.0.0" ? "localhost" : host}:${port}`);
});
