/** @type {import('jest').Config} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  rootDir: "src",
  testRegex: ".*\\.spec\\.ts$",
  moduleFileExtensions: ["ts", "js", "json"],
  transform: { "^.+\\.ts$": ["ts-jest", { tsconfig: "<rootDir>/../tsconfig.json" }] },
  moduleNameMapper: {
    "^jwks-rsa$": "<rootDir>/../test/stubs/jwks-rsa.ts",
  },
  collectCoverageFrom: ["**/*.ts", "!**/*.module.ts", "!**/*.spec.ts", "!main.ts"],
};
