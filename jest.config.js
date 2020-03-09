module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  collectCoverage: true,
  collectCoverageFrom: [
    '**/*.ts',
    '!dist/**/*'
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/'
  ]
};
