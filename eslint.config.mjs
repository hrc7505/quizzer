import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import collapseRule from "./eslint/rules/collapse-multiline-imports.js";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    files: ["src/**/*.{js,jsx,ts,tsx}"],
    plugins: {
      "collapse-multiline": {
        rules: {
          "collapse-multiline-imports": collapseRule,
        },
      },
    },
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["./"],
              message: "Use absolute imports with '@/...' instead of relative './...' paths.",
            },
          ],
        },
      ],
      "import/order": [
        "error",
        {
          groups: ["external", "internal", "object", "type"],
          "newlines-between": "always",
          warnOnUnassignedImports: true,
        },
      ],
      "collapse-multiline/collapse-multiline-imports": ["warn", { maxLineLength: 120 }],
    },
  },
]);

export default eslintConfig;
