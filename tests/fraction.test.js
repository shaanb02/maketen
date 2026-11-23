import { test } from "node:test";
import assert from "node:assert/strict";
import { Fraction } from "../js/fraction.js";

test("fractions reduce and keep the sign on top", () => {
  const f = new Fraction(6, -4);
  assert.equal(f.numerator, -3);
  assert.equal(f.denominator, 2);
  assert.equal(f.toString(), "-3/2");
  assert.equal(new Fraction(0, -5).toString(), "0");
  assert.equal(new Fraction(7).toString(), "7");
});

test("exact math: 8 ÷ (1 − 1 ÷ 5) is exactly 10", () => {
  const one = new Fraction(1);
  const inner = one.minus(one.dividedBy(new Fraction(5)));
  assert.ok(new Fraction(8).dividedBy(inner).equals(new Fraction(10)));
});

test("dividing by zero gives null instead of crashing", () => {
  assert.equal(new Fraction(3).dividedBy(new Fraction(0)), null);
  assert.throws(() => new Fraction(1, 0));
});
