import spawnProcess from 'spawn-process';
import fs from 'fs';
import path from 'path';

const { writeFile, unlink } = fs.promises;

export const dependencies = {
  writeFile,
  unlink,
  spawnProcess,
};

/**
 * Locally installs this module into a folder with NPM
 */
export default async function installModule(dir: string) {
  await dependencies.writeFile(path.join(dir, 'package.json'), JSON.stringify({ private: true }));

  const packageFilename = (await dependencies.spawnProcess('npm', ['pack', '../../'], { cwd: dir })).trim();
  await dependencies.spawnProcess('npm', ['install', packageFilename, '--no-save'], { cwd: dir });
  await dependencies.unlink(path.join(dir, packageFilename));
}
