// Exact fractions, so 8 ÷ (1 − 1 ÷ 5) comes out as exactly 10.
// Plain JavaScript numbers would give 9.999999999999998 for answers like that.
// Ported from MakeTen/Shared/Fraction.swift. The numbers in this game are tiny,
// so normal JavaScript numbers can't overflow here.

function gcd(a, b) {
  let x = a, y = b;
  while (y !== 0) [x, y] = [y, x % y];
  return Math.max(x, 1); // gcd(0, 0) would be 0; 1 keeps the division safe
}

export class Fraction {
  // Always reduced. The sign lives in the numerator; the denominator is always positive.
  constructor(numerator, denominator = 1) {
    if (denominator === 0) throw new Error("Fraction with a zero denominator");
    const d = gcd(Math.abs(numerator), Math.abs(denominator));
    const sign = denominator < 0 ? -1 : 1;
    // "+ 0" turns a -0 into 0, so 0 always prints as "0".
    this.numerator = (sign * numerator) / d + 0;
    this.denominator = (sign * denominator) / d;
  }

  get isZero() { return this.numerator === 0; }

  plus(o) { return new Fraction(this.numerator * o.denominator + o.numerator * this.denominator, this.denominator * o.denominator); }
  minus(o) { return new Fraction(this.numerator * o.denominator - o.numerator * this.denominator, this.denominator * o.denominator); }
  times(o) { return new Fraction(this.numerator * o.numerator, this.denominator * o.denominator); }

  // Returns null when dividing by zero, instead of crashing.
  dividedBy(o) {
    if (o.isZero) return null;
    return new Fraction(this.numerator * o.denominator, this.denominator * o.numerator);
  }

  equals(o) { return this.numerator === o.numerator && this.denominator === o.denominator; }

  // "7", or "7/2" for fractions. Same as the app.
  toString() { return this.denominator === 1 ? `${this.numerator}` : `${this.numerator}/${this.denominator}`; }
}
