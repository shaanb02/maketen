// An arithmetic expression as a tree, like (1 + 2) × 3.
// Ported from MakeTen/Shared/MathExpression.swift, including the rule that
// decides when two answers count as the same one (canonicalKey).

import { Fraction } from "./fraction.js";

// The four operators. The symbols are the real math signs (− is U+2212, not a hyphen).
// × and ÷ bind tighter (precedence 2) than + and − (precedence 1).
export const OPS = {
  add: { symbol: "+", precedence: 1, spoken: "plus" },
  subtract: { symbol: "−", precedence: 1, spoken: "minus" },
  multiply: { symbol: "×", precedence: 2, spoken: "times" },
  divide: { symbol: "÷", precedence: 2, spoken: "divided by" },
};

// Two kinds of node: a number, or an operator with a left and right side.
export const num = (value) => ({ kind: "number", value });
export const bin = (op, left, right) => ({ kind: "binary", op, left, right });

const isOne = (e) => e.kind === "number" && e.value === 1;

// The exact value, or null if it divides by zero anywhere.
export function evaluate(e) {
  if (e.kind === "number") return new Fraction(e.value);
  const a = evaluate(e.left), b = evaluate(e.right);
  if (a === null || b === null) return null;
  switch (e.op) {
    case "add": return a.plus(b);
    case "subtract": return a.minus(b);
    case "multiply": return a.times(b);
    default: return a.dividedBy(b);
  }
}

// Every number in the expression, left to right.
export function numbers(e) {
  return e.kind === "number" ? [e.value] : [...numbers(e.left), ...numbers(e.right)];
}

// Readable text with only the parentheses that are needed: "8 ÷ (1 − 1 ÷ 5)".
export function text(e) { return render(e).text; }

function render(e) {
  if (e.kind === "number") return { text: `${e.value}`, precedence: 3 };
  const op = OPS[e.op];
  const l = render(e.left), r = render(e.right);
  // The left side needs parentheses only if it binds more loosely: (1 + 2) × 3.
  const leftText = l.precedence < op.precedence ? `(${l.text})` : l.text;
  // The right side also needs them after − and ÷ at the same level: 8 − (3 − 1).
  const rightNeeds = r.precedence < op.precedence
    || (r.precedence === op.precedence && (e.op === "subtract" || e.op === "divide"));
  const rightText = rightNeeds ? `(${r.text})` : r.text;
  return { text: `${leftText} ${op.symbol} ${rightText}`, precedence: op.precedence };
}

// A key that is the same for answers that differ only by order or grouping
// of + and −, or of × and ÷ ("2 × 5" and "5 × 2" match, and so do
// "9 − (2 − 3)" and "9 + 3 − 2"). Multiplying or dividing by 1 counts the
// same wherever it happens. Exactly the app's rule, step for step.
export function canonicalKey(e) {
  const ones = { count: 0 }; // shared counter, like Swift's inout parameter
  const stripped = stripOnes(e, ones);
  const body = normalizedKey(stripped, ones);
  return ones.count === 0 ? body : `${body}#ones${ones.count}`;
}

// Removes "x × 1", "1 × x" and "x ÷ 1", counting each one removed.
function stripOnes(e, ones) {
  if (e.kind === "number") return e;
  const a = stripOnes(e.left, ones);
  const b = stripOnes(e.right, ones);
  if ((e.op === "multiply" || e.op === "divide") && isOne(b)) { ones.count += 1; return a; }
  if (e.op === "multiply" && isOne(a)) { ones.count += 1; return b; }
  return bin(e.op, a, b);
}

function normalizedKey(e, ones) {
  if (e.kind === "number") return `${e.value}`;
  const level = OPS[e.op].precedence;
  let positive = [], negative = [];
  collect(e, true, level, positive, negative, ones);

  if (level === 2) {
    // Take out every "× 1" and "÷ 1" and count them instead.
    const removed = positive.filter((k) => k === "1").length + negative.filter((k) => k === "1").length;
    positive = positive.filter((k) => k !== "1");
    negative = negative.filter((k) => k !== "1");
    if (positive.length === 0 && negative.length === 0) {
      ones.count += removed - 1; // only ones, like 1 × 1: one of them is the value
      return "1";
    }
    ones.count += removed;
    if (negative.length === 0 && positive.length === 1) return positive[0]; // "1 × 4" is just "4"
  }
  const tag = level === 1 ? "S" : "P";
  return `${tag}(${positive.sort().join(",")}|${negative.sort().join(",")})`;
}

// Walks down through operators of one level. At level 1 a term after − flips sign;
// at level 2 a factor after ÷ moves to the bottom of the fraction.
function collect(e, isPositive, level, positive, negative, ones) {
  if (e.kind === "binary" && OPS[e.op].precedence === level) {
    const flipsRight = e.op === "subtract" || e.op === "divide";
    collect(e.left, isPositive, level, positive, negative, ones);
    collect(e.right, flipsRight ? !isPositive : isPositive, level, positive, negative, ones);
  } else if (isPositive) {
    positive.push(normalizedKey(e, ones));
  } else {
    negative.push(normalizedKey(e, ones));
  }
}
