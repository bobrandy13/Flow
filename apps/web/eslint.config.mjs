import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  // Architectural guard: the web app must NOT import the simulator runtime
  // directly. All sim work goes through POST /api/simulate. Schemas + types
  // are still allowed.
  {
    files: ["**/*.{ts,tsx}"],
    ignores: ["**/*.test.{ts,tsx}", "lib/hooks/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "@flow/shared/simulation/*",
                "!@flow/shared/simulation/run",
              ],
              message:
                "apps/web must not import the simulator runtime directly. Call POST /api/simulate via useSimulation instead.",
            },
          ],
        },
      ],
    },
  },
]);

export default eslintConfig;
