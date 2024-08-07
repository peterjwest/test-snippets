import { marked, Token } from 'marked';
import fs from 'fs';
import path from 'path';
import Bluebird from 'bluebird';
import { spawn } from 'child_process';
import lodash from 'lodash';
import { mkdirp } from 'mkdirp';

import { installModule, cleanupFiles } from './setup';

const { readFile, writeFile } = fs.promises;

export const dependencies = {
  console,
  mkdirp,
  readFile,
  writeFile,
  installModule,
  cleanupFiles,
  spawn,
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

  const match = (comment.text as string).trim().match(/^<!--\s*snippet\s*:\s*(.+)\s*-->$/);
  if (!match) { return undefined; }

  return { text: (code.text as string), tags: match[1].trim().split(/\s*,\s*/), filename };
}

/** Scans a list of markdown files for tagged code snippets */
export async function getCodeTokens(files: string[]) {
  return lodash.flatten(await Bluebird.map(files, async (file) => {
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
    const chalk = (await import('chalk')).default;

    dependencies.console.log(`\nRunning snippet #${index + 1} from ${snippet.filename}:`);
    dependencies.console.log(chalk.cyan(snippet.text));

    return Bluebird.mapSeries(snippet.tags, async (tag) => {
      const action = tagActions[tag];
      if (!action) {
        throw new Error(`Unknown tag: ${tag}`);
      }

      dependencies.console.log(`Action "${tag}":`);

      const testFilename = `files/${tag}/${index + 1}.${action.extension}`;
      const testPath = path.join(testDir, testFilename);

      await dependencies.mkdirp(path.dirname(testPath));
      await dependencies.writeFile(testPath, snippet.text);

      return new Promise<boolean>((resolve) => {
        const spawned = dependencies.spawn(
          action.command[0],
          [...action.command.slice(1), testFilename],
          { cwd: testDir, stdio: [process.stdin] },
        );

        if (spawned.stdout) {
          spawned.stdout.on('data', (chunk: Buffer) => {
            dependencies.console.log(chunk.toString().replace(/^/gm, '  > '));
          });
        }

        if (spawned.stderr) {
          spawned.stderr.on('data', (chunk: Buffer) => {
            dependencies.console.error(chalk.red(chunk.toString().replace(/^/gm, '  > ')));
          });
        }

        spawned.on('close', (code) => {
          if (code === 0) {
            dependencies.console.log(chalk.green('  ✓ Success'));
          }
          resolve(code === 0);
        });
        spawned.on('error', (error) => {
          dependencies.console.error(chalk.red(`  ✗ Error: ${error.message}`));
          resolve(false);
        });
      });
    });
  };
}

/** Tests code snippets from documentation */
export default async function testSnippets(files: string[], configPath: string, testDir: string, cleanup: boolean) {
  const tagActions = JSON.parse((await dependencies.readFile(configPath)).toString()) as TagActions;
  const codeTokens = await components.getCodeTokens(files);

  await dependencies.installModule(testDir);
  const result = await Bluebird.mapSeries(codeTokens, components.testSnippet(tagActions, testDir));
  if (cleanup) await dependencies.cleanupFiles(testDir);
  return result;
}
