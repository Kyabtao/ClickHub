import test from 'node:test';
import assert from 'node:assert/strict';
import { convertEncoding } from '../../src/tools/developer/encoding-converter/logic.js';
import { generateUUIDs } from '../../src/tools/developer/uuid-generator/logic.js';
import { fromTimestamp, toTimestamp } from '../../src/tools/developer/timestamp-converter/logic.js';
import { convertUnit } from '../../src/tools/math-science/unit-converter/logic.js';
test('Base64 round trips Unicode and empty input', () => {
 for (const text of ['', 'hello', 'नमस्ते 👋', 'a\nb']) assert.equal(convertEncoding(convertEncoding(text, 'base64-encode'), 'base64-decode'), text);
 assert.throws(() => convertEncoding('%%%', 'base64-decode'));
 assert.throws(() => convertEncoding('/w==', 'base64-decode'));
});
test('URL component encoding and error handling', () => {
 assert.equal(convertEncoding('a b&c', 'url-encode'), 'a%20b%26c');
 assert.equal(convertEncoding('a%20b%26c', 'url-decode'), 'a b&c');
 assert.throws(() => convertEncoding('%', 'url-decode'));
});
test('UUID generation validates bounds and version', () => {
 const ids = generateUUIDs(500).split('\n');
 assert.equal(ids.length, 500);
 assert.equal(new Set(ids).size, 500);
 for (const id of ids) assert.match(id, /^[a-f\d]{8}-[a-f\d]{4}-4[a-f\d]{3}-[89ab][a-f\d]{3}-[a-f\d]{12}$/);
 for (const n of [0,501,NaN,1.1]) assert.throws(() => generateUUIDs(n));
});
test('timestamps handle epoch, negatives, milliseconds and invalid values', () => {
 assert.match(fromTimestamp('0','seconds'), /1970-01-01T00:00:00.000Z/);
 assert.match(fromTimestamp('-1','seconds'), /1969-12-31T23:59:59.000Z/);
 assert.match(fromTimestamp('1','milliseconds'), /00:00:00.001Z/);
 for(const value of ['', '1.5','Infinity','99999999999999999']) assert.throws(()=>fromTimestamp(value,'seconds'));
 assert.equal(toTimestamp('1970-01-01T00:00:00Z'), 'Seconds: 0\nMilliseconds: 0');
 assert.throws(()=>toTimestamp('2026-02-30T00:00:00Z'));
 assert.throws(()=>toTimestamp('2026-09-25'));
});
test('unit conversions handle scale and temperature offsets', () => {
 assert.equal(convertUnit('1','Length','Miles','Metres'),1609.344);
 assert.equal(convertUnit('1','Mass','Pounds','Kilograms'),0.45359237);
 assert.equal(convertUnit('32','Temperature','Fahrenheit','Celsius'),0);
 assert.equal(convertUnit('100','Temperature','Celsius','Fahrenheit'),212);
 assert.equal(convertUnit('1','Time','Days','Hours'),24);
 for(const value of ['', 'abc', 'Infinity']) assert.throws(()=>convertUnit(value,'Length','Metres','Feet'));
 assert.throws(()=>convertUnit('-1','Temperature','Kelvin','Celsius'));
 assert.throws(()=>convertUnit('1','Length','Metres','Kilograms'));
});
