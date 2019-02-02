module.exports = {
  projects: [
    {
      displayName: 'test',
      testMatch: ['<rootDir>/test/*.js'],
    },
    {
      displayName: 'lint',
      runner: 'jest-runner-eslint',
      testMatch: [
        '<rootDir>/src/*.js',
        '<rootDir>/test/*.js',
        '<rootDir>/*.js',
      ],
      testPathIgnorePatterns: ['node_modules'],
    },
    {
      displayName: 'tsc',
      rootDir: './test',
      moduleFileExtensions: ['ts', 'js'],
      runner: '<rootDir>/../dist/index.js',
      testMatch: ['<rootDir>/*.ts'],
      testPathIgnorePatterns: ['lib-bad.test.ts'],
    },
  ],
};
