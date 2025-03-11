import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { 
    ignores: [
      "dist",
      "node_modules",
      "public",
      "**/*.d.ts",
      "**/supabase/functions/**/*",
      "**/_archived_components/**/*",
    ]
  },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-unused-expressions": ["error", { "allowShortCircuit": true, "allowTernary": true }],
      "@typescript-eslint/no-explicit-any": "off", // Allow use of 'any' type
      "@typescript-eslint/no-empty-object-type": "off", // Allow empty interfaces
      "@typescript-eslint/no-require-imports": "off", // Allow require() imports
      "@typescript-eslint/ban-ts-comment": "off", // Allow ts-ignore comments
      "react-hooks/rules-of-hooks": "warn", // Downgrade hooks rules to warnings
      "react-refresh/only-export-components": "off" // Disable refresh rule
    },
  }
);
