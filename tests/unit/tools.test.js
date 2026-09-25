import test from 'node:test';
import assert from 'node:assert/strict';
import { stats, transform } from '../../src/tools/text/text-workbench/logic.js';
import { formatJSON } from '../../src/tools/developer/json-formatter/logic.js';
import { generatePassword } from '../../src/tools/security/password-generator/logic.js';
test('text statistics handle empty and Unicode input', () => { assert.deepEqual(stats(''), {words:0,characters:0,lines:0}); assert.equal(stats('hello नमस्ते\nworld').words,3); });
test('text cleaning preserves line boundaries', () => { assert.equal(transform(' a   b\n c ', 'clean'), 'a b\nc'); assert.equal(transform('a\na\nb', 'unique'), 'a\nb'); });
test('JSON formats, minifies, and rejects invalid input', () => { assert.equal(formatJSON('{"a":1}', true), '{"a":1}'); assert.equal(formatJSON('{"a":1}'), '{\n  "a": 1\n}'); assert.throws(() => formatJSON('{')); });
test('password length and validation', () => { for (const length of [8,20,128]) assert.equal(generatePassword(length).length,length); for (const length of [0,129,8.5,NaN]) assert.throws(() => generatePassword(length)); });
