import path from 'path';
import { codeFrameColumns as codeFrame } from '@babel/code-frame';
import ts from 'typescript';
import fs from 'fs';

const appendCodeFrame = ({ filePath, errorMessage, location }) => {
  if (typeof location === 'undefined') {
    return errorMessage;
  }
  const rawLines = fs.readFileSync(filePath, 'utf8');
  return `${errorMessage}\n${codeFrame(rawLines, location, {
    highlightCode: true,
  })}`;
};

const convertErrors = ({ start, end, errors, testPath }) => ({
  console: null,
  failureMessage: errors.map(appendCodeFrame).join('\n\n'),
  numFailingTests: errors.length,
  numPassingTests: errors.length ? 0 : 1,
  numPendingTests: 0,
  perfStats: {
    end,
    start,
  },
  snapshot: {
    added: 0,
    fileDeleted: false,
    matched: 0,
    unchecked: 0,
    unmatched: 0,
    updated: 0,
  },
  sourceMaps: {},
  testExecError: null,
  testFilePath: testPath,
  testResults: (errors.length ? errors : [{ filePath: testPath }]).map(
    error => ({
      ancestorTitles: [],
      duration: end - start,
      failureMessages: [error.errorMessage],
      fullName: error.filePath,
      numPassingAsserts: error.errorMessage ? 1 : 0,
      status: error.errorMessage ? 'failed' : 'passed',
      title: 'tsc',
    })
  ),
});

const runTsc = ({ testPath, config: jestConfig }, workerCallback) => {
  try {
    const configPath = path.resolve(jestConfig.rootDir, 'tsconfig.json');
    const configContents = fs.readFileSync(configPath).toString();
    const { config, error } = ts.parseConfigFileTextToJson(
      configPath,
      configContents
    );

    if (error) {
      return {
        errorMessage: error,
        filePath: testPath,
      };
    }

    const settings = ts.convertCompilerOptionsFromJson(
      config['compilerOptions'] || {},
      process.cwd()
    );

    const options = Object.assign({}, { noEmit: true }, settings.options);

    const start = Date.now();
    const program = ts.createProgram([testPath], options);

    const emitResult = program.emit();

    const allDiagnostics = ts
      .getPreEmitDiagnostics(program)
      .concat(emitResult.diagnostics);

    const errors = allDiagnostics.map(diagnostic => {
      if (diagnostic.file) {
        const {
          line: lineStart,
          character: characterStart,
        } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
        const {
          line: lineEnd,
          character: characterEnd,
        } = diagnostic.file.getLineAndCharacterOfPosition(
          diagnostic.start + diagnostic.length
        );

        const location = {
          start: {
            line: lineStart + 1,
            column: characterStart + 1,
          },
          end: {
            line: lineEnd + 1,
            column: characterEnd + 1,
          },
        };

        const message = ts.flattenDiagnosticMessageText(
          diagnostic.messageText,
          '\n'
        );

        return {
          location,
          errorMessage: message,
          filePath: diagnostic.file.fileName,
        };
      } else {
        return {
          errorMessage: `${ts.flattenDiagnosticMessageText(
            diagnostic.messageText,
            '\n'
          )}`,
          filePath: testPath,
        };
      }
    });

    const end = Date.now();
    workerCallback(null, convertErrors({ start, end, errors, testPath }));
  } catch (e) {
    workerCallback(e);
  }
};

module.exports = runTsc;
