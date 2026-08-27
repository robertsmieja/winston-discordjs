import js from "@eslint/js"
import tsPlugin from "@typescript-eslint/eslint-plugin"
import tsParser from "@typescript-eslint/parser"
import pluginPrettier from "eslint-plugin-prettier"
import configPrettier from "eslint-config-prettier"

export default [
  {
    ignores: [
      "dist/**",
      "lib/**",
      "webpack.config*.js",
      "coverage/**",
      "**/*.d.ts",
    ],
  },

  js.configs.recommended,

  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      sourceType: "module",
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
      "prettier": pluginPrettier,
    },
    rules: {
      ...(tsPlugin.configs.recommended.rules || {}),
      "@typescript-eslint/no-explicit-any": "off",
      "prettier/prettier": "error",
    },
  },

  configPrettier,
]
