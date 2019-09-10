# `jest-runner-tsc`

[![Travis](https://img.shields.io/travis/azz/jest-runner-tsc.svg?style=flat-square)](https://travis-ci.org/azz/jest-runner-tsc)
[![Prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)
[![npm](https://img.shields.io/npm/v/jest-runner-tsc.svg?style=flat-square)](https://npmjs.org/jest-runner-tsc)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg?style=flat-square)](https://github.com/semantic-release/semantic-release)
[![License](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)](LICENSE)

> A Jest runner for the TypeScript compiler

## install

```bash
npm install --save-dev jest-runner-tsc
```

## usage

Jest configuration:

jest.tsc.config.js:

```js
module.exports = {
  runner: 'jest-runner-tsc',
  displayName: 'tsc',
  moduleFileExtensions: ['js','ts', 'tsx'],
  testMatch: ['<rootDir>/**/*.ts'],
};
```

## options

This project uses [cosmiconfig](https://github.com/davidtheclark/cosmiconfig), so you can provide config via:

- a `jest-runner-tsc` property in your package.json
- a `jest-runner-tsc.config.js` JS file
- a `.jest-runner-tscrc` JSON file

### Example in package.json

```json
{
  "jest-runner-tsc": {
    "tsconfigPath": "./tsconfig.types.json"
  }
}
```

### `tsconfigPath`

Default: `./tsconfig.json`

A relative path to your `tsconfig.json` file.

## run

```
jest -c jest.tsc.config.js
```
