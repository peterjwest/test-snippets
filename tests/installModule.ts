import sinonTest from 'sinon-mocha-test';
import assertStub from 'sinon-assert-stub';

import installModule, { dependencies } from '../src/installModule';

describe('installModule', () => {
  it('Installs the module.', sinonTest(async (sinon) => {
    const writeFile = sinon.stub(dependencies, 'writeFile').resolves();
    const spawnProcess = sinon.stub(dependencies, 'spawnProcess').resolves('package.tgz');
    const unlink = sinon.stub(dependencies, 'unlink').resolves();

    await installModule('./');

    assertStub.calledOnceWith(writeFile, ['package.json', '{"private":true}']);
    assertStub.calledWith(spawnProcess, [
      ['npm', ['pack', '../../'], { cwd: './' }],
      ['npm', ['install', 'package.tgz', '--no-save'], { cwd: './' }],
    ]);
    assertStub.calledOnceWith(unlink, ['package.tgz']);
  }));
});
