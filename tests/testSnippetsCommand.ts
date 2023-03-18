import { describe, it } from 'vitest';
import sinonTest from 'sinon-mocha-test';
import assertStub from 'sinon-assert-stub';
import assert from 'assert';

import testSnippetsCommand, { dependencies, commandHelp } from '../src/testSnippetsCommand';

describe('testSnippetsCommand', () => {
  it('Throws an error if --config is supplied but empty', async () => {
    await assert.rejects(
      testSnippetsCommand(['node', 'file.js', '--config', '*.md']),
      new Error('--config must have a value'),
    );
  });

  it('Throws an error if --test-dir is supplied but empty', async () => {
    await assert.rejects(
      testSnippetsCommand(['node', 'file.js', '--test-dir', '*.md']),
      new Error('--test-dir must have a value'),
    );
  });

  it('Throws an error if --ignore is supplied but empty', async () => {
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

    await testSnippetsCommand(['node', 'file.js', 'file1.md', 'file2.md', '*.md']);

    assertStub.notCalled(consoleLog);
    assertStub.calledWith(glob, [
      ['file1.md', { ignore: ['**/node_modules/**'] }],
      ['file2.md', { ignore: ['**/node_modules/**'] }],
      ['*.md', { ignore: ['**/node_modules/**'] }],
    ]);
    assertStub.calledOnceWith(testSnippets, [
      ['file1.md', 'file2.md', 'file3.md'],
      'tests/snippets/config.json',
      'tests/snippets',
    ]);
  }));


  it('Runs testSnippets with default files if not supplied', sinonTest(async (sinon) => {
    const consoleLog = sinon.stub(dependencies.console, 'log');
    const glob = sinon.stub(dependencies, 'glob').resolves(['file1.md', 'file2.md', 'file3.md']);
    const testSnippets = sinon.stub(dependencies, 'testSnippets');

    await testSnippetsCommand(['node', 'file.js']);

    assertStub.notCalled(consoleLog);
    assertStub.calledOnceWith(glob, ['**/*.md', { ignore: ['**/node_modules/**'] }]);
    assertStub.calledOnceWith(testSnippets, [
      ['file1.md', 'file2.md', 'file3.md'],
      'tests/snippets/config.json',
      'tests/snippets',
    ]);
  }));

  it('Runs testSnippets with custom ignore option', sinonTest(async (sinon) => {
    const consoleLog = sinon.stub(dependencies.console, 'log');
    const glob = sinon.stub(dependencies, 'glob').resolves(['file2.md', 'file3.md']);
    const testSnippets = sinon.stub(dependencies, 'testSnippets');

    await testSnippetsCommand(['node', 'file.js', '--ignore=file1.md']);

    assertStub.notCalled(consoleLog);
    assertStub.calledOnceWith(glob, ['**/*.md', { ignore: ['file1.md'] }]);
    assertStub.calledOnceWith(testSnippets, [
      ['file2.md', 'file3.md'],
      'tests/snippets/config.json',
      'tests/snippets',
    ]);
  }));

  it('Runs testSnippets with custom test path and config path', sinonTest(async (sinon) => {
    const consoleLog = sinon.stub(dependencies.console, 'log');
    const glob = sinon.stub(dependencies, 'glob').resolves(['file1.md', 'file2.md', 'file3.md']);
    const testSnippets = sinon.stub(dependencies, 'testSnippets');

    await testSnippetsCommand(['node', 'file.js', '--config=config.json', '--test-dir=spec']);

    assertStub.notCalled(consoleLog);
    assertStub.calledOnceWith(glob, ['**/*.md', { ignore: ['**/node_modules/**'] }]);
    assertStub.calledOnceWith(testSnippets, [
      ['file1.md', 'file2.md', 'file3.md'],
      'config.json',
      'spec',
    ]);
  }));
});
