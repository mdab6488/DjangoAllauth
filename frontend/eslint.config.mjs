import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

export default [
  // Extend legacy configs using FlatCompat
  ...compat.extends(
    "next/core-web-vitals",
    "plugin:@typescript-eslint/recommended-type-checked", // Use type-checked rules
    "plugin:jest/recommended",
    "plugin:prettier/recommended"
  ),
  // Custom config object
  {
    // Specify the parser for TypeScript
    languageOptions: {
      parser: require('@typescript-eslint/parser'),
    },
    // Declare plugins explicitly
    plugins: ["@typescript-eslint", "jest"],
    // Rules
    rules: {
      "no-console": ["error", { allow: ["warn", "error"] }],
      "@typescript-eslint/explicit-function-return-type": [
        "error",
        {
          allowExpressions: true,
          allowTypedFunctionExpressions: true,
        },
      ],
      "import/no-extraneous-dependencies": ["error", { "packageDir": "./" }],
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/no-explicit-any": "error",
      "import/order": [
        "error",
        {
          groups: ["builtin", "external", "internal", "parent", "sibling", "index"],
          "newlines-between": "always",
          alphabetize: { order: "asc" },
        },
      ],
    },
  },
];
