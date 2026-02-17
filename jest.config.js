module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  coverageDirectory: 'coverage',
  collectCoverageFrom: ['src/**/*.js'],
  coveragePathIgnorePatterns: ['/node_modules/', '/tests/'],
  testTimeout: 60000,
  verbose: true,
  // Allow Jest to transform Playwright modules to handle dynamic imports
  transformIgnorePatterns: [
    'node_modules/(?!(playwright|playwright-core)/)'
  ],
};
