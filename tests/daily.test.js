import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { puzzleFor, puzzleNumber, dayString, today, SeededGenerator } from "../js/daily.js";

// tests/app-puzzles.json is printed by the iPhone app's own Swift code
// (tools/main.swift). If the JavaScript ever drifts from the app, this fails.
const appPuzzles = JSON.parse(readFileSync(new URL("./app-puzzles.json", import.meta.url), "utf8"));

const parseDay = (s) => { const [year, month, day] = s.split("-").map(Number); return { year, month, day }; };

test("the fixture covers every day of 2026 and 2027", () => {
  assert.equal(appPuzzles.length, 730);
  assert.equal(appPuzzles[0].day, "2026-01-01");
  assert.equal(appPuzzles.at(-1).day, "2027-12-31");
});

test("every day matches the iPhone app: number, digits, answer count and answers", () => {
  for (const app of appPuzzles) {
    const p = puzzleFor(parseDay(app.day));
    assert.equal(dayString(p.day), app.day);
    assert.equal(p.number, app.number, `${app.day} number`);
    assert.deepEqual(p.digits, app.digits, `${app.day} digits`);
    assert.equal(p.solutions.length, app.count, `${app.day} count`);
    assert.deepEqual(p.solutions.map((s) => s.text), app.answers, `${app.day} answers`);
  }
});

test("puzzle numbers start at 1 on January 1 2026 and never go below 1", () => {
  assert.equal(puzzleNumber({ year: 2026, month: 1, day: 1 }), 1);
  assert.equal(puzzleNumber({ year: 2026, month: 10, day: 7 }), 280);
  assert.equal(puzzleNumber({ year: 2025, month: 6, day: 1 }), 1);
});

test("today is the local calendar day", () => {
  assert.deepEqual(today(new Date(2026, 10, 22, 23, 59)), { year: 2026, month: 11, day: 22 });
});

test("the generator wraps at 64 bits and repeats for the same seed", () => {
  const a = new SeededGenerator(20261122), b = new SeededGenerator(20261122);
  for (let i = 0; i < 50; i++) {
    const x = a.next();
    assert.equal(x, b.next());
    assert.ok(x >= 0n && x < (1n << 64n));
  }
  assert.equal(new SeededGenerator(1).nextBelow(0), 0);
});
