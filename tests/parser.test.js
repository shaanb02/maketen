import { test } from "node:test";
import assert from "node:assert/strict";
import { parseText, checkAttempt, charToToken, tok, runningValue } from "../js/parser.js";
import { text, evaluate } from "../js/expression.js";

// Turns typed text into builder entries for the given digits, using each tile once.
function entriesFor(input, digits) {
  const used = new Set();
  const entries = [];
  for (const ch of input.replace(/\s/g, "")) {
    const t = charToToken(ch);
    if (t.type === "number") {
      const i = digits.findIndex((d, k) => d === t.value && !used.has(k));
      used.add(i);
      entries.push({ tile: i });
    } else entries.push({ token: t });
  }
  return entries;
}

const messageOf = (input) => {
  try { parseText(input); return null; } catch (e) { return e.message; }
};

test("parses with the right precedence and prints only needed parentheses", () => {
  assert.equal(text(parseText("8/(1-1/5)")), "8 ÷ (1 − 1 ÷ 5)");
  assert.equal(text(parseText("(1+2)*3")), "(1 + 2) × 3");
  assert.equal(text(parseText("8-(3-1)")), "8 − (3 − 1)");
  assert.equal(evaluate(parseText("2+3*4")).toString(), "14");
});

test("bad input gets the same specific messages as the app", () => {
  assert.equal(messageOf(""), "Tap the digits and operators to build an answer.");
  assert.equal(messageOf("12+3"), "Put an operator between numbers. Digits can't be joined into bigger numbers.");
  assert.equal(messageOf("2(3+4)"), "Put an operator between numbers. Digits can't be joined into bigger numbers.");
  assert.equal(messageOf("-1+2"), "Each operator needs a number on both sides. Negative numbers aren't allowed.");
  assert.equal(messageOf("1++2"), "Each operator needs a number on both sides. Negative numbers aren't allowed.");
  assert.equal(messageOf("()"), "Parentheses need something inside them.");
  assert.equal(messageOf("(1+2"), "Every ( needs a matching ).");
  assert.equal(messageOf("1+2)"), "There's a ) without a matching (.");
  assert.equal(messageOf("1+a"), "\"a\" isn't a digit or operator.");
});

test("checking an attempt: wrong total, unused digit, divide by zero, success, duplicate", () => {
  const digits = [3, 5, 7, 8];
  const found = new Map();
  assert.equal(checkAttempt(entriesFor("3+5+7+8", digits), digits, found).error.message, "That makes 23, not 10.");
  assert.equal(checkAttempt(entriesFor("3+7", digits), digits, found).error.message, "Use all four digits. 2 digits are not used yet.");
  assert.equal(checkAttempt(entriesFor("3+5+7", digits), digits, found).error.message, "Use all four digits. 1 digit is not used yet.");
  assert.equal(checkAttempt(entriesFor("3/(5+7)/8", digits), digits, found).error.message, "That makes 1/32, not 10.");

  const ok = checkAttempt(entriesFor("(3+7-8)*5", digits), digits, found);
  assert.ok(ok.ok);
  assert.equal(ok.solution.text, "(3 + 7 − 8) × 5");
  found.set(ok.solution.key, ok.solution.text);

  // Reordering is the same answer, so it is a duplicate.
  const again = checkAttempt(entriesFor("5*(7+3-8)", digits), digits, found);
  assert.equal(again.error.message, "You already found that one: (3 + 7 − 8) × 5");
});

test("dividing by zero is caught", () => {
  const digits = [1, 1, 2, 3];
  const r = checkAttempt(entriesFor("3/(1-1)+2", digits), digits, new Map());
  assert.equal(r.error.message, "You can't divide by zero.");
});

test("running value only shows for a complete expression", () => {
  const digits = [3, 5, 7, 8];
  assert.equal(runningValue(entriesFor("3+5", digits), digits).toString(), "8");
  assert.equal(runningValue([...entriesFor("3+5", digits), { token: tok.op("add") }], digits), null);
});
