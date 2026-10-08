import test from "node:test";
import assert from "node:assert/strict";
import {loadHelper} from "./load-helper.ts";
const {selectedOrganization}=await loadHelper("selectedOrganization");
const id="12345678-1234-1234-1234-123456789abc";
test("tenant header takes precedence over selected cookie",()=>{
  assert.equal(selectedOrganization(new Request("https://app.test",{headers:{"X-Guard-Org-Id":id,Cookie:"guard_org=87654321-1234-1234-1234-123456789abc"}})),id);
});
test("tenant cookie is read among other cookies",()=>{
  assert.equal(selectedOrganization(new Request("https://app.test",{headers:{Cookie:"session=foo; guard_org="+id+"; other=bar"}})),id);
});
test("malformed tenant cookie is ignored",()=>{
  assert.equal(selectedOrganization(new Request("https://app.test",{headers:{Cookie:"guard_org=../../x"}})),null);
});
