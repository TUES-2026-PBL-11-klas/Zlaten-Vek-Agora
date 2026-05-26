/** @type {import('jest').Config} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  rootDir: "src",
  testRegex: [".*\\.spec\\.ts$", ".*/__tests__/.*\\.ts$"],
  moduleFileExtensions: ["ts", "js", "json"],
  transform: { "^.+\\.ts$": ["ts-jest", { tsconfig: "<rootDir>/../tsconfig.spec.json" }] },
  moduleNameMapper: {
    "^jwks-rsa$": "<rootDir>/../test/stubs/jwks-rsa.ts",
    "^@/(.*)$": "<rootDir>/$1",
  },
  collectCoverageFrom: ["**/*.ts", "!**/*.module.ts", "!**/*.spec.ts", "!main.ts"],
  coverageDirectory: "../coverage",
};
