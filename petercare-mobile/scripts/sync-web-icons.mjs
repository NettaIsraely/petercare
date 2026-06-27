import { copyFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');

const sourcePath = resolve(rootDir, 'assets', 'icon.png');
const destinationPath = resolve(rootDir, 'public', 'apple-touch-icon.png');

if (!existsSync(sourcePath)) {
  console.warn(`Skipping icon sync: missing source file ${sourcePath}`);
  process.exit(0);
}

copyFileSync(sourcePath, destinationPath);
console.log(`Synced assets/icon.png -> public/apple-touch-icon.png`);
