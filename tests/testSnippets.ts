import sinonTest from 'sinon-mocha-test';
import assertStub from 'sinon-assert-stub';
import assert from 'assert';
import { Token } from 'marked';
import multiline from 'multiline-ts';

import testSnippets, {
  getPairs, getTaggedSnippet, getCodeTokens, testSnippet, components, dependencies, TagActions, Snippet,
} from '../src/testSnippets';

describe('testSnippets', () => {
  describe('getPairs', () => {
    it('Returns all consequitive pairs in a list', sinonTest(async (sinon) => {
      assert.deepStrictEqual(getPairs(['a', 'b', 'c', 'd']), [['a', 'b'], ['b', 'c'], ['c', 'd']]);
    }));

    it('Returns an empty list if there are less than two items', sinonTest(async (sinon) => {
      assert.deepStrictEqual(getPairs(['a']), []);
      assert.deepStrictEqual(getPairs([]), []);
    }));
  });

  describe('getTaggedSnippet', () => {
    it('Returns a snippet if there is a tag comment followed by a code block', sinonTest(async (sinon) => {
      const tagToken: Token = {
        type: 'html',
        pre: false,
        text: '<!-- snippet: js,ts -->',
      };
      const codeToken: Token = {
        type: 'code',
        codeBlockStyle: 'indented',
        lang: 'js',
        text: 'console.log("Hello world")',
      };

      const snippet = getTaggedSnippet(tagToken, codeToken, 'file.md');

      assert.deepStrictEqual(snippet, {
        tags: ['js', 'ts'],
        text: 'console.log("Hello world")',
        filename: 'file.md',
      });
    }));

    it('Returns a snippet regardless of tag whitespace', sinonTest(async (sinon) => {
      const tagToken: Token = {
        type: 'html',
        pre: false,
        text: '<!--snippet :  js ,ts  , mocha-->',
      };
      const codeToken: Token = {
        type: 'code',
        codeBlockStyle: 'indented',
        lang: 'js',
        text: 'console.log("Hello world")',
      };

      const snippet = getTaggedSnippet(tagToken, codeToken, 'file.md');

      assert.deepStrictEqual(snippet, {
        tags: ['js', 'ts', 'mocha'],
        text: 'console.log("Hello world")',
        filename: 'file.md',
      });
    }));

    it('Returns undefined if there is no code token', sinonTest(async (sinon) => {
      const tagToken: Token = {
        type: 'html',
        pre: false,
        text: '<!-- snippet: js,ts -->',
      };
      const token: Token = {
        type: 'text',
        text: 'console.log("Hello world")',
      };

      const snippet = getTaggedSnippet(tagToken, token, 'file.md');

      assert.strictEqual(snippet, undefined);
    }));

    it('Returns undefined if there is no tag token', sinonTest(async (sinon) => {
      const token: Token = {
        type: 'text',
        text: 'console.log("Hello world")',
      };
      const codeToken: Token = {
        type: 'code',
        codeBlockStyle: 'indented',
        lang: 'js',
        text: 'console.log("Hello world")',
      };

      const snippet = getTaggedSnippet(token, codeToken, 'file.md');

      assert.strictEqual(snippet, undefined);
    }));

    it('Returns undefined if there is no valid tag token', sinonTest(async (sinon) => {
      const tagToken: Token = {
        type: 'html',
        pre: false,
        text: '<!-- Hello world -->',
      };
      const codeToken: Token = {
        type: 'code',
        codeBlockStyle: 'indented',
        lang: 'js',
        text: 'console.log("Hello world")',
      };

      const snippet = getTaggedSnippet(tagToken, codeToken, 'file.md');

      assert.strictEqual(snippet, undefined);
    }));
  });

  describe('getCodeTokens', () => {
    it('Returns an empty array when given no files', sinonTest(async (sinon) => {
      sinon.stub(dependencies, 'readFile').resolves();
      const tokens = await getCodeTokens([]);
      assert.deepStrictEqual(tokens, []);
    }));

    it('Returns an empty array if there are no valid tagged snippets', sinonTest(async (sinon) => {
      const exampleFile = multiline`
        Some markdown text

        \`\`\`
        // An untagged code snippet
        console.log('Hello world');
        \`\`\`

        <!-- snippet: a,b,c -->
        Some kind of description.
      `;
      sinon.stub(dependencies, 'readFile').resolves(exampleFile);
      const tokens = await getCodeTokens(['file.md']);
      assert.deepStrictEqual(tokens, []);
    }));

    it('Returns snippets if they are correctly tagged', sinonTest(async (sinon) => {
      const exampleFile = multiline`
        Some markdown text

        <!-- snippet: a,b,c -->
        \`\`\`
        // A tagged code snippet
        console.log('Hello world');
        \`\`\`
      `;
      sinon.stub(dependencies, 'readFile').resolves(exampleFile);
      const tokens = await getCodeTokens(['file.md']);
      assert.deepStrictEqual(tokens, [
        {
          tags: ['a', 'b', 'c'],
          text: '// A tagged code snippet\nconsole.log(\'Hello world\');',
          filename: 'file.md',
        },
      ]);
    }));
  });

  describe('testSnippet', () => {
    it('Runs a snippet correctly', sinonTest(async (sinon) => {
      const mkdirp = sinon.stub(dependencies, 'mkdirp').resolves();
      const writeFile = sinon.stub(dependencies, 'writeFile').resolves();
      const spawnProcess = sinon.stub(dependencies, 'spawnProcess').resolves();
      sinon.stub(dependencies.console, 'log');

      const tagActions: TagActions = {
        js: { extension: 'js', command: ['ls', '-al'] },
      };
      await testSnippet(tagActions, './tests/')({
        text: '// Snippet code',
        tags: ['js'],
        filename: 'file.md',
      }, 2);

      assertStub.calledOnceWith(mkdirp, ['tests/files/js']);
      assertStub.calledOnceWith(writeFile, ['tests/files/js/3.js', '// Snippet code']);
      assertStub.calledOnceWith(spawnProcess, [
        'ls', ['-al', 'files/js/3.js'],
        { cwd: './tests/', stdio: [process.stdin, process.stdout, process.stderr] },
      ]);
    }));

    it('Runs a snippet with a custom pattern', sinonTest(async (sinon) => {
      const mkdirp = sinon.stub(dependencies, 'mkdirp').resolves();
      const writeFile = sinon.stub(dependencies, 'writeFile').resolves();
      const spawnProcess = sinon.stub(dependencies, 'spawnProcess').resolves();
      sinon.stub(dependencies.console, 'log');

      const tagActions: TagActions = {
        js: { extension: 'js', command: ['ls', '-al'] },
      };
      await testSnippet(tagActions, './tests/')({
        text: '// Snippet code',
        tags: ['js'],
        filename: 'file.md',
      }, 2);

      assertStub.calledOnceWith(mkdirp, ['tests/files/js']);
      assertStub.calledOnceWith(writeFile, ['tests/files/js/3.js', '// Snippet code']);
      assertStub.calledOnceWith(spawnProcess, [
        'ls', ['-al', 'files/js/3.js'],
        { cwd: './tests/', stdio: [process.stdin, process.stdout, process.stderr] },
      ]);
    }));

    it('Throws an exception if the snippet has an invalid tag', sinonTest(async (sinon) => {
      const mkdirp = sinon.stub(dependencies, 'mkdirp').resolves();
      const writeFile = sinon.stub(dependencies, 'writeFile').resolves();
      const spawnProcess = sinon.stub(dependencies, 'spawnProcess').resolves();
      sinon.stub(dependencies.console, 'log');

      await assert.rejects(testSnippet({ js: { extension: 'js', command: ['ls', '-al'] }}, './tests/')({
        text: '// Snippet code',
        tags: ['ts'],
        filename: 'file.md',
      }, 0), new Error('Unknown tag: ts'));

      assertStub.notCalled(mkdirp);
      assertStub.notCalled(writeFile);
      assertStub.notCalled(spawnProcess);
    }));
  });

  describe('testSnippets', () => {
    it('Runs all snippets correctly', sinonTest(async (sinon) => {
      const tagActions: TagActions = {
        js: { extension: 'js', command: ['cat'] },
        ts: { extension: 'ts', command: ['ls', '-al'] },
      };

      const snippets: Snippet[] = [
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
});
