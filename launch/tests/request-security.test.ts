import test from "node:test";
import assert from "node:assert/strict";
import {loadHelper} from "./load-helper.ts";
const {requireSameOrigin}=await loadHelper("requestSecurity");
test("same-origin JSON requests work",()=>{
  assert.doesNotThrow(()=>requireSameOrigin(new Request("https://app.example.test/_api/import_apply",{method:"POST",headers:{Origin:"https://app.example.test","Content-Type":"application/json","Sec-Fetch-Site":"same-origin"}})));
});
test("cross-site and foreign-origin requests are blocked",()=>{
  assert.throws(()=>requireSameOrigin(new Request("https://app.example.test/x",{headers:{Origin:"https://evil.example.test","Content-Type":"application/json"}})));
  assert.throws(()=>requireSameOrigin(new Request("https://app.example.test/x",{headers:{"Sec-Fetch-Site":"cross-site","Content-Type":"application/json"}})));
});
test("simple form posts are blocked",()=>{
  assert.throws(()=>requireSameOrigin(new Request("https://app.example.test/x",{headers:{"Content-Type":"text/plain"}})));
});
