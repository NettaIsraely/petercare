import { copyFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');
const distDir = resolve(rootDir, 'dist');

const filesToCopy = ['apple-touch-icon.png', 'firebase-messaging-sw.js'];

for (const fileName of filesToCopy) {
  const sourcePath = resolve(rootDir, 'public', fileName);
  const destinationPath = resolve(distDir, fileName);

  if (!existsSync(sourcePath)) {
    console.warn(`Skipping missing file: ${sourcePath}`);
    continue;
  }

  copyFileSync(sourcePath, destinationPath);
  console.log(`Copied ${fileName} to dist/`);
}
