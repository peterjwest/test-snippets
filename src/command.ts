#!/usr/bin/env node

import testSnippetsCommand from './testSnippetsCommand';

(async () => {
  const chalk = (await import('chalk')).default;
  await testSnippetsCommand(process.argv).catch((error) => {
    console.log(chalk.red(String(error)));
    process.exit(1);
  });
})().catch((error) => {
  console.log(error);
  process.exit(1);
});
