import { expect, it } from "vitest";
import { precompileJsx } from "./index";

const code = `
import { useState } from "preact/compat"
import { useHook } from "./hooks"

export default () => {
  useHook()
  const [count, setCount] = useState(0)
  return <div>{count}</div>;
};

export * from "preact"
`;

it("precompileJsx", async () => {
  const result = await precompileJsx({ code });

  expect(result.code).toMatchInlineSnapshot(`
    "import { jsxTemplate as _jsxTemplate, jsxEscape as _jsxEscape } from "preact/jsx-runtime";
    const $$_tpl_1 = [
      "<div>",
      "</div>"
    ];
    import { useState } from "preact/compat";
    import { useHook } from "./hooks";
    export default (()=>{
      useHook();
      const [count, setCount] = useState(0);
      return _jsxTemplate($$_tpl_1, _jsxEscape(count));
    });
    export * from "preact";
    "
  `);
});
