import { access } from 'node:fs/promises';

const packageFiles = ['fonts/primeicons.woff2', 'mantleicons.css', 'primeicons.css', 'LICENSE', 'README.md'];

await Promise.all(packageFiles.map((file) => access(file)));

console.log(`Verified ${packageFiles.length} package assets.`);
