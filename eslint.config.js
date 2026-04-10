// eslint.config.js
module.exports = [
  {
    ignores: ["node_modules/**", "dist/**", "prebuild-src/**", ".husky/**", "coverage/**"]
  },
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: "commonjs",
      globals: {
        console: "readonly",
        process: "readonly",
        Buffer: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        window: "readonly",
        document: "readonly",
        navigator: "readonly",
        require: "readonly",
        module: "writable"
      }
    },
    rules: {
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "no-console": ["warn", { allow: ["warn", "error", "log"] }],
      "prefer-const": "warn",
      "no-var": "error",
      "eqeqeq": ["error", "always"],
      "curly": ["error", "all"],
      "brace-style": ["error", "1tbs"],
      "semi": ["error", "always"],
      "quotes": ["error", "double"],
      "space-before-function-paren": [
        "error",
        {
          anonymous: "always",
          named: "never",
          asyncArrow: "always"
        }
      ],
      "indent": ["warn", 4, { SwitchCase: 1 }],
      "no-trailing-spaces": "warn",
      "comma-dangle": ["warn", "never"],
      "no-multiple-empty-lines": ["warn", { max: 2 }],
      "object-curly-spacing": ["warn", "always"],
      "array-bracket-spacing": ["warn", "never"],
      "key-spacing": ["warn", { beforeColon: false, afterColon: true }],
      "keyword-spacing": ["warn", { before: true, after: true }],
      "space-infix-ops": "warn",
      "space-before-blocks": ["warn", "always"]
    }
  }
];
