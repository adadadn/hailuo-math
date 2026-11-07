// 从 icon.svg 生成 PNG 图标，保证 favicon / 应用图标 / 站内 logo 是同一只海螺。
// 用法：node tools/gen-icons.mjs
// 需要本机 Chrome 或 Edge（headless 截图渲染 SVG）；否则请直接使用已提交的 PNG。
import { spawn } from "node:child_process";
import { copyFile, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const sourceSvg = readFileSync(join(root, "icon.svg"), "utf8");
if (!sourceSvg.includes('id="mark"')) throw new Error("icon.svg 里找不到 #mark 分组");

const browser = [
  process.env.CHROME_PATH,
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
].filter(Boolean).find((path) => existsSync(path));
if (!browser) {
  console.error("找不到 Chrome/Edge，无法渲染图标；请设置环境变量 CHROME_PATH。");
  process.exit(1);
}

// 应用图标：满版方形（系统自己裁圆角）；maskable 内容缩到 80% 安全区
const TARGETS = [
  { file: "icon-192.png", size: 192, markScale: 1.42 },
  { file: "icon-512.png", size: 512, markScale: 1.42 },
  { file: "icon-maskable-512.png", size: 512, markScale: 1.42 * 0.8 },
  { file: "apple-touch-icon-180.png", size: 180, markScale: 1.42 },
];

function svgFor(markScale) {
  return sourceSvg
    .replace(/rx="26"/, 'rx="0"')
    .replace(/(<g id="mark"[^>]*?)scale\([\d.]+\)/, `$1scale(${markScale.toFixed(4)})`);
}

async function shoot(size, markScale, outFile, workDir) {
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>
    html,body{margin:0;width:${size}px;height:${size}px;background:#11557a;overflow:hidden}
    svg{display:block;width:${size}px;height:${size}px}
  </style></head><body>${svgFor(markScale)}</body></html>`;
  const htmlPath = join(workDir, `${outFile}.html`);
  const shotPath = join(workDir, outFile);
  await writeFile(htmlPath, html, "utf8");

  await new Promise((resolve, reject) => {
    const child = spawn(browser, [
      "--headless=new", "--disable-gpu", "--hide-scrollbars", "--no-first-run", "--no-default-browser-check",
      `--user-data-dir=${join(workDir, "profile")}`,
      `--window-size=${size},${size}`, "--force-device-scale-factor=1",
      `--screenshot=${shotPath}`, `file:///${htmlPath.replace(/\\/g, "/")}`,
    ], { stdio: "ignore" });
    child.on("error", reject);
    child.on("exit", (code) => (code === 0 && existsSync(shotPath) ? resolve() : reject(new Error(`渲染失败，退出码 ${code}`))));
  });

  const bytes = await readFile(shotPath);
  if (bytes.length < 1000) throw new Error(`渲染结果异常（${bytes.length} bytes）`);
  await copyFile(shotPath, join(root, "icons", outFile));
  console.log(`icons/${outFile}  ${size}×${size}  ${bytes.length} bytes`);
}

const workDir = await mkdtemp(join(tmpdir(), "hailuo-icons-"));
try {
  for (const target of TARGETS) await shoot(target.size, target.markScale, target.file, workDir);
} finally {
  await rm(workDir, { recursive: true, force: true });
}
console.log("图标已更新");
