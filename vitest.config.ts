// Unit and integration tests run in Node, not in a browser: they cover pure
// logic (lib/, Zod schemas, the DAL) and database behavior.
//
// Async Server Components can NOT be tested with Vitest (see
// node_modules/next/dist/docs/01-app/02-guides/testing/vitest.md), so pages
// are covered by the Playwright suite in e2e/.
//
// A file that needs a DOM opts in with `// @vitest-environment happy-dom`, so
// the rest of the suite doesn't pay for it.

import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
  // Resolves the `@/*` alias, so tests import exactly like production code.
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    // Tests live next to the code they cover.
    include: ["{app,components,features,lib,i18n}/**/*.test.{ts,tsx}"],
  },
});
