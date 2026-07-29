import globals from "globals";
import pluginJs from "@eslint/js";

export default [
  { files: ["**/*.{ts,tsx}"] },
  { languageOptions: { globals: { ...globals.browser, ...globals.node } } },
  pluginJs.configs.recommended,
];
