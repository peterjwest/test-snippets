# test-snippets [![npm version][npm-badge]][npm-url] [![build status][circle-badge]][circle-url] [![coverage status][coverage-badge]][coverage-url]

Flexibly test markdown code examples.

A command to extract and run tagged examples in markdown files, and test them against your NPM package.

## Installation

```bash
npm install test-snippets
```
or
```bash
yarn add test-snippets
```

## Usage

You will need a config file, the default config file location is `tests/snippets/config.json`. This file specifies how to run the snippets.

Take this config file for example:

<!-- snippet: json -->
```json
{
  "es6": { "command": ["node"], "extension": "mjs" },
  "js": { "command": ["node"], "extension": "cjs" },
  "ts": { "command": ["ts-node"], "extension": "ts" }
}
```

This allows you to tag snippets with "es6", "js" or "ts" in your markdown. Add an HTML comment directly above a code block, using any tags you wish to run it with (separated by commas):

```md
    <!-- snippet: es6,ts -->
    ```js
    import path from 'path';

    console.log(path.join('hello', 'world'));
    ```
```

To run the command use:

```bash
npx test-snippets
```
or
```bash
yarn test-snippets
```

This will look through all `.md` files in the repository (excluding anything in node_modules folders) then locally install the NPM package and run the snippets with it. By default it will use `tests/snippets` as the test directory.

You can choose specific files:

```bash
npx test-snippets README.md hello.md
```

Or use glob rules:

```bash
npx test-snippets "docs/**/*.md"
```

You can override the ignored files, as a comma separated list:

```bash
npx test-snippets "**/*.md" --ignore="README.md,hello.md"
```

You can override the config file:

```bash
npx test-snippets --config=config.json
```

You can override the test directory:

```bash
npx test-snippets --test-dir=test-dir/
```

### Programmatic usage

Call with a list of files, a config file and a directory

```js
import testSnippets from 'test-snippets';

(async () => {
  await testSnippets(['file.md', 'other.md'], 'config.json', 'test-dir/');
})();
```

#### With CommonJS / require()

```js
const testSnippets = require('test-snippets');

(async () => {
  await testSnippets(['file.md', 'other.md'], 'config.json', 'test-dir/');
})();
```

[npm-badge]: https://badge.fury.io/js/test-snippets.svg
[npm-url]: https://www.npmjs.com/package/test-snippets

[circle-badge]: https://circleci.com/gh/peterjwest/test-snippets.svg?style=shield
[circle-url]: https://circleci.com/gh/peterjwest/test-snippets

[coverage-badge]: https://coveralls.io/repos/peterjwest/test-snippets/badge.svg?branch=main&service=github
[coverage-url]: https://coveralls.io/github/peterjwest/test-snippets?branch=main
