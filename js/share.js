// The text people share. The iPhone app builds the same text
// (ShareText.make in MakeTen/MakeTen/HintsAndSharing.swift), so a friend
// always gets today's digits and can try the puzzle right away.
// Words and numbers only, no emoji grid.

const ways = (n) => (n === 1 ? "1 way" : `${n} ways`);
const withHints = (h) => (h <= 0 ? "" : h === 1 ? " with 1 hint" : ` with ${h} hints`);

export function shareText({ number, digits, found, total, streak = 0, hintsUsed = 0, gaveUp = false, link }) {
  const lines = [`Make Ten #${number}: make 10 from ${digits.join(" ")}`];
  const hints = withHints(hintsUsed);
  if (total > 0 && found >= total) {
    lines.push(total === 1 ? `I found the only way${hints}. Can you?` : `I found all ${ways(total)}${hints}. Can you?`);
  } else if (found === 0) {
    lines.push(gaveUp ? `I gave up${hints}. Can you find a way?` : `Can you find all ${ways(total)}?`);
  } else if (gaveUp) {
    lines.push(`I found ${found} of ${ways(total)}${hints} before giving up. Can you beat me?`);
  } else {
    lines.push(`I found ${found} of ${ways(total)}${hints}. Can you beat me?`);
  }
  if (streak > 1) lines.push(`Streak: ${streak} days`);
  lines.push(`Play free: ${link}`);
  return lines.join("\n");
}
