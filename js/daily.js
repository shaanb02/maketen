// Picks the same four digits as the iPhone app for every date, with no server.
// Ported from MakeTen/Shared/PuzzleGenerator.swift and DayKey.swift.

import { solutions } from "./solver.js";

// A 64-bit linear congruential generator with Knuth's MMIX constants.
// JavaScript numbers can't hold 64-bit integers exactly, so this uses BigInt,
// and "& MASK" makes the number wrap around at 64 bits like Swift's &* and &+.
const MASK = (1n << 64n) - 1n;
const MULTIPLIER = 6364136223846793005n;
const INCREMENT = 1442695040888963407n;

export class SeededGenerator {
  constructor(seed) {
    this.state = BigInt(seed) & MASK;
    for (let i = 0; i < 4; i++) this.next(); // stir so nearby dates diverge quickly
  }
  next() {
    this.state = (this.state * MULTIPLIER + INCREMENT) & MASK;
    return this.state;
  }
  // A number in 0..bound-1, from the high bits (the most random ones in an LCG).
  nextBelow(bound) {
    if (bound <= 0) return 0;
    return Number((this.next() >> 33n) % BigInt(bound));
  }
}

export const MIN_SOLUTIONS = 3;   // always something left to find after the first answer
export const MAX_SOLUTIONS = 12;  // so "Found 4 of 12" still feels reachable
export const FALLBACK_DIGITS = [1, 2, 3, 4];
const FIRST_DAY = { year: 2026, month: 1, day: 1 }; // puzzle #1

// A day is { year, month, day } with no time zone. "Today" is the visitor's own
// calendar day, so everyone gets a new puzzle at their own midnight, like the app.
export function today(now = new Date()) {
  return { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };
}

// Whole days from `b` to `a`, counted at noon UTC so daylight saving can't shift it.
export function daysBetween(a, b) {
  const ms = (d) => Date.UTC(d.year, d.month - 1, d.day, 12);
  return Math.round((ms(a) - ms(b)) / 86400000);
}

export function puzzleNumber(day) {
  return Math.max(1, daysBetween(day, FIRST_DAY) + 1);
}

// "2026-11-22"
export function dayString(d) {
  const pad = (n, w) => String(n).padStart(w, "0");
  return `${pad(d.year, 4)}-${pad(d.month, 2)}-${pad(d.day, 2)}`;
}

export function puzzleFor(day) {
  // The seed is the date written as a number, like 20261122.
  const seed = Math.max(0, day.year * 10000 + day.month * 100 + day.day);
  const gen = new SeededGenerator(seed);
  const number = puzzleNumber(day);
  for (let i = 0; i < 500; i++) {
    const digits = [0, 1, 2, 3].map(() => gen.nextBelow(9) + 1).sort((a, b) => a - b);
    const sols = solutions(digits);
    if (sols.length >= MIN_SOLUTIONS && sols.length <= MAX_SOLUTIONS) {
      return { day, number, digits, solutions: sols };
    }
  }
  return { day, number, digits: FALLBACK_DIGITS, solutions: solutions(FALLBACK_DIGITS) };
}
