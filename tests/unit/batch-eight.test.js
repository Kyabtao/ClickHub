import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { languageString, workerOptions, ocrScale, tidyText, summarize, progressLabel, MAX_OCR_LANGUAGES } from '../../src/tools/media-files/image-ocr/logic.js';
import { OCR_LANGUAGES, OCR_CORE_FILES } from '../../src/tools/media-files/image-ocr/languages.js';
test('OCR language selection is validated and joined for Tesseract', () => {
 assert.equal(languageString(['eng']), 'eng');
 assert.equal(languageString(['eng', 'hin', 'eng']), 'eng+hin');
 assert.throws(() => languageString([]), /at least one/);
 assert.throws(() => languageString(['eng', 'hin', 'spa', 'fra']), new RegExp(`at most ${MAX_OCR_LANGUAGES}`));
 assert.throws(() => languageString(['xyz']), /Unsupported language: xyz/);
});
test('OCR worker options point only at same-origin assets and disable the CDN defaults', () => {
 const options = workerOptions('/ClickHub/', 'https://example.test');
 assert.deepEqual([options.workerPath, options.corePath, options.langPath], ['https://example.test/ClickHub/ocr/worker.min.js', 'https://example.test/ClickHub/ocr/core/', 'https://example.test/ClickHub/ocr/lang']);
 for (const url of [options.workerPath, options.corePath, options.langPath]) assert.equal(new URL(url).origin, 'https://example.test');
 assert.equal(options.workerBlobURL, false); assert.equal(options.cacheMethod, 'none'); assert.equal(options.gzip, true);
 assert.equal(workerOptions('/', 'http://localhost:5173').workerPath, 'http://localhost:5173/ocr/worker.min.js');
 assert.throws(() => workerOptions('//cdn.example/', 'https://example.test'), /served from this site/);
});
test('OCR scaling upscales small images and caps large ones', () => {
 assert.deepEqual(ocrScale(640, 200), { scale: 2, width: 1280, height: 400 });
 assert.deepEqual(ocrScale(1500, 1000), { scale: 1, width: 1500, height: 1000 });
 assert.deepEqual(ocrScale(900, 300), { scale: 2, width: 1800, height: 600 });
 assert.deepEqual(ocrScale(1600, 400).scale, 1);
 assert.deepEqual(ocrScale(1200, 800), { scale: 1, width: 1200, height: 800 });
 assert.deepEqual(ocrScale(8000, 2000), { scale: 0.5, width: 4000, height: 1000 });
 assert.throws(() => ocrScale(0, 10), /Invalid/);
});
test('OCR text tidying keeps lines or joins paragraphs and repairs hyphenation', () => {
 const raw = 'The quick brown  \r\nfox jum-\nped over\n\n\n\nSecond para-\nGraph\n';
 assert.equal(tidyText(raw), 'The quick brown\nfox jum-\nped over\n\nSecond para-\nGraph');
 assert.equal(tidyText(raw, 'paragraphs'), 'The quick brown fox jumped over\n\nSecond para- Graph');
 assert.equal(tidyText('नमस्ते\nदुनिया', 'paragraphs'), 'नमस्ते दुनिया');
 assert.throws(() => tidyText('x', 'columns'), /Unknown layout/);
});
test('OCR summaries and progress labels are readable', () => {
 assert.deepEqual(summarize('Hello world\nsecond line', 91.6), { words: 4, lines: 2, confidence: 92, quality: 'high' });
 assert.deepEqual(summarize('', NaN), { words: 0, lines: 0, confidence: null, quality: 'unknown' });
 assert.equal(summarize('a', 70).quality, 'medium'); assert.equal(summarize('a', 40).quality, 'low');
 assert.equal(progressLabel('recognizing text', 0.426), 'Recognising text… 43%');
 assert.equal(progressLabel('loading language traineddata'), 'Loading language data…');
 assert.equal(progressLabel('something new', 1), 'Working… 100%');
});
test('every OCR language and engine file is installed so the build can self-host it', () => {
 for (const { code } of OCR_LANGUAGES) assert.ok(existsSync(`node_modules/@tesseract.js-data/${code}/4.0.0_best_int/${code}.traineddata.gz`), code);
 for (const file of OCR_CORE_FILES) assert.ok(existsSync(`node_modules/tesseract.js-core/${file}`), file);
 const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
 for (const { code } of OCR_LANGUAGES) assert.ok(pkg.dependencies[`@tesseract.js-data/${code}`], `${code} dependency`);
 assert.match(pkg.scripts.prebuild, /copy-ocr-assets/); assert.match(pkg.scripts.predev, /copy-ocr-assets/);
});
