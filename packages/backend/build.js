import { bunPluginPino } from 'bun-plugin-pino';
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';

function build() {
  if (!fs.existsSync(entrypath)) throw 'Entry file not found: ' + entrypath;
  /**@see https://bun.sh/docs/bundler */
  return Bun.build({
    entrypoints: [entrypath],
    outdir: outdir,
    target: 'bun',
    minify: false,
    splitting: true,
    // sourcemap: 'linked',
    /**@see https://github.com/pinojs/pino/blob/main/docs/bundling.md */
    plugins: [bunPluginPino({ transports: ['pino-pretty'] })],
  });
}
/**
 * 修改 bun 将 CommonJS -> ESM 的逻辑，如果 CommonJS 的 __esModule 为 true，则直接视其为 ESM，不进行转换
 * @see https://github.com/oven-sh/bun/issues/12463#issuecomment-2285353340
 */
function modify() {
  const { promise, resolve, reject } = Promise.withResolvers();
  const replaceArgs = [
    'isNodeMode || !mod || !mod.__esModule',
    'isNodeMode && (!mod || !mod.__esModule)',
  ];
  const esmfile = outpath.replace(/\.js$/, '.mjs');
  // let hasReplaced = false;

  const rs = fs.createReadStream(outpath).on('error', reject);
  const ws = fs.createWriteStream(esmfile).on('error', reject);
  const rl = readline
    .createInterface({ input: rs })
    .on('line', (line) => {
      // if (hasReplaced) {
      //   ws.write(line + '\n');
      //   rl.close();
      //   return;
      // }
      const newLine = line.replace(...replaceArgs);
      // if (newLine !== line) hasReplaced = true;
      ws.write(newLine + '\n');
    })
    .on('close', () => {
      ws.end(() => {
        fs.copyFileSync(esmfile, outpath);
        // fs.unlinkSync(esmfile);
        resolve();
      });
    });
  return promise;
}

const root = path.dirname(fileURLToPath(import.meta.url));
const entrypath = path.join(root, 'src/app.ts');
const outdir = path.join(root, 'dist');
const outpath = path.join(
  outdir,
  path.basename(entrypath).replace(/\.ts$/, '.js'),
);
await build();
await modify();
