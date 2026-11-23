// Finds every distinct way to combine the digits into 10.
// Ported from MakeTen/Shared/Solver.swift.

import { Fraction } from "./fraction.js";
import { num, bin, canonicalKey, text } from "./expression.js";

export const TARGET = 10;

// Returns [{ key, text }], one per distinct answer, sorted shortest first.
export function solutions(digits, target = TARGET) {
  if (!digits.length) return [];
  const goal = new Fraction(target);
  const best = new Map(); // canonical key -> shortest readable text
  search(digits.map((d) => ({ expr: num(d), value: new Fraction(d) })), goal, best);
  return [...best.entries()]
    .map(([key, t]) => ({ key, text: t }))
    .sort((a, b) => compareText(a.text, b.text));
}

// Shorter text first, then alphabetical (the app sorts the same way).
export function compareText(a, b) {
  if (a.length !== b.length) return a.length - b.length;
  return a < b ? -1 : a > b ? 1 : 0;
}

// Repeatedly picks two items, combines them with an operator, and recurses until
// one item is left. Picking every pair in every order covers every grouping.
function search(items, goal, best) {
  if (items.length === 1) {
    if (!items[0].value.equals(goal)) return;
    const key = canonicalKey(items[0].expr);
    const t = text(items[0].expr);
    const existing = best.get(key);
    if (existing !== undefined && compareText(existing, t) <= 0) return;
    best.set(key, t);
    return;
  }
  for (let i = 0; i < items.length; i++) {
    for (let j = 0; j < items.length; j++) {
      if (i === j) continue;
      const a = items[i], b = items[j];
      const rest = items.filter((_, k) => k !== i && k !== j);
      const next = [
        { expr: bin("add", a.expr, b.expr), value: a.value.plus(b.value) },
        { expr: bin("multiply", a.expr, b.expr), value: a.value.times(b.value) },
        { expr: bin("subtract", a.expr, b.expr), value: a.value.minus(b.value) },
      ];
      const quotient = a.value.dividedBy(b.value); // null means division by zero: skip it
      if (quotient !== null) next.push({ expr: bin("divide", a.expr, b.expr), value: quotient });
      for (const item of next) search([...rest, item], goal, best);
    }
  }
}
