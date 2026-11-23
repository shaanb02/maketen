// The page itself: shows today's puzzle, handles taps and typing, saves progress
// in this browser only, and shares. All the math lives in the other files.

import { tokenSymbol, tok, checkAttempt, runningValue, usedTiles, charToToken, MAX_ENTRIES } from "./parser.js";
import { puzzleFor, today, dayString } from "./daily.js";
import { shareText } from "./share.js";

const $ = (id) => document.getElementById(id);

let puzzle;           // { day, number, digits, solutions }
let entries = [];     // what has been tapped: { tile } or { token }
let found = [];       // [{ key, text }] answers found today
let revealed = false; // pressed "Show answers"

// ---------- Saving (this browser only) ----------
// Storage can be blocked (private mode, strict settings), so every use is
// wrapped in try/catch and the page simply works without saving.

const storageKey = () => `maketen-web:${dayString(puzzle.day)}`;

function save() {
  try {
    localStorage.setItem(storageKey(), JSON.stringify({ found: found.map((f) => f.key), revealed }));
  } catch { /* saving is optional */ }
}

function load() {
  found = [];
  revealed = false;
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey()) || "null");
    if (!saved || !Array.isArray(saved.found)) return;
    // Only keep keys that really are answers to today's puzzle, so an edited or
    // old saved value can never break the page.
    const byKey = new Map(puzzle.solutions.map((s) => [s.key, s]));
    for (const key of saved.found) {
      if (byKey.has(key) && !found.some((f) => f.key === key)) found.push(byKey.get(key));
    }
    revealed = saved.revealed === true;
  } catch { /* bad or blocked storage: start fresh */ }
}

// ---------- State ----------

const isFinished = () => revealed || found.length >= puzzle.solutions.length;

function startDay() {
  puzzle = puzzleFor(today());
  entries = [];
  load();
  const date = new Date(puzzle.day.year, puzzle.day.month - 1, puzzle.day.day)
    .toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
  $("puzzle-label").textContent = `Puzzle #${puzzle.number} · ${date}`;
  document.title = `Make Ten #${puzzle.number}: make 10 from ${puzzle.digits.join(" ")}`;
  setFeedback("");
  render();
}

// ---------- Actions ----------

function tapTile(index) {
  if (isFinished() || entries.length >= MAX_ENTRIES || usedTiles(entries).has(index)) return;
  entries.push({ tile: index });
  setFeedback("");
  render();
}

function tapToken(token) {
  if (isFinished() || entries.length >= MAX_ENTRIES) return;
  entries.push({ token });
  setFeedback("");
  render();
}

function check() {
  if (isFinished()) return;
  const result = checkAttempt(entries, puzzle.digits, new Map(found.map((f) => [f.key, f.text])));
  if (!result.ok) {
    setFeedback(result.error.message, "bad");
    return;
  }
  found.push(result.solution);
  entries = [];
  save();
  setFeedback(isFinished() ? "You found every answer!" : `Nice! ${result.solution.text} = 10`, "good");
  render();
}

function reveal() {
  revealed = true;
  entries = [];
  save();
  $("confirm").hidden = true;
  setFeedback("Here are all of today's answers. Come back tomorrow for a new puzzle.");
  render();
}

async function share() {
  const link = location.origin + location.pathname; // this page's own address, never hardcoded
  const text = shareText({
    number: puzzle.number, digits: puzzle.digits,
    found: found.length, total: puzzle.solutions.length,
    gaveUp: revealed && found.length < puzzle.solutions.length, link,
  });
  if (navigator.share) {
    try { await navigator.share({ text }); return; } catch (err) {
      if (err && err.name === "AbortError") return; // the visitor closed the share sheet
    }
  }
  try {
    await navigator.clipboard.writeText(text);
    setFeedback("Copied. Paste it into a message to share.", "good");
  } catch {
    // No clipboard access: show the text so it can be copied by hand.
    $("copy-box").hidden = false;
    $("copy-text").value = text;
    $("copy-text").select();
  }
}

// ---------- Drawing ----------

function setFeedback(message, kind = "") {
  const el = $("feedback");
  el.textContent = message;
  el.className = "feedback" + (kind ? ` ${kind}` : "");
}

function render() {
  const used = usedTiles(entries);
  const done = isFinished();

  const tiles = $("tiles");
  tiles.replaceChildren(...puzzle.digits.map((d, i) => {
    const b = document.createElement("button");
    b.className = "tile";
    b.textContent = d;
    b.disabled = done || used.has(i);
    b.setAttribute("aria-label", `digit ${d}${used.has(i) ? ", used" : ""}`);
    b.addEventListener("click", () => tapTile(i));
    return b;
  }));

  $("expr").textContent = entries.length
    ? entries.map((e) => ("tile" in e ? `${puzzle.digits[e.tile]}` : tokenSymbol(e.token))).join(" ")
    : done ? "" : "Tap the digits to start";
  const value = runningValue(entries, puzzle.digits);
  $("running").textContent = value ? `= ${value}` : "";

  $("play").hidden = done;
  $("reveal").hidden = done;
  $("found-count").textContent = found.length;
  $("total-count").textContent = puzzle.solutions.length;
  $("found-list").replaceChildren(...found.map((f) => {
    const li = document.createElement("li");
    li.textContent = f.text;
    return li;
  }));

  const foundKeys = new Set(found.map((f) => f.key));
  const missed = puzzle.solutions.filter((s) => !foundKeys.has(s.key));
  $("missed-wrap").hidden = !(revealed && missed.length);
  $("missed-list").replaceChildren(...missed.map((s) => {
    const li = document.createElement("li");
    li.textContent = s.text;
    return li;
  }));
}

// ---------- Wiring ----------

document.querySelectorAll("[data-op]").forEach((b) => b.addEventListener("click", () => tapToken(tok.op(b.dataset.op))));
document.querySelectorAll("[data-paren]").forEach((b) => b.addEventListener("click", () => tapToken(b.dataset.paren === "open" ? tok.open : tok.close)));
$("back").addEventListener("click", () => { entries.pop(); setFeedback(""); render(); });
$("clear").addEventListener("click", () => { entries = []; setFeedback(""); render(); });
$("check").addEventListener("click", check);
$("share").addEventListener("click", share);
$("reveal").addEventListener("click", () => { $("confirm").hidden = false; $("reveal-yes").focus(); });
$("reveal-yes").addEventListener("click", reveal);
$("reveal-no").addEventListener("click", () => { $("confirm").hidden = true; });

// Typing on a computer keyboard. A digit picks the first unused tile with that value.
document.addEventListener("keydown", (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey || isFinished()) return;
  if (e.target instanceof HTMLTextAreaElement) return;
  if (e.key === "Enter") { e.preventDefault(); check(); return; }
  if (e.key === "Backspace") { e.preventDefault(); entries.pop(); setFeedback(""); render(); return; }
  if (e.key === "Escape") { entries = []; setFeedback(""); render(); return; }
  const t = charToToken(e.key);
  if (!t) return;
  e.preventDefault();
  if (t.type === "number") {
    const used = usedTiles(entries);
    const index = puzzle.digits.findIndex((d, i) => d === t.value && !used.has(i));
    if (index === -1) setFeedback(`There's no unused ${t.value} in today's digits.`, "bad");
    else tapTile(index);
  } else {
    tapToken(t);
  }
});

// After midnight (or coming back to an old tab), switch to the new day's puzzle.
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible" && dayString(today()) !== dayString(puzzle.day)) startDay();
});

startDay();
