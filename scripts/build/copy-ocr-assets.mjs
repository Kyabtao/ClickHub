// Copies the OCR engine, worker, and language data from node_modules into public/ocr/
// so Image OCR never downloads code or models from a third-party CDN.
// public/ocr/ is generated (git-ignored); this runs before `dev` and `build`.
import { copyFile, mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { OCR_LANGUAGES, OCR_CORE_FILES } from '../../src/tools/media-files/image-ocr/languages.js';
const root = fileURLToPath(new URL('../../', import.meta.url));
const require = createRequire(join(root, 'package.json'));
const out = join(root, 'public', 'ocr');
const packageDir = name => dirname(require.resolve(`${name}/package.json`));
const version = async name => JSON.parse(await readFile(join(packageDir(name), 'package.json'), 'utf8')).version;
const files = [
 [join(packageDir('tesseract.js'), 'dist', 'worker.min.js'), 'worker.min.js'],
 ...OCR_CORE_FILES.map(file => [join(packageDir('tesseract.js-core'), file), `core/${file}`]),
 ...OCR_LANGUAGES.map(({ code }) => [join(packageDir(`@tesseract.js-data/${code}`), '4.0.0_best_int', `${code}.traineddata.gz`), `lang/${code}.traineddata.gz`]),
];
await rm(out, { recursive: true, force: true });
let bytes = 0;
for (const [from, to] of files) {
 const target = join(out, to);
 await mkdir(dirname(target), { recursive: true });
 await copyFile(from, target);
 bytes += (await stat(target)).size;
}
await writeFile(join(out, 'VERSIONS.txt'), `tesseract.js ${await version('tesseract.js')}\ntesseract.js-core ${await version('tesseract.js-core')}\nlanguage data 4.0.0_best_int: ${OCR_LANGUAGES.map(l => l.code).join(', ')}\n`);
console.log(`OCR assets: ${files.length} files, ${(bytes / 1048576).toFixed(1)} MiB copied to public/ocr/`);
