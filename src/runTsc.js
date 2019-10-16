import path from 'path';
import { codeFrameColumns as codeFrame } from '@babel/code-frame';
import ts from 'typescript';
import fs from 'fs';
import { pass, fail } from 'create-jest-runner';

const appendCodeFrame = ({ filePath, errorMessage, location }) => {
  if (typeof location === 'undefined') {
    return errorMessage;
  }
  const rawLines = fs.readFileSync(filePath, 'utf8');
  return `${errorMessage}\n${codeFrame(rawLines, location, {
    highlightCode: true,
  })}`;
};

const runTsc = ({ testPath, config: jestConfig, extraOptions }) => {
  const start = Date.now();

  const configPath =
    typeof extraOptions.tsconfigPath === 'string'
      ? path.resolve(extraOptions.tsconfigPath)
      : path.resolve(jestConfig.rootDir, 'tsconfig.json');

  if (!fs.existsSync(configPath)) {
    throw new Error(
      'Cannot find tsconfig file. Either create one in the root of your project or define a custom path via the `tsconfigPath` option.'
    );
  }

  const configContents = fs.readFileSync(configPath).toString();
  const { config, error } = ts.parseConfigFileTextToJson(
    configPath,
    configContents
  );

  const baseObj = {
    start,
    title: 'tsc',
    test: { path: testPath },
  };

  if (error) {
    return fail({
      ...baseObj,
      end: Date.now(),
      errorMessage: error,
    });
  }

  const settings = ts.convertCompilerOptionsFromJson(
    config['compilerOptions'] || {},
    process.cwd()
  );

  const options = Object.assign({}, { noEmit: true }, settings.options);

  const program = ts.createProgram([testPath], options);

  const emitResult = program.emit();

  const allDiagnostics = ts
    .getPreEmitDiagnostics(program)
    .concat(emitResult.diagnostics)
    .filter(diagnostic => diagnostic.file.fileName === testPath);

  const errors = allDiagnostics
    .map(diagnostic => {
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
    })
    .map(appendCodeFrame);

  const end = Date.now();

  if (errors.length === 0) {
    return pass({ ...baseObj, end });
  }

  return fail({
    ...baseObj,
    errorMessage: errors.join('\n\n'),
    end,
  });
};

module.exports = runTsc;
