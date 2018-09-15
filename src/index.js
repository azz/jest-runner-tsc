import { createJestRunner } from 'create-jest-runner';

module.exports = createJestRunner(require.resolve('./runTsc'));
