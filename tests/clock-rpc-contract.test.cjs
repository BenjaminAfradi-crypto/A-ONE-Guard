const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const employee = fs.readFileSync(path.join(__dirname,'../employee.js'),'utf8');

test('employee clock-in uses geo RPC with supported method', () => {
  assert.match(employee,/AONE\.rpc\('guard_clock_in_geo',\{p_site:shift\.site_id,p_shift:shift\.id,p_method:'app'/);
  assert.match(employee,/AONE\.rpc\('guard_clock_in_nogeo',\{p_site:shift\.site_id,p_shift:shift\.id,p_method:'manual'/);
});
test('employee clock-out has separate explicit location and manual paths', () => {
  assert.match(employee,/AONE\.rpc\('guard_clock_out_geo',\{p_entry:entry\.id,p_method:'app'/);
  assert.match(employee,/AONE\.rpc\('guard_clock_out_nogeo',\{p_entry:entry\.id,p_method:'manual'/);
});
test('unsupported methods never occur in the employee app', () => {
  assert.doesNotMatch(employee,/app_geo|app_manual/);
});
