# Make Ten (web)

A free web version of today's Make Ten puzzle: four digits, use + − × ÷ and
parentheses to make exactly 10, and find as many different ways as you can.

It shows the **same puzzle as the iPhone app** (Make Ten: Math Number Puzzle) on
the same date, so a TikTok viewer, a friend who got a shared result, or a whole
class on a projector can all play along. It links to the App Store app for
streaks, hints, reminders and past puzzles.

Plain HTML, CSS and JavaScript. No server, no build step, no npm packages.

## What it does

- Today's puzzle number, date and four digits, picked at the visitor's local midnight.
- Tap (or type) digits, operators and parentheses; a running total shows when the expression is complete.
- Check gives the same messages as the app ("That makes 9, not 10.", "You already found that one", and so on).
- "Found X of Y" and the list of answers found. Reordered or regrouped answers don't count twice.
- **Show answers**, with a confirm step, for the end of a classroom warm-up.
- **Share**: the phone's share sheet where there is one, otherwise copy to clipboard (or a box to copy by hand).
- "Get Make Ten: Math Number Puzzle" button with a campaign link (`ct=web`), plus Safari's App Store banner.
- Today's progress is saved in this browser only (localStorage). If storage is blocked the page still works, it just doesn't remember.
- No accounts, ads, cookies, analytics or third-party scripts or fonts.

Kept smaller than the app on purpose: today's puzzle only, no hints, streaks, archive or reminders.

## Run it locally

From this folder:

```
python3 -m http.server 8781
```

Then open http://localhost:8781. (Opening `index.html` straight from Finder won't work, because browsers only load JavaScript modules from a web address.)

## Run the tests

Needs Node 18 or later, nothing to install:

```
node --test tests/
```

The tests cover fractions, the parser and its messages, the duplicate rule, the share text, and the daily puzzles.

## How it stays in step with the app

The files in `js/` are line-by-line ports of the app's Swift code:

| Web file | App file |
| --- | --- |
| `js/fraction.js` | `Shared/Fraction.swift` |
| `js/expression.js` | `Shared/MathExpression.swift` |
| `js/solver.js` | `Shared/Solver.swift` |
| `js/daily.js` | `Shared/PuzzleGenerator.swift`, `Shared/DayKey.swift` |
| `js/parser.js` | `MakeTen/ExpressionParser.swift`, `MakeTen/ExpressionBuilder.swift` |
| `js/share.js` | `ShareText` in `MakeTen/HintsAndSharing.swift` |
| `js/app.js` | the page itself (taps, saving, sharing) |

The daily digits come from a seeded random number generator. It needs 64-bit
integer math that wraps around like Swift's `&*` and `&+`, so `daily.js` uses
JavaScript BigInt.

To prove the two match, `tools/main.swift` runs the app's own Swift code and
writes every puzzle from 2026-01-01 to 2027-12-31 (number, digits, answer count
and every answer's text) to `tests/app-puzzles.json`. `tests/daily.test.js`
checks the JavaScript gives exactly the same thing for all 730 days.

If the app's puzzle code ever changes, rebuild the fixture and run the tests:

```
swiftc -O ../MakeTen/Shared/*.swift tools/main.swift -o /tmp/make-fixture
/tmp/make-fixture > tests/app-puzzles.json
node --test tests/
```

Before the end of 2027, rerun it with a later last date in `tools/main.swift`.

## Images

- `img/icon-64.png` and `img/icon-180.png` are the app icon, resized with `sips`.
- `img/share.png` (1200x630, link previews) is drawn by `tools/make-share-image.py`.

## Publishing later (needs the owner's OK first)

Any static host works, because it's just files. For example GitHub Pages:
put this folder in a GitHub repository, then Settings, Pages, deploy from the
main branch. After it has a real address:

1. Change `og:image` in `index.html` to the full address of `img/share.png` (some apps need a full address for previews).
2. Open it in Safari on an iPhone to check the App Store banner shows.
3. Change `ShareText.appLink` in the iPhone app to the web address, so shared results open the puzzle directly.
