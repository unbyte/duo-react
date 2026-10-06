import { defineConfig } from "vite-plus"

export default defineConfig({
  lint: {
    plugins: ["typescript", "unicorn", "oxc", "import", "react", "jsx-a11y"],
    categories: {
      correctness: "error",
    },
    options: {
      typeAware: true,
      typeCheck: true,
    },
    rules: {
      "import/no-duplicates": ["error", { preferInline: true }],
      "typescript/consistent-type-imports": ["error", { fixStyle: "inline-type-imports" }],
      "typescript/no-floating-promises": "error",
      "typescript/no-misused-promises": "error",
      "react/rules-of-hooks": "error",
      "react/exhaustive-deps": ["error", { additionalHooks: "^useBrowserLayoutEffect$" }],
      // Public components forward div refs and use intentional, accessible ARIA roles.
      "jsx-a11y/prefer-tag-over-role": "off",
    },
  },
  fmt: {
    semi: false,
    overrides: [
      {
        files: ["**/*.md"],
        options: { embeddedLanguageFormatting: "off" },
      },
    ],
    // Preserve reference snapshots byte for byte so their provenance hashes stay valid.
    ignorePatterns: ["packages/duo-react/docs/calibration/sources/**"],
  },
})
