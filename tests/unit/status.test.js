import test from 'node:test';
import assert from 'node:assert/strict';
import {tools} from '../../src/app/registry.js';
import {statusEntries,plannedTools} from '../../src/app/tool-status.js';
test('status catalogue covers every registered tool exactly once',()=>{
 const entries=statusEntries(),available=entries.filter(t=>t.status==='Available');
 assert.deepEqual(available.map(t=>t.id),tools.map(t=>t.id));assert.equal(new Set(entries.map(t=>t.name)).size,entries.length);
 assert.equal(entries.filter(t=>t.status==='Planned').length,plannedTools.length);assert.ok(entries.filter(t=>t.status==='Planned').every(t=>!t.id));
});
