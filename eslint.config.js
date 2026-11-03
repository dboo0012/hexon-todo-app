// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*", ".expo/*"],
  },
  {
    // jest.mock factories must use require().
    files: ["jest.setup.ts"],
    rules: { "@typescript-eslint/no-require-imports": "off" },
  },
]);
