const codeFrame = require('@babel/code-frame').default;
const ts = require('typescript');
const fs = require('fs');

const appendCodeFrame = ({ filePath, errorMessage, line, column }) => {
  if (typeof line === 'undefined') {
    return errorMessage;
  }
  const rawLines = fs.readFileSync(filePath, 'utf8');
  return `${errorMessage}\n${codeFrame(rawLines, line, column)}`;
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

const runTsc = ({ testPath, config }, workerCallback) => {
  try {
    const start = +new Date();
    const program = ts.createProgram([testPath], {
      noEmit: true,
    });

    const emitResult = program.emit();

    const allDiagnostics = ts
      .getPreEmitDiagnostics(program)
      .concat(emitResult.diagnostics);

    const errors = allDiagnostics.map(diagnostic => {
      if (diagnostic.file) {
        const {
          line,
          character,
        } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
        const message = ts.flattenDiagnosticMessageText(
          diagnostic.messageText,
          '\n'
        );
        return {
          line: line + 1,
          column: character + 1,
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

    const end = +new Date();
    workerCallback(null, convertErrors({ start, end, errors, testPath }));
  } catch (e) {
    workerCallback(e);
  }
};

module.exports = runTsc;
