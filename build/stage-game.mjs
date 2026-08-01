import { cp, mkdir, rm } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const output = resolve(root, ".game-public");

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });

for (const entry of ["index.html", "style.css", "v2.css", "files", "js"]) {
  await cp(resolve(root, entry), resolve(output, entry), { recursive: true });
}
await cp(resolve(root, "public", "og.png"), resolve(output, "og.png"));
