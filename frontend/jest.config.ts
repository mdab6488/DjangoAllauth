import nextJest from 'next/jest';

// Explicitly type the nextJest function
const nextJestTyped: (options: { dir: string }) => any = nextJest;

const createJestConfig = nextJestTyped({
  dir: './', // Path to your Next.js app
});

/** @type {import('jest').Config} */
const config = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'], // Optional: Add setup files
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1', // Map aliases (e.g., @/components)
    '^@emotion/styled$': '<rootDir>/node_modules/@emotion/styled',
    '\\.(css|scss)$': 'identity-obj-proxy', // Mock CSS/SCSS files
  },
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/.next/',
    '<rootDir>/e2e/', // Ignore end-to-end tests
  ],
};

export default createJestConfig(config);