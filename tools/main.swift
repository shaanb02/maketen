// Prints the iPhone app's real daily puzzles as JSON, for every day from
// 2026-01-01 to 2027-12-31. The web tests compare the JavaScript port against
// this output, so the web page and the app always show the same puzzle.
//
// Swift only allows top-level code in a file named main.swift, hence the name.
// Build and run it from the maketen-web folder (see README.md):
//   swiftc -O ../MakeTen/Shared/*.swift tools/main.swift -o /tmp/make-fixture
//   /tmp/make-fixture > tests/app-puzzles.json

import Foundation

func jsonString(_ s: String) -> String {
    let data = (try? JSONSerialization.data(withJSONObject: [s], options: [])) ?? Data("[\"\"]".utf8)
    let array = String(decoding: data, as: UTF8.self)
    return String(array.dropFirst().dropLast())  // strip the [ and ]
}

var day = DayKey(year: 2026, month: 1, day: 1)
let last = DayKey(year: 2027, month: 12, day: 31)
var rows: [String] = []
while day <= last {
    let p = PuzzleGenerator.puzzle(for: day)
    let texts = p.solutions.map { jsonString($0.text) }.joined(separator: ",")
    let digits = p.digits.map(String.init).joined(separator: ",")
    rows.append("{\"day\":\"\(day)\",\"number\":\(p.number),\"digits\":[\(digits)],\"count\":\(p.solutions.count),\"answers\":[\(texts)]}")
    day = day.adding(days: 1)
}
print("[\n" + rows.joined(separator: ",\n") + "\n]")
