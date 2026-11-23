// Turns what the player typed into an expression, with clear errors for bad input,
// and decides whether an attempt is a new way to make 10.
// Ported from MakeTen/MakeTen/ExpressionParser.swift and ExpressionBuilder.swift.

import { Fraction } from "./fraction.js";
import { OPS, num, bin, evaluate, numbers, canonicalKey, text } from "./expression.js";
import { TARGET } from "./solver.js";

// A token is one button press: { type: "number", value }, { type: "op", op },
// { type: "open" } or { type: "close" }.
export const tok = {
  number: (value) => ({ type: "number", value }),
  op: (op) => ({ type: "op", op }),
  open: { type: "open" },
  close: { type: "close" },
};

export function tokenSymbol(t) {
  if (t.type === "number") return `${t.value}`;
  if (t.type === "op") return OPS[t.op].symbol;
  return t.type === "open" ? "(" : ")";
}

// Why an attempt was not accepted, in words a player can act on.
// The messages are word for word the same as the app's.
export class AttemptError extends Error {
  constructor(code, detail) {
    super(messageFor(code, detail));
    this.code = code;
    this.detail = detail;
  }
}

function messageFor(code, detail) {
  switch (code) {
    case "empty": return "Tap the digits and operators to build an answer.";
    case "missingOperator": return "Put an operator between numbers. Digits can't be joined into bigger numbers.";
    case "missingNumber": return "Each operator needs a number on both sides. Negative numbers aren't allowed.";
    case "emptyParentheses": return "Parentheses need something inside them.";
    case "unclosedParenthesis": return "Every ( needs a matching ).";
    case "extraClosingParenthesis": return "There's a ) without a matching (.";
    case "unknownSymbol": return `"${detail}" isn't a digit or operator.`;
    case "digitsNotAllUsed": return detail === 1
      ? "Use all four digits. 1 digit is not used yet."
      : `Use all four digits. ${detail} digits are not used yet.`;
    case "wrongDigits": return "Use each of today's four digits exactly once.";
    case "divisionByZero": return "You can't divide by zero.";
    case "notTen": return `That makes ${detail}, not 10.`;
    case "duplicate": return `You already found that one: ${detail}`;
    default: return "That didn't work. Try again.";
  }
}

// Grammar, from loosest to tightest binding:
//   sum     := product (("+" | "−") product)*
//   product := factor (("×" | "÷") factor)*
//   factor  := number | "(" sum ")"
export function parseTokens(tokens) {
  checkStructure(tokens);
  const p = { tokens, pos: 0 };
  const expr = parseSum(p);
  if (p.pos < tokens.length) throw new AttemptError("missingOperator"); // safety net
  return expr;
}

// Parses typed text like "8 ÷ (1 − 1 ÷ 5)". Accepts -, *, x and / too.
export function parseText(input) {
  const tokens = [];
  for (const ch of String(input)) {
    if (/\s/.test(ch)) continue;
    const t = charToToken(ch);
    if (!t) throw new AttemptError("unknownSymbol", ch);
    tokens.push(t);
  }
  return parseTokens(tokens);
}

// One typed character to a token, or null if it isn't one we know.
export function charToToken(ch) {
  if (ch >= "0" && ch <= "9") return tok.number(Number(ch));
  if (ch === "+") return tok.op("add");
  if (ch === "−" || ch === "-") return tok.op("subtract");
  if (ch === "×" || ch === "*" || ch === "x") return tok.op("multiply");
  if (ch === "÷" || ch === "/") return tok.op("divide");
  if (ch === "(") return tok.open;
  if (ch === ")") return tok.close;
  return null;
}

