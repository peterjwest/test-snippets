import assertStub from 'sinon-assert-stub';
import sinonTest from 'sinon-mocha-test';

import testSnippets, { components, dependencies } from '../build/es6/index.mjs';

describe('testSnippets', () => {
  it('Runs all snippets correctly', sinonTest(async (sinon) => {
    const tagActions = {
      JS: { extension: 'js', command: ['cat'] },
      ts: { extension: 'ts', command: ['ls', '-al'] },
    };

    const snippets = [
      {
        tags: ['js', 'ts'],
        text: 'console.log(\'Hello world\');',
        filename: 'file.md',
      },
      {
        tags: ['js'],
        text: 'console.log(\'Goodbye world\');',
        filename: 'file.md',
      },
    ];

    const readFile = sinon.stub(dependencies, 'readFile').resolves(JSON.stringify(tagActions));
    const installModule = sinon.stub(dependencies, 'installModule').resolves();
    const getCodeTokens = sinon.stub(components, 'getCodeTokens').resolves(snippets);
    const testSnippet = sinon.stub();
    sinon.stub(components, 'testSnippet').returns(testSnippet);

    await testSnippets(['file.md', 'other.md'], 'config.json', 'tests/');

    assertStub.calledOnceWith(readFile, ['config.json']);
    assertStub.calledOnceWith(installModule, ['tests/']);
    assertStub.calledOnceWith(getCodeTokens, [['file.md', 'other.md']]);
    assertStub.calledStartingWith(testSnippet, [
      [{ tags: ['js', 'ts'], text: 'console.log(\'Hello world\');', filename: 'file.md' }],
      [{ tags: ['js'], text: 'console.log(\'Goodbye world\');', filename: 'file.md' }],
    ]);
  }));
});
