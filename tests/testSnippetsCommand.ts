import { describe, it } from 'vitest';
import sinonTest from 'sinon-mocha-test';
import assertStub from 'sinon-assert-stub';
import assert from 'assert';
import chalk from 'chalk';

import testSnippetsCommand, { dependencies, commandHelp } from '../src/testSnippetsCommand';

describe('testSnippetsCommand', () => {
  it('Rejects when --config is supplied but empty', async () => {
    await assert.rejects(
      testSnippetsCommand(['node', 'file.js', '--config', '*.md']),
      new Error('--config must have a value'),
    );
  });

  it('Rejects when --test-dir is supplied but empty', async () => {
    await assert.rejects(
      testSnippetsCommand(['node', 'file.js', '--test-dir', '*.md']),
      new Error('--test-dir must have a value'),
    );
  });

  it('Rejects when --ignore is supplied but empty', async () => {
    await assert.rejects(
      testSnippetsCommand(['node', 'file.js', '--ignore', '*.md']),
      new Error('--ignore must have a value'),
    );
  });

  it('Outputs the help message if --help is supplied', sinonTest(async (sinon) => {
    const consoleLog = sinon.stub(dependencies.console, 'log');
    const glob = sinon.stub(dependencies, 'glob');
    const testSnippets = sinon.stub(dependencies, 'testSnippets');

    await testSnippetsCommand(['node', 'file.js', '--help', '*.md', '--ignore=foo.md']);

    assertStub.calledOnceWith(consoleLog, [commandHelp]);
    assertStub.notCalled(glob);
    assertStub.notCalled(testSnippets);
  }));

  it('Runs testSnippets with supplied files', sinonTest(async (sinon) => {
    const consoleLog = sinon.stub(dependencies.console, 'log');
    const glob = sinon.stub(dependencies, 'glob');
    glob.onCall(0).resolves(['file1.md']);
    glob.onCall(1).resolves(['file2.md']);
    glob.onCall(2).resolves(['file1.md', 'file2.md', 'file3.md']);
    const testSnippets = sinon.stub(dependencies, 'testSnippets');
    testSnippets.resolves([[true], [true], [true]]);

    await testSnippetsCommand(['node', 'file.js', 'file1.md', 'file2.md', '*.md']);

    assertStub.calledWith(glob, [
      ['file1.md', { ignore: ['**/node_modules/**'] }],
      ['file2.md', { ignore: ['**/node_modules/**'] }],
      ['*.md', { ignore: ['**/node_modules/**'] }],
    ]);
    assertStub.calledOnceWith(testSnippets, [
      ['file1.md', 'file2.md', 'file3.md'],
      'tests/snippets/config.json',
      'tests/snippets',
      true,
    ]);
    assertStub.calledWith(consoleLog, [[''], [chalk.green('Success: 3/3 snippets passed')]]);
  }));

  it('Runs testSnippets with default files if not supplied', sinonTest(async (sinon) => {
    const consoleLog = sinon.stub(dependencies.console, 'log');
    const glob = sinon.stub(dependencies, 'glob').resolves(['file1.md', 'file2.md', 'file3.md']);
    const testSnippets = sinon.stub(dependencies, 'testSnippets');
    testSnippets.resolves([[true], [true], [true]]);

    await testSnippetsCommand(['node', 'file.js']);

    assertStub.calledOnceWith(glob, ['**/*.md', { ignore: ['**/node_modules/**'] }]);
    assertStub.calledOnceWith(testSnippets, [
      ['file1.md', 'file2.md', 'file3.md'],
      'tests/snippets/config.json',
      'tests/snippets',
      true,
    ]);
    assertStub.calledWith(consoleLog, [[''], [chalk.green('Success: 3/3 snippets passed')]]);
  }));

  it('Runs testSnippets with custom ignore option', sinonTest(async (sinon) => {
    const consoleLog = sinon.stub(dependencies.console, 'log');
    const glob = sinon.stub(dependencies, 'glob').resolves(['file2.md', 'file3.md']);
    const testSnippets = sinon.stub(dependencies, 'testSnippets');
    testSnippets.resolves([[true], [true]]);

    await testSnippetsCommand(['node', 'file.js', '--ignore=file1.md']);

    assertStub.calledOnceWith(glob, ['**/*.md', { ignore: ['file1.md'] }]);
    assertStub.calledOnceWith(testSnippets, [
      ['file2.md', 'file3.md'],
      'tests/snippets/config.json',
      'tests/snippets',
      true,
    ]);
    assertStub.calledWith(consoleLog, [[''], [chalk.green('Success: 2/2 snippets passed')]]);
  }));

  it('Runs testSnippets with custom test path and config path', sinonTest(async (sinon) => {
    const consoleLog = sinon.stub(dependencies.console, 'log');
    const glob = sinon.stub(dependencies, 'glob').resolves(['file1.md', 'file2.md', 'file3.md']);
    const testSnippets = sinon.stub(dependencies, 'testSnippets');
    testSnippets.resolves([[true], [true], [true]]);

    await testSnippetsCommand(['node', 'file.js', '--config=config.json', '--test-dir=spec', '--cleanup']);

    assertStub.calledOnceWith(glob, ['**/*.md', { ignore: ['**/node_modules/**'] }]);
    assertStub.calledOnceWith(testSnippets, [
      ['file1.md', 'file2.md', 'file3.md'],
      'config.json',
      'spec',
      true,
    ]);
    assertStub.calledWith(consoleLog, [[''], [chalk.green('Success: 3/3 snippets passed')]]);
  }));

  it('Runs testSnippets with cleanup disabled', sinonTest(async (sinon) => {
    const consoleLog = sinon.stub(dependencies.console, 'log');
    const glob = sinon.stub(dependencies, 'glob').resolves(['file1.md', 'file2.md', 'file3.md']);
    const testSnippets = sinon.stub(dependencies, 'testSnippets');
    testSnippets.resolves([[true], [true], [true]]);

    await testSnippetsCommand(['node', 'file.js', '--cleanup=false']);

    assertStub.calledOnceWith(glob, ['**/*.md', { ignore: ['**/node_modules/**'] }]);
    assertStub.calledOnceWith(testSnippets, [
      ['file1.md', 'file2.md', 'file3.md'],
      'tests/snippets/config.json',
      'tests/snippets',
      false,
    ]);
    assertStub.calledWith(consoleLog, [[''], [chalk.green('Success: 3/3 snippets passed')]]);
  }));


  it('Rejects when some testSnippets fail', sinonTest(async (sinon) => {
    const consoleLog = sinon.stub(dependencies.console, 'log');
    const glob = sinon.stub(dependencies, 'glob');
    glob.onCall(0).resolves(['file1.md']);
    glob.onCall(1).resolves(['file2.md']);
    glob.onCall(2).resolves(['file1.md', 'file2.md', 'file3.md']);
    const testSnippets = sinon.stub(dependencies, 'testSnippets');
    testSnippets.resolves([[true], [false], [true]]);

    const error = new Error('Error: 2/3 snippets passed');
    await assert.rejects(testSnippetsCommand(['node', 'file.js', 'file1.md', 'file2.md', '*.md']), error);

    assertStub.calledOnceWith(consoleLog, ['']);
    assertStub.calledWith(glob, [
      ['file1.md', { ignore: ['**/node_modules/**'] }],
      ['file2.md', { ignore: ['**/node_modules/**'] }],
      ['*.md', { ignore: ['**/node_modules/**'] }],
    ]);
    assertStub.calledOnceWith(testSnippets, [
      ['file1.md', 'file2.md', 'file3.md'],
      'tests/snippets/config.json',
      'tests/snippets',
      true,
    ]);
  }));
});
