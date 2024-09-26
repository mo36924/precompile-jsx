import { execSync } from "node:child_process";
import { copyFileSync, rmSync, writeFileSync } from "node:fs";

rmSync("dist", { recursive: true, force: true });
execSync("pkgroll");
writeFileSync(
  "dist/index.cjs",
  'exports.precompileJsx = (options) => import("./index.js").then(({ precompileJsx }) => precompileJsx(options));',
);
copyFileSync("node_modules/@deno/emit/emit_bg.wasm", "dist/emit_bg.wasm");
