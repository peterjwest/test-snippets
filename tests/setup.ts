import { describe, it } from 'vitest';
import sinonTest from 'sinon-mocha-test';
import assertStub from 'sinon-assert-stub';

import { installModule, cleanupFiles, dependencies } from '../src/setup';

describe('installModule', () => {
  it('Installs the module', sinonTest(async (sinon) => {
    const writeFile = sinon.stub(dependencies, 'writeFile').resolves();
    const spawnProcess = sinon.stub(dependencies, 'spawnProcess').resolves('package.tgz');
    const unlink = sinon.stub(dependencies, 'unlink').resolves();

    await installModule('./');

    assertStub.calledOnceWith(writeFile, ['package.json', '{"private":true}']);
    assertStub.calledWith(spawnProcess, [
      ['npm', ['pack', '../../'], { cwd: './' }],
      ['npm', ['install', 'package.tgz', '--no-save'], { cwd: './' }],
    ]);
    assertStub.calledWith(unlink, [
      ['package.tgz'],
      ['package.json'],
    ]);
  }));
});

describe('cleanupFiles', () => {
  it('Cleans up test files', sinonTest(async (sinon) => {
    const rm = sinon.stub(dependencies, 'rm').resolves();

    await cleanupFiles('./');

    assertStub.calledWith(rm, [
      ['node_modules', { recursive: true, force: true }],
      ['files', { recursive: true, force: true }],
    ]);
  }));
});
