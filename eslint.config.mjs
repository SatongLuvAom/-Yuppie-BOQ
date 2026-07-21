import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTypeScript,
  {
    settings: {
      react: {
        version: "19.2"
      }
    },
    rules: {
      "@next/next/no-html-link-for-pages": "off"
    }
  },
  {
    files: ["packages/calculation/**/*.ts"],
    rules: {
      "no-restricted-globals": [
        "error",
        "window",
        "document",
        "navigator",
        "localStorage",
        "sessionStorage",
        "fetch",
        "XMLHttpRequest"
      ],
      "no-restricted-imports": [
        "error",
        {
          "patterns": [
            {
              "group": [
                "react",
                "react/*",
                "next",
                "next/*",
                "node:*",
                "@supabase/*",
                "@yuppie/db",
                "@yuppie/db/*"
              ],
              "message": "The calculation package must remain platform-independent pure TypeScript."
            }
          ]
        }
      ]
    }
  },
  globalIgnores([
    "**/.next/**",
    "**/coverage/**",
    "**/dist/**",
    "**/next-env.d.ts"
  ])
]);
