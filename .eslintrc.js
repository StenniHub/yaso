module.exports = {
  root: true,
  env: {
    node: true
  },
  extends: [
    "plugin:vue/essential",
    "eslint:recommended",
    "@vue/typescript/recommended"
  ],
  parserOptions: {
    ecmaVersion: 2020
  },
  rules: {
    "no-console": process.env.NODE_ENV === "production" ? "warn" : "off",
    "no-debugger": process.env.NODE_ENV === "production" ? "warn" : "off",
    "indent": ["warn", 2],
    "vue/html-indent": ["warn", 2, {
      "attribute": 1,
      "baseIndent": 1,
      "closeBracket": 0,
      "alignAttributesVertically": true,
      "ignores": []
    }],
    "vue/max-attributes-per-line": "off",
    "vue/multi-word-component-names": "off",
    "no-var": 0,  // fix later
    "@typescript-eslint/no-explicit-any": 0,
    "vue/no-v-text-v-html-on-component": "off",
  }
};
