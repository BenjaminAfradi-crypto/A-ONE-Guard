import test from "node:test";
import assert from "node:assert/strict";
import {loadHelper} from "./load-helper.ts";
const {berlinStamp,berlinRange}=await loadHelper("berlinTime");
test("summer and winter times use Berlin timezone independent of host",()=>{
  assert.equal(berlinStamp({year:2026,month:10,day:7},{hour:12,minute:0}).toISOString(),"2026-10-07T10:00:00.000Z");
  assert.equal(berlinStamp({year:2026,month:12,day:7},{hour:12,minute:0}).toISOString(),"2026-12-07T11:00:00.000Z");
});
test("overnight shift advances the local calendar date",()=>{
  const r=berlinRange({year:2026,month:10,day:7},{hour:22,minute:0},{hour:6,minute:0});
  assert.equal(r.startsAt,"2026-10-07T20:00:00.000Z");assert.equal(r.endsAt,"2026-10-08T04:00:00.000Z");
});
test("spring daylight saving gap is rejected",()=>{
  assert.throws(()=>berlinStamp({year:2026,month:3,day:29},{hour:2,minute:30}),/existiert nicht/);
});
test("autumn ambiguous time is rejected rather than guessed",()=>{
  assert.throws(()=>berlinStamp({year:2026,month:10,day:25},{hour:2,minute:30}),/doppeldeutig/);
});
test("shift crossing daylight saving uses actual elapsed time",()=>{
  const r=berlinRange({year:2026,month:3,day:28},{hour:22,minute:0},{hour:6,minute:0});
  assert.equal((Date.parse(r.endsAt)-Date.parse(r.startsAt))/3600000,7);
});
