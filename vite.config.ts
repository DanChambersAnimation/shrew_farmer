import { defineConfig } from "vite-plus";

export default defineConfig({
  // Relative asset URLs so the build works from any path, e.g. GitHub Pages' /shrew_farmer/.
  base: "./",
  build: {
    // three.js alone is ~500 kB minified.
    chunkSizeWarningLimit: 1000,
    rolldownOptions: {
      input: {
        main: "index.html",
        contactSheet: "contact-sheet.html",
      },
    },
  },
  staged: {
    "*": "vp check --fix",
  },
  fmt: {},
  lint: {
    jsPlugins: [{ name: "vite-plus", specifier: "vite-plus/oxlint-plugin" }],
    rules: { "vite-plus/prefer-vite-plus-imports": "error" },
    options: { typeAware: true, typeCheck: true },
  },
});
