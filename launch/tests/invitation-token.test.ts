import test from "node:test";
import assert from "node:assert/strict";
import {loadHelper} from "./load-helper.ts";
const {newInvitationToken,invitationHash,validInvitationToken}=await loadHelper("invitationToken");
test("invitation tokens have 256 bits and are unpredictable between calls",()=>{
  const a=newInvitationToken(),b=newInvitationToken();assert.equal(a.length,64);assert.notEqual(a,b);assert.equal(validInvitationToken(a),true);
});
test("database stores a deterministic hash instead of the bearer token",()=>{
  const token=newInvitationToken();assert.notEqual(invitationHash(token),token);assert.equal(invitationHash(token),invitationHash(token));
});
test("malformed tokens fail validation",()=>{
  for(const v of ["","a".repeat(63),"a".repeat(65),"G".repeat(64)])assert.equal(validInvitationToken(v),false);
});
