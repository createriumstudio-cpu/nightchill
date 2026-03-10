import type { Config } from "jest";
import nextJest from "next/jest.js";

const createJestConfig = nextJest({
  dir: "./",
});

const config: Config = {
  testEnvironment: "jest-environment-jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
};

export default async () => {
  const jestConfig = await createJestConfig(config)();
  // next-auth v5 と @auth/core は ESM なので Jest で変換が必要
  jestConfig.transformIgnorePatterns = [
    "/node_modules/(?!(next-auth|@auth)/)",
  ];
  return jestConfig;
};
