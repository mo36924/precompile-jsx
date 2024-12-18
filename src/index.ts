import { readFile } from "node:fs/promises";
import { argv, cwd } from "node:process";
import { pathToFileURL } from "node:url";
import { transpile } from "@deno/emit";
import ts from "typescript";

export interface Options {
  code: string;
  path?: string;
  jsxImportSource?: string;
}

export const precompileJsx = async ({
  code,
  path = "index.tsx",
  jsxImportSource = "react",
}: Options): Promise<{ code: string; map: string }> => {
  (globalThis as any).Deno ??= {
    cwd,
    readFile,
    // Error occurs when loading chalk package
    // https://github.com/chalk/chalk/blob/4a10354857ba6d7932dad5fa6ef2e021c4ed47fb/source/vendor/supports-color/index.js#L7
    args: argv,
  };

  const sourceFile = ts.createSourceFile(path, code, ts.ScriptTarget.Latest);
  const moduleSet = new Set<string>();

  for (const statement of sourceFile.statements) {
    if (ts.isImportDeclaration(statement) && ts.isStringLiteral(statement.moduleSpecifier)) {
      moduleSet.add(statement.moduleSpecifier.text);
    } else if (
      ts.isExportDeclaration(statement) &&
      statement.moduleSpecifier &&
      ts.isStringLiteral(statement.moduleSpecifier)
    ) {
      moduleSet.add(statement.moduleSpecifier.text);
    }
  }

  const url = pathToFileURL(path).href;
  const imports = Object.fromEntries([...moduleSet].map((mod) => [mod, "/"]));

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

  return {
    code: result.get(url)!,
    map: result.get(`${url}.map`)!,
  };
};
