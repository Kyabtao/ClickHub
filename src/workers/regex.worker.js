import { testRegex } from '../tools/developer/regex-tester/logic.js';
self.onmessage = ({ data }) => {
 try { self.postMessage({ ok: true, result: testRegex(data.pattern, data.flags, data.text, data.replacement) }); }
 catch (error) { self.postMessage({ ok: false, message: error.message }); }
};
