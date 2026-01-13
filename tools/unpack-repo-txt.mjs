\
/**
 * Unpacks a repo.txt file into a real filesystem tree.
 * Usage:
 *   node tools/unpack-repo-txt.mjs repo.txt
 *
 * The repo.txt must contain file markers like:
 *   ===== path/to/file.ext =====
 * followed by file contents until next marker.
 */
import fs from "node:fs";
import path from "node:path";

const input = process.argv[2];
if (!input) {
  console.error("Usage: node tools/unpack-repo-txt.mjs repo.txt");
  process.exit(1);
}

const txt = fs.readFileSync(input, "utf8");
const lines = txt.split(/\r?\n/);

const markerRe = /^===== (.+) =====$/;

let currentPath = null;
let buf = [];

function flush() {
  if (!currentPath) return;
  const outPath = path.resolve(process.cwd(), currentPath);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, buf.join("\n"), "utf8");
  console.log("Wrote", currentPath);
}

for (let i = 0; i < lines.length; i++) {
  const m = lines[i].match(markerRe);
  if (m) {
    flush();
    currentPath = m[1].trim();
    buf = [];
    // skip the next separator lines if present
    continue;
  }
  if (currentPath) buf.push(lines[i]);
}

flush();
console.log("Done.");
