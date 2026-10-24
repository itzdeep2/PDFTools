import { copyFile, mkdir, rm } from 'node:fs/promises';

const output = new URL('../dist/', import.meta.url);
const assets = ['index.html', 'style.css', 'app.js', 'ss.png'];

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await Promise.all(assets.map((asset) =>
  copyFile(new URL(`../${asset}`, import.meta.url), new URL(asset, output))
));

console.log(`Prepared ${assets.length} static assets in dist/`);