// 生成可发布的静态目录 publish-site/（部署目标：任意静态托管 / Nginx / OSS）。
// 源文件只保留一份，避免根目录与发布目录各改一半导致线上版本漂移。
// 用法：node tools/build-site.mjs
import { cp, mkdir, readdir, rm, stat } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const out = resolve(root, "publish-site");

// 发布清单：显式列出，避免把 tools/ scripts/ docs/ 带上线
const FILES = [
  "index.html",
  "app.js",
  "core.js",
  "styles.css",
  "sw.js",
  "manifest.webmanifest",
  "icon.svg",
];
const DIRS = ["data", "icons"];
const REQUIRED_FILES = ["index.html", "app.js", "core.js", "styles.css", "sw.js", "manifest.webmanifest", "data/questions.json", "data/curriculum.json", "data/notes.json"];

async function exists(path) {
  try { await stat(path); return true; } catch { return false; }
}

async function main() {
  if (!out.endsWith("publish-site")) throw new Error(`拒绝清理非发布目录：${out}`);
  await rm(out, { recursive: true, force: true });
  await mkdir(out, { recursive: true });

  for (const file of FILES) {
    await cp(join(root, file), join(out, file));
  }
  for (const dir of DIRS) {
    await cp(join(root, dir), join(out, dir), { recursive: true });
  }

  const missing = [];
  for (const file of REQUIRED_FILES) {
    if (!(await exists(join(out, file)))) missing.push(file);
  }
  if (missing.length) throw new Error(`发布目录缺少文件：${missing.join(", ")}`);

  let bytes = 0;
  const walk = async (dir) => {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) await walk(full);
      else bytes += (await stat(full)).size;
    }
  };
  await walk(out);

  console.log(`已生成 ${out}`);
  console.log(`包含 ${FILES.length} 个入口文件 + ${DIRS.join(" / ")}，合计 ${(bytes / 1024 / 1024).toFixed(2)} MB`);
  console.log("部署后请确认：HTTPS + 相对路径可用（可直接部署到子目录）。");
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
