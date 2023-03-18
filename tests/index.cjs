import { describe, it } from 'vitest';
const assertStub = require('sinon-assert-stub');
const sinonTest = require('sinon-mocha-test');

const testSnippets = require('../build/wrapper.cjs');

describe('testSnippets', () => {
  it('Runs all snippets correctly', sinonTest(async (sinon) => {
    const tagActions = {
      JS: { extension: 'js', command: ['cat'] },
      TS: { extension: 'ts', command: ['ls', '-al'] },
    };

    const snippets = [
      {
        tags: ['JS', 'TS'],
        text: 'console.log(\'Hello world\');',
        filename: 'file.md',
      },
      {
        tags: ['JS'],
        text: 'console.log(\'Goodbye world\');',
        filename: 'file.md',
      },
    ];

    const readFile = sinon.stub(testSnippets.dependencies, 'readFile').resolves(JSON.stringify(tagActions));
    const installModule = sinon.stub(testSnippets.dependencies, 'installModule').resolves();
    const getCodeTokens = sinon.stub(testSnippets.components, 'getCodeTokens').resolves(snippets);
    const testSnippet = sinon.stub();
    sinon.stub(testSnippets.components, 'testSnippet').returns(testSnippet);

    await testSnippets(['file.md', 'other.md'], 'config.json', 'tests/');

    assertStub.calledOnceWith(readFile, ['config.json']);
    assertStub.calledOnceWith(installModule, ['tests/']);
    assertStub.calledOnceWith(getCodeTokens, [['file.md', 'other.md']]);
    assertStub.calledStartingWith(testSnippet, [
      [{ tags: ['JS', 'TS'], text: 'console.log(\'Hello world\');', filename: 'file.md' }],
      [{ tags: ['JS'], text: 'console.log(\'Goodbye world\');', filename: 'file.md' }],
    ]);
  }));
});
