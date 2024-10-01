import Bluebird from 'bluebird';
import lodash from 'lodash';
import { glob, GlobOptionsWithFileTypesUnset } from 'glob';
import multiline from 'multiline-ts';

import testSnippets from './testSnippets';
import argvParser from './argvParser';

function getSuccessful(results: boolean[][]) {
  return results.filter((result) => lodash.every(result));
}

export const dependencies = {
  console,
  glob: glob as (pattern: string | string[], options?: GlobOptionsWithFileTypesUnset) => Promise<string[]>,
  testSnippets,
};

export const commandHelp = multiline`
  Flexibly test markdown code examples

  Usage: npx test-snippets [<path...>] [--help] [--config=<config-path>] [--ignore=<ignore-paths>] [--test-dir=<test-dir>]
  Description:
    TODO

  Arguments:
    <path...>
      Files to test, you can use glob syntax.
      The default value is "**/*.md"

  Options:
    --config=<config-path>
      A path to the JSON config file.
      The default value is "tests/snippets/config.json"

    --ignore=<ignore-paths>
      Comma separated list of files to ignore, you can use glob syntax.
      The default value is "**/node_modules/**"

    --test-dir=<test-dir>
      Path to the test directory, by default "tests/snippets"

    --help
      Display this message
`;

/** Tests snippets as a command */
export default async function testSnippetsCommand(argv: string[]) {
  const chalk = (await import('chalk')).default;

  const { args, options } = argvParser(argv);

  if (options.help) {
    dependencies.console.log(commandHelp);
    return;
  }

  if (options.config === true) {
    throw new Error('--config must have a value');
  }

  if (options['test-dir'] === true) {
    throw new Error('--test-dir must have a value');
  }

  if (options.ignore === true) {
    throw new Error('--ignore must have a value');
  }

  const paths = args.length > 0 ? args : ['**/*.md'];
  const ignore = options.ignore ? options.ignore.split(',') : ['**/node_modules/**'];
  const configPath = options.config || 'tests/snippets/config.json';
  const testDir = options['test-dir'] || 'tests/snippets';
  const cleanup = options['cleanup'] ? (options['cleanup'] === true || options['cleanup'] === 'true') : true;

  const files = lodash.uniq(lodash.flatten(await Bluebird.mapSeries(paths, async (path) => {
    return dependencies.glob(path, { ignore: ignore });
  })));

  const results = await dependencies.testSnippets(files, configPath, testDir, cleanup);

  console.log('');
  const successful = getSuccessful(results);
  if (successful.length === results.length) {
    dependencies.console.log(chalk.green(`Success: ${successful.length}/${results.length} snippets passed`));
  } else {
    throw new Error(`Error: ${successful.length}/${results.length} snippets passed`);
  }
}
