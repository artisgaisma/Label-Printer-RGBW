import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import readline from 'node:readline/promises';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const packagePath = path.join(root, 'package.json');
const releaseDir = path.join(root, 'release');
const tempOut = path.join(os.tmpdir(), 'label-printer-build');

function readPackage() {
  return JSON.parse(fs.readFileSync(packagePath, 'utf8'));
}

function writePackage(pkg) {
  fs.writeFileSync(packagePath, `${JSON.stringify(pkg, null, 2)}\n`);
}

function bumpVersion(current, kind) {
  const parts = current.split('.').map((n) => Number(n));
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) {
    throw new Error(`Invalid version in package.json: ${current}`);
  }

  let [major, minor, patch] = parts;
  if (kind === 'major') {
    major += 1;
    minor = 0;
    patch = 0;
  } else if (kind === 'minor') {
    minor += 1;
    patch = 0;
  } else {
    patch += 1;
  }

  return `${major}.${minor}.${patch}`;
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: 'inherit',
    shell: process.platform === 'win32',
    ...options,
  });

  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} failed with exit code ${result.status}`);
  }
}

function copyArtifact(fromDir, fileName) {
  const source = path.join(fromDir, fileName);
  const target = path.join(releaseDir, fileName);
  if (!fs.existsSync(source)) {
    throw new Error(`Expected build output missing: ${source}`);
  }
  fs.copyFileSync(source, target);
  const sizeMb = (fs.statSync(target).size / (1024 * 1024)).toFixed(2);
  console.log(`  -> ${target} (${sizeMb} MB)`);
}

async function resolveVersion(current, argv) {
  const arg = argv[0];

  if (!arg || arg === 'patch') {
    return bumpVersion(current, 'patch');
  }
  if (arg === 'minor' || arg === 'major') {
    return bumpVersion(current, arg);
  }
  if (/^\d+\.\d+\.\d+$/.test(arg)) {
    return arg;
  }
  if (arg === 'ask' || arg === '--ask') {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    const suggested = bumpVersion(current, 'patch');
    const answer = (await rl.question(`Version [${suggested}] (or major/minor/patch/x.y.z): `)).trim();
    rl.close();

    if (!answer || answer === 'patch') return suggested;
    if (answer === 'minor' || answer === 'major') return bumpVersion(current, answer);
    if (/^\d+\.\d+\.\d+$/.test(answer)) return answer;
    throw new Error(`Invalid version input: ${answer}`);
  }

  throw new Error(`Unknown version argument: ${arg}. Use patch, minor, major, x.y.z, or ask.`);
}

async function main() {
  const pkg = readPackage();
  const current = pkg.version;
  const next = await resolveVersion(current, process.argv.slice(2));

  if (next !== current) {
    pkg.version = next;
    writePackage(pkg);
    console.log(`Version: ${current} -> ${next}`);
  } else {
    console.log(`Version: ${next} (unchanged)`);
  }

  fs.mkdirSync(releaseDir, { recursive: true });
  fs.rmSync(tempOut, { recursive: true, force: true });
  fs.mkdirSync(tempOut, { recursive: true });

  console.log('\n1/2 Building web app...');
  run('npm', ['run', 'build']);

  console.log('\n2/2 Packaging installer + portable...');
  run('npx', [
    'electron-builder',
    '--win',
    'nsis',
    'portable',
    `--config.directories.output=${tempOut}`,
  ]);

  const setupName = `Label-Printer-Setup-${next}.exe`;
  const portableName = `Label-Printer-Portable-${next}.exe`;

  console.log('\nCopying release files...');
  copyArtifact(tempOut, setupName);
  copyArtifact(tempOut, portableName);

  console.log('\nDone.');
  console.log(`Installer : release\\${setupName}`);
  console.log(`Portable  : release\\${portableName}`);
}

main().catch((error) => {
  console.error(`\nBuild failed: ${error.message}`);
  process.exit(1);
});
