import { test } from "node:test";
import assert from "node:assert/strict";
import { shareText } from "../js/share.js";

const base = { number: 326, digits: [4, 4, 4, 9], total: 5, link: "https://example.com/" };

test("share text carries the digits so a friend can try the puzzle", () => {
  assert.equal(shareText({ ...base, found: 3 }),
    "Make Ten #326: make 10 from 4 4 4 9\nI found 3 of 5 ways. Can you beat me?\nPlay free: https://example.com/");
});

test("edge cases read naturally", () => {
  assert.match(shareText({ ...base, found: 5 }), /\nI found all 5 ways\. Can you\?\n/);
  assert.match(shareText({ ...base, found: 0 }), /\nCan you find all 5 ways\?\n/);
  assert.match(shareText({ ...base, found: 0, gaveUp: true }), /\nI gave up\. Can you find a way\?\n/);
  assert.match(shareText({ ...base, found: 2, gaveUp: true, hintsUsed: 1 }), /\nI found 2 of 5 ways with 1 hint before giving up\. Can you beat me\?\n/);
  assert.match(shareText({ ...base, found: 1, total: 1 }), /\nI found the only way\. Can you\?\n/);
});

test("streak shows only when it is more than 1 day, and no emoji or long dashes", () => {
  assert.ok(!shareText({ ...base, found: 1, streak: 1 }).includes("Streak"));
  const t = shareText({ ...base, found: 1, streak: 4, hintsUsed: 2 });
  assert.ok(t.includes("\nStreak: 4 days\n"));
  assert.ok(t.includes("with 2 hints"));
  assert.ok(!/[\u2014\u{1F7E9}\u{1F7E8}\u2B1B]/u.test(t));
});
