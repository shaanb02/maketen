import { test } from "node:test";
import assert from "node:assert/strict";
import { parseText } from "../js/parser.js";
import { canonicalKey } from "../js/expression.js";

const key = (s) => canonicalKey(parseText(s));
const same = (a, b) => assert.equal(key(a), key(b), `${a} should match ${b}`);
const different = (a, b) => assert.notEqual(key(a), key(b), `${a} should not match ${b}`);

test("reordering and regrouping are the same answer", () => {
  same("1+2+3+4", "4+3+2+1");
  same("1+2+3+4", "(1+2)+(3+4)");
  same("2*5", "5*2");
  same("9-(2-3)", "9+3-2");
});

test("multiplying or dividing by 1 counts the same wherever it is", () => {
  same("3*4-2/1", "(3*4-2)/1");
  same("3*4-2/1", "1*3*4-2");
  same("(3-2+9)*1", "3-2+9*1");
});

test("different structures stay different", () => {
  different("2*(3+2)", "2*3+2*2");
  different("8/(1-1/5)", "(8/1-1)/5");
});
