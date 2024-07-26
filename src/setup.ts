import spawnProcess from 'spawn-process';
import { writeFile, unlink, rm } from 'node:fs/promises';
import path from 'node:path';

export const dependencies = {
  writeFile,
  unlink,
  spawnProcess,
  rm,
};

/**
 * Packs and installs the package in the current working directory into the target directory.
 */
export async function installModule(dir: string) {
  await dependencies.writeFile(path.join(dir, 'package.json'), JSON.stringify({ private: true }));

  const packageFilename = (await dependencies.spawnProcess('npm', ['pack', '../../'], { cwd: dir })).trim();
  await dependencies.spawnProcess('npm', ['install', packageFilename, '--no-save'], { cwd: dir });
  await dependencies.unlink(path.join(dir, packageFilename));
  await dependencies.unlink(path.join(dir, 'package.json'));
}

/**
 * Removes any temporary files from the target directory.
 */
export async function cleanupFiles(dir: string) {
  await dependencies.rm(path.join(dir, 'node_modules'), { recursive: true, force: true });
  await dependencies.rm(path.join(dir, 'files'), { recursive: true, force: true });
}
