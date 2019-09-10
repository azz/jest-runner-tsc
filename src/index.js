import { createJestRunner } from 'create-jest-runner';
import cosmiconfig from 'cosmiconfig';

const explorer = cosmiconfig('jest-runner-tsc');

const getExtraOptions = () => {
  const searchedFor = explorer.searchSync();
  if (!searchedFor || typeof searchedFor.config === 'undefined') {
    return {};
  }

  return searchedFor.config;
};

module.exports = createJestRunner(require.resolve('./runTsc'), {
  getExtraOptions,
});
