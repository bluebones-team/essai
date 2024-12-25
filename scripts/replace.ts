import { Glob, file, write } from 'bun';

const filepaths = await Array.fromAsync(
  new Glob('packages/**/*.{ts,tsx}').scan(),
);
// console.log(filepaths);
filepaths.forEach(async (path) => {
  const f = file(path);
  const oldText = await f.text();
  const newText = oldText.replace(/\//g, (text, $1, $2) => {
    const result = ``;
    // console.log(text, $1, result);
    return text;
  });
  if (oldText !== newText) {
    console.log(`Replacing ${path}`);
    write(f, newText);
  }
});
