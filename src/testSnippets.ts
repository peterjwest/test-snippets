import marked, { Token } from 'marked';
import fs from 'fs';
import path from 'path';
import Bluebird from 'bluebird';
import spawnProcess from 'spawn-process';
import _ from 'lodash';
import mkdirp from 'mkdirp';
import chalk from 'chalk';

import installModule from './installModule';

const { readFile, writeFile } = fs.promises;

export const dependencies = {
  console,
  mkdirp,
  readFile,
  writeFile,
  installModule,
  spawnProcess,
};

export const components = {
  getCodeTokens,
  testSnippet,
};

/** Configuration for a tag action */
export interface TagActionConfig {
  extension: string;
  command: string[];
}

/** Dictionary of tag actions */
export interface TagActions {
  [key: string]: TagActionConfig | undefined;
}

/** Token data */
export interface Snippet {
  text: string;
  tags: string[];
  filename: string;
}

/** Returns an array of all consecutive pairs in a list */
export function getPairs<Type>(list: Type[]): Array<[Type, Type]> {
  return list.slice(1).map((item, index) => [list[index], item]);
}

/** Gets a tagged snippet from two tokens or returns undefined */
export function getTaggedSnippet(comment: Token, code: Token, filename: string): Snippet | undefined {
  if (comment.type !== 'html') { return undefined; }
  if (code.type !== 'code') { return undefined; }

  const match = comment.text.trim().match(/^<!--\s*snippet\s*:\s*(.+)\s*-->$/);
  if (!match) { return undefined; }

  return { text: code.text, tags: match[1].trim().split(/\s*,\s*/), filename };
}

/** Scans a list of markdown files for tagged code snippets */
export async function getCodeTokens(files: string[]) {
  return _.flatten(await Bluebird.map(files, async (file) => {
    const tokens = marked.lexer((await dependencies.readFile(file)).toString());
    return (
      getPairs(tokens)
      .map(([comment, code]) => getTaggedSnippet(comment, code, file))
      .filter((snippet): snippet is Snippet => Boolean(snippet))
    );
  }));
}

/** Tests a snippet with all valid actions it has been tagged with */
export function testSnippet(tagActions: TagActions, testDir: string) {
  return async (snippet: Snippet, index: number) => {
    dependencies.console.log(`Running snippet #${index + 1} from ${snippet.filename}:`);
    dependencies.console.log(chalk.cyan(snippet.text));

    for (const tag of snippet.tags) {
      const action = tagActions[tag];
      if (!action) {
        throw new Error(`Unknown tag: ${tag}`);
      }

      dependencies.console.log(`- Action: "${tag}"`);

      const testFilename = `files/${tag}/${index + 1}.${action.extension}`;
      const testPath = path.join(testDir, testFilename);

      await dependencies.mkdirp(path.dirname(testPath));
      await dependencies.writeFile(testPath, snippet.text);
      // TODO: Catch error
      await dependencies.spawnProcess(
        action.command[0],
        [...action.command.slice(1), testFilename],
        { cwd: testDir, stdio: [process.stdin, process.stdout, process.stderr] },
        // TODO: Pipe error through chalk
      );
    }
  };
}

/** Tests code snippets from documentation */
export default async function testSnippets(files: string[], configPath: string, testDir: string) {
  const tagActions: TagActions = JSON.parse((await dependencies.readFile(configPath)).toString());
  const codeTokens = await components.getCodeTokens(files);

  await dependencies.installModule(testDir);
  await Bluebird.mapSeries(codeTokens, components.testSnippet(tagActions, testDir));
}
