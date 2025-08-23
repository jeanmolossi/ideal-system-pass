import js from "@eslint/js";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import globals from "globals";

export default [
  {
    ignores: ["dist"]
  },
  js.configs.recommended,
  {
    files: ["**/*.{ts,tsx,js}"],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node,
        BufferSource: "readonly",
        chrome: "readonly"
      }
    },
    plugins: {
      "@typescript-eslint": tsPlugin
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      "@typescript-eslint/no-explicit-any": "off"
    },
    linterOptions: {
      reportUnusedDisableDirectives: "off"
    }
  },
  {
    files: ["**/*.test.{ts,tsx,js}"],
    languageOptions: {
      globals: {
        ...globals.jest
      }
    }
  }
];
