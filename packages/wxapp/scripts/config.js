import fs from 'fs-extra';
import { opendir } from 'node:fs/promises';
import { join } from 'node:path';

function toAbspath(path) {
  return join(process.cwd(), path);
}
async function walkFile(dir, callback) {
  for await (const item of await opendir(dir)) {
    const itempath = join(dir, item.name);
    if (item.isDirectory()) {
      await walkFile(itempath, callback);
    } else {
      callback(itempath, item.name);
    }
  }
}

const config = await fs.readJSON(toAbspath('src/app.json'));
const filepaths = [];
await walkFile(toAbspath('src/pages'), (filepath, filename) => {
  if (/\.(html|wxml)$/.test(filename)) {
    filepaths.push(filepath);
  }
});
/**@type {string[]} */
config['pages'] = filepaths.flatMap((e) => {
  const matches = e.match(/(pages[^]+)\.(html|wxml)$/);
  return matches ? matches[1].replaceAll('\\', '/') : [];
});
config['tabBar']['list'] = config['pages'].flatMap((e) => {
  const matches = e.match(/^pages\/([a-z]+)\/index/);
  return matches ? { text: matches[1].toUpperCase(), pagePath: e } : [];
});
await fs.writeJSON(toAbspath('src/app.json'), config, { spaces: 2 });
