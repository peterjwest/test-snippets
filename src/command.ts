#!/usr/bin/env node

import chalk from 'chalk';

import testSnippetsCommand from './testSnippetsCommand';

testSnippetsCommand(process.argv).catch((error) => {
  // tslint:disable-next-line:no-console
  console.log(chalk.red(error.message));
  process.exit(1);
});
