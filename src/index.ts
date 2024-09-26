import { readFile } from "node:fs/promises";
import { basename } from "node:path";
import { cwd } from "node:process";
import { pathToFileURL } from "node:url";
import { transpile } from "@deno/emit";
import { build } from "esbuild";

export interface Options {
  code: string;
  path?: string;
  jsxImportSource?: string;
}

(globalThis as any).Deno = { cwd, readFile };

export const precompileJsx = async ({
  code,
  path = "index.tsx",
  jsxImportSource = "preact",
}: Options): Promise<{ code: string; map: string }> => {
  const outfile = basename(path);

  const { metafile } = await build({
    stdin: { contents: code, sourcefile: path, loader: path.endsWith(".jsx") ? "jsx" : "tsx" },
    jsx: "preserve",
    write: false,
    metafile: true,
    outfile,
  });

  const imports = Object.fromEntries(metafile.outputs[outfile].imports.map(({ path }) => [path, "/"]));

  const url = pathToFileURL(path).href;

  const result = await transpile(url, {
    cacheRoot: cwd(),
    compilerOptions: {
      jsx: "precompile",
      jsxImportSource,
      sourceMap: true,
    },
    importMap: { imports },
    load: (specifier) =>
      Promise.resolve(
        specifier === url ? { kind: "module", content: code, specifier } : { kind: "external", specifier },
      ),
  });

  const _code = result.get(url)!;
  const map = result.get(`${url}.map`)!;

  return { code: _code, map };
};
