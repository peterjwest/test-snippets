# Examples

This file contains example snippets for testing purposes.

<!-- snippet: js -->
```js
import { join } from 'path';

console.log(join('foo', 'bar'));
```

<!-- snippet: cjs -->
```js
const { join } = require('path');

console.log(join('foo', 'bar'));
```

<!-- snippet: ts -->
```js
import { join } from 'path';

const parts: string[] = ['foo', 'bar'];

console.log(join(parts[0], parts[1]));
```

<!-- snippet: js, ts -->
```js
import testSnippets from 'test-snippets';

console.log(typeof testSnippets);
```
