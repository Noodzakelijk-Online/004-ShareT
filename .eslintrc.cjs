module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:react/jsx-runtime",
    "plugin:react-hooks/recommended",
  ],
  ignorePatterns: [
    "dist",
    "backend/frontend",
    "node_modules",
    ".eslintrc.cjs",
    "backend/utils/crypto.js",
    "backend/utils/httpClient.js",
    "backend/utils/imageProcessor.js",
  ],
  parserOptions: { ecmaVersion: "latest", sourceType: "module" },
  settings: { react: { version: "18.2" } },
  plugins: ["react-refresh"],
  rules: {
    "react/jsx-no-target-blank": "off",
    "react/prop-types": "off",
    "react/no-unescaped-entities": "off",
    "no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
  },
  overrides: [
    {
      files: ["backend/**/*.js", "ecosystem.config.js", "tailwind.config.js", "scripts/health-check.js", "scripts/*.cjs"],
      env: { browser: false, node: true, es2022: true },
      parserOptions: { ecmaVersion: "latest", sourceType: "script" },
    },
    {
      files: ["scripts/copy-frontend-build.js"],
      env: { browser: false, node: true, es2022: true },
    },
    {
      files: ["extension/**/*.js"],
      globals: { chrome: "readonly" },
    },
  ],
};
