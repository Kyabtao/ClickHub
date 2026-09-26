import test from 'node:test';
import assert from 'node:assert/strict';
import { crc32, buildZip, parseZip, extractEntry, safeEntryName, uniqueNames, dosDateTime, fromDosDateTime, formatBytes, baseName } from '../../src/tools/media-files/zip-tool/logic.js';
import { parseQuiz, validate, scoreQuiz, shuffled } from '../../src/tools/education/quiz-builder/logic.js';
import { validateBackup } from '../../src/lib/storage/workspace.js';
const enc = new TextEncoder(), dec = new TextDecoder();
// Created with Python's zipfile (ZIP_DEFLATED) to check interoperability with another implementation.
const PYTHON_ZIP = 'UEsDBBQAAAAIAKlIOl15l0p/EAAAAMIBAAAQAAAAbm90ZXMvcmVhZG1lLnR4dHPOyUzO9ihNUnAeZQxNBgBQSwMEFAAAAAgAqUg6XZBf1KcNAAAACwAAAAkAAABkYXRhLmpzb26rVsrPVrIqKSpNrQUAUEsBAhQDFAAAAAgAqUg6XXmXSn8QAAAAwgEAABAAAAAAAAAAAAAAAIABAAAAAG5vdGVzL3JlYWRtZS50eHRQSwECFAMUAAAACACpSDpdkF/Upw0AAAALAAAACQAAAAAAAAAAAAAAgAE+AAAAZGF0YS5qc29uUEsFBgAAAAACAAIAdQAAAHIAAAAAAA==';
test('ZIP helpers: CRC-32, DOS dates, safe and unique names', () => {
 assert.equal(crc32(enc.encode('123456789')), 0xcbf43926); assert.equal(crc32(new Uint8Array()), 0);
 const when = new Date(2026, 8, 26, 14, 7, 31), stamp = dosDateTime(when);
 assert.deepEqual(fromDosDateTime(stamp.date, stamp.time), new Date(2026, 8, 26, 14, 7, 30));
 assert.equal(fromDosDateTime(dosDateTime(new Date(1970, 0, 1)).date, 0).getFullYear(), 1980);
 assert.equal(safeEntryName('../../etc/passwd'), 'etc/passwd'); assert.equal(safeEntryName('C:\\dir\\.\\a.txt'), 'C:/dir/a.txt'); assert.equal(safeEntryName('/abs/x'), 'abs/x');
 assert.throws(() => safeEntryName('../..'));
 assert.deepEqual(uniqueNames(['a.txt', 'A.txt', 'a.txt', 'dir.v2/readme', 'dir.v2/readme']), ['a.txt', 'A (2).txt', 'a (3).txt', 'dir.v2/readme', 'dir.v2/readme (2)']);
 assert.equal(formatBytes(512), '512 B'); assert.equal(formatBytes(1536), '1.5 KiB'); assert.equal(baseName('a/b/c.txt'), 'c.txt');
});
test('ZIP round trip: deflate/store choice, UTF-8 names, and checksum verification', async () => {
 const files = [{ name: 'hello.txt', data: enc.encode('hello '.repeat(500)) }, { name: 'docs/नमस्ते.md', data: enc.encode('x') }, { name: 'empty.bin', data: new Uint8Array() }];
 const zip = await buildZip(files, { compress: true });
 const entries = parseZip(zip.bytes);
 assert.deepEqual(entries.map(e => [e.name, e.method, e.size]), [['hello.txt', 8, 3000], ['docs/नमस्ते.md', 0, 1], ['empty.bin', 0, 0]]);
 assert.ok(zip.saved > 2900);
 for (let i = 0; i < files.length; i++) assert.deepEqual(await extractEntry(zip.bytes, entries[i]), files[i].data);
 const stored = await buildZip(files, { compress: false });
 assert.ok(parseZip(stored.bytes).every(e => e.method === 0)); assert.equal(stored.saved, 0);
 const damaged = zip.bytes.slice(); damaged[30 + 9 + 2] ^= 0xff;
 await assert.rejects(extractEntry(damaged, parseZip(damaged)[0]), /damaged|Checksum/);
 await assert.rejects(buildZip([]), /at least one/);
});
test('ZIP reader handles other tools and rejects unsupported archives', async () => {
 const bytes = new Uint8Array(Buffer.from(PYTHON_ZIP, 'base64')), entries = parseZip(bytes);
 assert.deepEqual(entries.map(e => [e.name, e.method]), [['notes/readme.txt', 8], ['data.json', 8]]);
 assert.equal(dec.decode(await extractEntry(bytes, entries[0])), 'ClickHub '.repeat(50));
 assert.deepEqual(JSON.parse(dec.decode(await extractEntry(bytes, entries[1]))), { ok: true });
 assert.throws(() => parseZip(enc.encode('not a zip at all, definitely')), /not a ZIP/);
 await assert.rejects(extractEntry(bytes, { ...entries[0], encrypted: true }), /Encrypted/);
 await assert.rejects(extractEntry(bytes, { ...entries[0], method: 14 }), /method 14/);
 await assert.rejects(extractEntry(bytes, { ...entries[0], size: 300 * 1024 * 1024 }), /200 MiB/);
 const zip64 = bytes.slice(); new DataView(zip64.buffer).setUint32(zip64.length - 6, 0xffffffff, true);
 assert.throws(() => parseZip(zip64), /ZIP64/);
});
test('quiz format parses single and multiple answers with helpful errors', () => {
 const quiz = parseQuiz('Q: Capital of Japan?\n- Osaka\n* Tokyo\n\nq) Primes?\nwith a second prompt line\n* 2\n* 7\n- 9');
 assert.equal(quiz.length, 2); assert.equal(quiz[0].multiple, false); assert.equal(quiz[1].multiple, true);
 assert.equal(quiz[1].prompt, 'Primes?\nwith a second prompt line');
 for (const [text, pattern] of [['', /at least one/], ['- orphan', /Line 1: an option must follow/], ['Q: a\n* only', /at least two/], ['Q: a\n- x\n- y', /correct option/], ['Q: a\n* x\n- X', /repeats/], ['Q: a\n* x\n- y\nstray', /Line 4/]]) assert.throws(() => parseQuiz(text), pattern);
 assert.throws(() => parseQuiz(Array.from({ length: 101 }, (_, i) => `Q: ${i}\n* a\n- b`).join('\n\n')), /at most 100/);
});
test('quiz scoring is all-or-nothing per question and records validate', () => {
 const quiz = parseQuiz('Q: a\n- x\n* y\n\nQ: b\n* 1\n* 2\n- 3\n\nQ: c\n* p\n- q');
 const score = scoreQuiz(quiz, [[1], [1], []]);
 assert.deepEqual(score.results.map(r => r.right), [true, false, false]); assert.equal(score.percent, 33.3);
 assert.equal(scoreQuiz(quiz, [[1], [1, 0, 0], [0]]).percent, 100);
 const order = shuffled(10, () => 0.5); assert.deepEqual([...order].sort((a, b) => a - b), [...Array(10).keys()]);
 const record = validate({ title: ' Geo ', questions: 'Q: a\n* x\n- y' });
 assert.deepEqual(record, { title: 'Geo', questions: 'Q: a\n* x\n- y', attempts: 0, best: null });
 for (const bad of [{ questions: 'nonsense' }, { attempts: -1 }, { best: 101 }, { best: '50' }]) assert.throws(() => validate({ ...record, ...bad }));
 assert.equal(validateBackup({ version: 1, tool: 'quiz-builder', records: [{ ...record, id: '1', attempts: 3, best: 66.7 }] }, { id: 'quiz-builder', validate }).records[0].best, 66.7);
});