// Looks at each pair of neighboring tokens to give a specific message,
// instead of a generic "couldn't read that".
function checkStructure(tokens) {
  if (!tokens.length) throw new AttemptError("empty");
  if (tokens[0].type === "op" || tokens[tokens.length - 1].type === "op") throw new AttemptError("missingNumber");
  let depth = 0;
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i].type;
    if (t === "open") depth += 1;
    if (t === "close") {
      depth -= 1;
      if (depth < 0) throw new AttemptError("extraClosingParenthesis");
    }
    if (i + 1 >= tokens.length) continue;
    const n = tokens[i + 1].type;
    if (t === "open" && n === "close") throw new AttemptError("emptyParentheses");
    if ((t === "number" || t === "close") && (n === "number" || n === "open")) throw new AttemptError("missingOperator");
    if ((t === "op" && n === "op") || (t === "open" && n === "op") || (t === "op" && n === "close")) {
      throw new AttemptError("missingNumber");
    }
  }
  if (depth > 0) throw new AttemptError("unclosedParenthesis");
}

function parseSum(p) {
  let result = parseProduct(p);
  while (p.pos < p.tokens.length && p.tokens[p.pos].type === "op" && OPS[p.tokens[p.pos].op].precedence === 1) {
    const op = p.tokens[p.pos].op;
    p.pos += 1;
    result = bin(op, result, parseProduct(p));
  }
  return result;
}

function parseProduct(p) {
  let result = parseFactor(p);
  while (p.pos < p.tokens.length && p.tokens[p.pos].type === "op" && OPS[p.tokens[p.pos].op].precedence === 2) {
    const op = p.tokens[p.pos].op;
    p.pos += 1;
    result = bin(op, result, parseFactor(p));
  }
  return result;
}

function parseFactor(p) {
  if (p.pos >= p.tokens.length) throw new AttemptError("missingNumber");
  const t = p.tokens[p.pos];
  p.pos += 1;
  if (t.type === "number") return num(t.value);
  if (t.type === "open") {
    const inner = parseSum(p);
    if (p.pos >= p.tokens.length || p.tokens[p.pos].type !== "close") throw new AttemptError("unclosedParenthesis");
    p.pos += 1;
    return inner;
  }
  throw new AttemptError("missingNumber");
}

// What the player has tapped so far. Digits are tracked by tile position,
// not value, so in 4 4 4 9 each 4 tile can be used once.
// An entry is { tile: index } or { token }.
export const MAX_ENTRIES = 24; // long enough for any real answer; stops runaway input

export function usedTiles(entries) {
  return new Set(entries.filter((e) => "tile" in e).map((e) => e.tile));
}

export function entriesToTokens(entries, digits) {
  return entries.map((e) => ("tile" in e ? tok.number(digits[e.tile]) : e.token));
}

// Checks one attempt. `found` is a Map of already-found key -> text.
// Returns { ok: true, solution: { key, text } } or { ok: false, error }.
export function checkAttempt(entries, digits, found, target = TARGET) {
  let expr;
  try {
    expr = parseTokens(entriesToTokens(entries, digits));
  } catch (err) {
    return { ok: false, error: err instanceof AttemptError ? err : new AttemptError("missingOperator") };
  }
  const unused = digits.length - usedTiles(entries).size;
  if (unused > 0) return { ok: false, error: new AttemptError("digitsNotAllUsed", unused) };
  const sortNums = (a) => [...a].sort((x, y) => x - y).join(",");
  if (sortNums(numbers(expr)) !== sortNums(digits)) return { ok: false, error: new AttemptError("wrongDigits") };
  const value = evaluate(expr);
  if (value === null) return { ok: false, error: new AttemptError("divisionByZero") };
  if (!value.equals(new Fraction(target))) return { ok: false, error: new AttemptError("notTen", value.toString()) };
  const key = canonicalKey(expr);
  if (found.has(key)) return { ok: false, error: new AttemptError("duplicate", found.get(key)) };
  return { ok: true, solution: { key, text: text(expr) } };
}

// The running value if what's typed so far is a complete expression, else null.
export function runningValue(entries, digits) {
  try {
    return evaluate(parseTokens(entriesToTokens(entries, digits)));
  } catch {
    return null;
  }
}
