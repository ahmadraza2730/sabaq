"""Generate Sabaq practice problems: statements, starter code, and tests.

Every problem reads T test cases from standard input and prints one line per
case. Expected output comes from the reference solution in this file.
Run: python3 problems.py out.json
"""
import json
import math
import random
import sys
from collections import deque
from fractions import Fraction

random.seed(20261118)
P = []

CPP_HEAD = "#include <bits/stdc++.h>\nusing namespace std;\n\n"
JAVA_HEAD = "import java.util.*;\nimport java.io.*;\n\n"
# Reads whitespace-separated tokens; works for every problem except line-based ones.
JAVA_READER = """    static StreamTokenizer in;
    static String next() throws IOException { in.nextToken(); return in.sval; }
"""


def problem(slug, title, track, difficulty, statement, input_fmt, output_fmt, constraints,
            cases, solve, render, cpp, java, sample_count=2, hint=None):
    def build(cs):
        inp = f"{len(cs)}\n" + "".join(render(c) for c in cs)
        out = "".join(str(solve(c)) + "\n" for c in cs)
        return {"input": inp, "output": out}

    P.append({
        "slug": slug, "title": title, "track": track, "difficulty": difficulty,
        "statement": statement, "input": input_fmt, "output": output_fmt,
        "constraints": constraints, "hint": hint,
        "sample": build(cases[:sample_count]),
        "tests": build(cases),
        "starter": {"cpp": CPP_HEAD + cpp.strip() + "\n", "java": JAVA_HEAD + java.strip() + "\n"},
    })


def ints(n, lo, hi):
    return [random.randint(lo, hi) for _ in range(n)]


def line(xs):
    return " ".join(map(str, xs)) + "\n"


def tok_java(body, reads_long=False):
    """Java Main with a token reader (handles numbers too large for StreamTokenizer)."""
    return f"""class Main {{
    static BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
    static StringTokenizer st;
    static String next() throws IOException {{
        while (st == null || !st.hasMoreTokens()) st = new StringTokenizer(br.readLine());
        return st.nextToken();
    }}
    static int nextInt() throws IOException {{ return Integer.parseInt(next()); }}
    static long nextLong() throws IOException {{ return Long.parseLong(next()); }}

{body}
}}"""


# ---------------------------------------------------------------- PF

problem(
    "digit-sum", "Sum of digits", "PF", "Easy",
    "Given a non-negative whole number, add up its digits. For 4096 the answer is 4 + 0 + 9 + 6 = 19.",
    "The first line has T, the number of test cases. Each of the next T lines has one number n.",
    "For each test case, print the sum of the digits of n on its own line.",
    ["1 ≤ T ≤ 50", "0 ≤ n ≤ 10^18 (use long long in C++ and long in Java)"],
    [4096, 7, 0, 999999999999999999, 1000000000000000000] + ints(25, 0, 10**18),
    lambda n: sum(map(int, str(n))),
    lambda n: f"{n}\n",
    """
long long digitSum(long long n) {
    // Your code here
    return 0;
}

int main() {
    int t;
    cin >> t;
    while (t--) {
        long long n;
        cin >> n;
        cout << digitSum(n) << "\\n";
    }
}""",
    tok_java("""    static long digitSum(long n) {
        // Your code here
        return 0;
    }

    public static void main(String[] args) throws IOException {
        int t = nextInt();
        StringBuilder out = new StringBuilder();
        while (t-- > 0) out.append(digitSum(nextLong())).append('\\n');
        System.out.print(out);
    }"""),
    hint="n % 10 gives the last digit and n / 10 removes it.",
)

problem(
    "reverse-number", "Reverse a number", "PF", "Easy",
    "Write the digits of a number in reverse order. Leading zeros disappear, so 1200 becomes 21.",
    "The first line has T. Each of the next T lines has one number n.",
    "For each test case, print n with its digits reversed.",
    ["1 ≤ T ≤ 50", "0 ≤ n ≤ 10^9"],
    [1234, 1200, 0, 5, 1000000000] + ints(25, 0, 10**9),
    lambda n: int(str(n)[::-1]),
    lambda n: f"{n}\n",
    """
long long reverseNumber(long long n) {
    // Your code here
    return 0;
}

int main() {
    int t;
    cin >> t;
    while (t--) {
        long long n;
        cin >> n;
        cout << reverseNumber(n) << "\\n";
    }
}""",
    tok_java("""    static long reverseNumber(long n) {
        // Your code here
        return 0;
    }

    public static void main(String[] args) throws IOException {
        int t = nextInt();
        StringBuilder out = new StringBuilder();
        while (t-- > 0) out.append(reverseNumber(nextLong())).append('\\n');
        System.out.print(out);
    }"""),
)


def is_prime(n):
    if n < 2:
        return False
    i = 2
    while i * i <= n:
        if n % i == 0:
            return False
        i += 1
    return True


primes = [n for n in [2, 3, 97, 7919, 1000003, 999999937, 99999999977, 1000000000039] if is_prime(n)]
problem(
    "prime-check", "Is it prime?", "PF", "Easy",
    "A prime number is greater than 1 and divisible only by 1 and itself. Decide whether each number is prime.",
    "The first line has T. Each of the next T lines has one number n.",
    "For each test case, print YES if n is prime and NO otherwise.",
    ["1 ≤ T ≤ 30", "1 ≤ n ≤ 10^12", "Checking divisors up to √n is fast enough; checking up to n is not."],
    [7, 12, 1] + primes + [1000000000000, 999999000001, 4, 999983 * 999979] + ints(10, 1, 10**12),
    lambda n: "YES" if is_prime(n) else "NO",
    lambda n: f"{n}\n",
    """
bool isPrime(long long n) {
    // Your code here
    return false;
}

int main() {
    int t;
    cin >> t;
    while (t--) {
        long long n;
        cin >> n;
        cout << (isPrime(n) ? "YES" : "NO") << "\\n";
    }
}""",
    tok_java("""    static boolean isPrime(long n) {
        // Your code here
        return false;
    }

    public static void main(String[] args) throws IOException {
        int t = nextInt();
        StringBuilder out = new StringBuilder();
        while (t-- > 0) out.append(isPrime(nextLong()) ? "YES" : "NO").append('\\n');
        System.out.print(out);
    }"""),
    hint="Only test divisors i while i * i <= n. Use long long for i * i.",
)

problem(
    "fizz-buzz", "Fizz Buzz", "PF", "Easy",
    "For each number n print Fizz if it is divisible by 3, Buzz if it is divisible by 5, FizzBuzz if it is divisible by both, and the number itself otherwise.",
    "The first line has T. Each of the next T lines has one number n.",
    "For each test case, print one word or number.",
    ["1 ≤ T ≤ 50", "1 ≤ n ≤ 10^9"],
    [3, 10, 15, 7, 30, 1] + ints(30, 1, 10**9),
    lambda n: "FizzBuzz" if n % 15 == 0 else "Fizz" if n % 3 == 0 else "Buzz" if n % 5 == 0 else n,
    lambda n: f"{n}\n",
    """
string fizzBuzz(int n) {
    // Your code here
    return to_string(n);
}

int main() {
    int t;
    cin >> t;
    while (t--) {
        int n;
        cin >> n;
        cout << fizzBuzz(n) << "\\n";
    }
}""",
    tok_java("""    static String fizzBuzz(int n) {
        // Your code here
        return String.valueOf(n);
    }

    public static void main(String[] args) throws IOException {
        int t = nextInt();
        StringBuilder out = new StringBuilder();
        while (t-- > 0) out.append(fizzBuzz(nextInt())).append('\\n');
        System.out.print(out);
    }"""),
    sample_count=4,
)

problem(
    "gcd-lcm", "GCD and LCM", "PF", "Easy",
    "Find the greatest common divisor and the least common multiple of two numbers. For 12 and 18 they are 6 and 36.",
    "The first line has T. Each of the next T lines has two numbers a and b.",
    "For each test case, print the GCD and the LCM separated by a space.",
    ["1 ≤ T ≤ 50", "1 ≤ a, b ≤ 10^9 (the LCM can reach 10^18, so use long long / long)"],
    [(12, 18), (7, 13), (1000000000, 999999999), (5, 5), (1, 1)] + [tuple(ints(2, 1, 10**9)) for _ in range(20)] + [(a * k, b * k) for a, b, k in [(3, 4, 1000), (14, 21, 99999)]],
    lambda c: f"{math.gcd(*c)} {c[0] * c[1] // math.gcd(*c)}",
    lambda c: line(c),
    """
long long gcd2(long long a, long long b) {
    // Your code here (Euclid: gcd(a, b) = gcd(b, a % b))
    return 1;
}

int main() {
    int t;
    cin >> t;
    while (t--) {
        long long a, b;
        cin >> a >> b;
        long long g = gcd2(a, b);
        long long l = 0; // LCM: divide before multiplying to avoid overflow
        cout << g << " " << l << "\\n";
    }
}""",
    tok_java("""    static long gcd(long a, long b) {
        // Your code here (Euclid: gcd(a, b) = gcd(b, a % b))
        return 1;
    }

    public static void main(String[] args) throws IOException {
        int t = nextInt();
        StringBuilder out = new StringBuilder();
        while (t-- > 0) {
            long a = nextLong(), b = nextLong();
            long g = gcd(a, b);
            long l = 0; // LCM: divide before multiplying to avoid overflow
            out.append(g).append(' ').append(l).append('\\n');
        }
        System.out.print(out);
    }"""),
)

sentences = [
    "Programming Fundamentals is fun",
    "FAST NUCES Islamabad",
    "rhythm",
    "AEIOU aeiou!",
    "Data Structures, then Algorithms.",
    "Why try my gym?",
]
words = "the quick brown fox jumps over lazy dog loop array pointer class object stack queue tree graph vowel".split()
for _ in range(14):
    sentences.append(" ".join(random.choice(words).capitalize() if random.random() < .3 else random.choice(words) for _ in range(random.randint(1, 12))) + random.choice(["", ".", "!", "?"]))
problem(
    "count-vowels", "Count the vowels", "PF", "Easy",
    "Count how many letters in a sentence are vowels (a, e, i, o, u), in upper or lower case. Spaces and punctuation are not vowels.",
    "The first line has T. Each of the next T lines is one sentence, which may contain spaces.",
    "For each sentence, print the number of vowels.",
    ["1 ≤ T ≤ 30", "Each sentence has 1 to 200 characters."],
    sentences,
    lambda s: sum(ch in "aeiouAEIOU" for ch in s),
    lambda s: f"{s}\n",
    """
int countVowels(const string& s) {
    // Your code here
    return 0;
}

int main() {
    int t;
    cin >> t;
    string line;
    getline(cin, line); // finish the line that held T
    while (t--) {
        getline(cin, line);
        cout << countVowels(line) << "\\n";
    }
}""",
    """class Main {
    static int countVowels(String s) {
        // Your code here
        return 0;
    }

    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        int t = Integer.parseInt(br.readLine().trim());
        StringBuilder out = new StringBuilder();
        while (t-- > 0) out.append(countVowels(br.readLine())).append('\\n');
        System.out.print(out);
    }
}""",
    hint="Read whole lines: getline in C++, readLine in Java. After reading T with cin, call getline once to skip the rest of that line.",
)


def arr_cases(k, nlo, nhi, lo, hi):
    return [ints(random.randint(nlo, nhi), lo, hi) for _ in range(k)]


problem(
    "array-min-max", "Smallest and largest", "PF", "Easy",
    "Find the smallest and the largest value in an array.",
    "The first line has T. Each test case has a line with n, then a line with n numbers.",
    "For each test case, print the smallest and the largest value separated by a space.",
    ["1 ≤ T ≤ 20", "1 ≤ n ≤ 1000", "-10^9 ≤ each value ≤ 10^9"],
    [[3, 9, -2, 7], [5], [-1, -1, -1]] + arr_cases(8, 1, 1000, -10**9, 10**9),
    lambda a: f"{min(a)} {max(a)}",
    lambda a: f"{len(a)}\n" + line(a),
    """
int main() {
    int t;
    cin >> t;
    while (t--) {
        int n;
        cin >> n;
        vector<long long> a(n);
        for (auto& x : a) cin >> x;
        long long smallest = 0, largest = 0;
        // Your code here
        cout << smallest << " " << largest << "\\n";
    }
}""",
    tok_java("""    public static void main(String[] args) throws IOException {
        int t = nextInt();
        StringBuilder out = new StringBuilder();
        while (t-- > 0) {
            int n = nextInt();
            long[] a = new long[n];
            for (int i = 0; i < n; i++) a[i] = nextLong();
            long smallest = 0, largest = 0;
            // Your code here
            out.append(smallest).append(' ').append(largest).append('\\n');
        }
        System.out.print(out);
    }"""),
    hint="Start both answers at a[0], not at 0: every value might be negative.",
)


def second_largest(a):
    d = sorted(set(a))
    return d[-2] if len(d) >= 2 else -1


problem(
    "second-largest", "Second largest", "PF", "Medium",
    "Find the second largest distinct value in an array. Repeated values count once, so in 5 5 3 the answer is 3. If there is no second distinct value, print -1.",
    "The first line has T. Each test case has a line with n, then a line with n numbers.",
    "For each test case, print the second largest distinct value, or -1.",
    ["1 ≤ T ≤ 20", "1 ≤ n ≤ 1000", "0 ≤ each value ≤ 10^9", "Try to do it in one pass without sorting."],
    [[5, 5, 3], [4, 4, 4], [1, 9, 8, 9], [7]] + arr_cases(8, 1, 1000, 0, 10**9) + [ints(50, 0, 3)],
    second_largest,
    lambda a: f"{len(a)}\n" + line(a),
    """
long long secondLargest(const vector<long long>& a) {
    // Your code here
    return -1;
}

int main() {
    int t;
    cin >> t;
    while (t--) {
        int n;
        cin >> n;
        vector<long long> a(n);
        for (auto& x : a) cin >> x;
        cout << secondLargest(a) << "\\n";
    }
}""",
    tok_java("""    static long secondLargest(long[] a) {
        // Your code here
        return -1;
    }

    public static void main(String[] args) throws IOException {
        int t = nextInt();
        StringBuilder out = new StringBuilder();
        while (t-- > 0) {
            int n = nextInt();
            long[] a = new long[n];
            for (int i = 0; i < n; i++) a[i] = nextLong();
            out.append(secondLargest(a)).append('\\n');
        }
        System.out.print(out);
    }"""),
    sample_count=3,
)

# ---------------------------------------------------------------- OOP

problem(
    "rectangle-class", "Rectangle class", "OOP", "Easy",
    "Write a Rectangle class that stores a width and a height, with methods area() and perimeter(). Use it to answer each test case.",
    "The first line has T. Each of the next T lines has a width w and a height h.",
    "For each test case, print the area and the perimeter separated by a space.",
    ["1 ≤ T ≤ 50", "1 ≤ w, h ≤ 10^9 (the area needs long long / long)"],
    [(3, 4), (1, 1), (10**9, 10**9)] + [tuple(ints(2, 1, 10**9)) for _ in range(20)],
    lambda c: f"{c[0] * c[1]} {2 * (c[0] + c[1])}",
    lambda c: line(c),
    """
class Rectangle {
    long long width, height;
public:
    Rectangle(long long w, long long h) : width(w), height(h) {}
    long long area() const {
        // Your code here
        return 0;
    }
    long long perimeter() const {
        // Your code here
        return 0;
    }
};

int main() {
    int t;
    cin >> t;
    while (t--) {
        long long w, h;
        cin >> w >> h;
        Rectangle r(w, h);
        cout << r.area() << " " << r.perimeter() << "\\n";
    }
}""",
    tok_java("""    static class Rectangle {
        private final long width, height;
        Rectangle(long w, long h) { width = w; height = h; }
        long area() {
            // Your code here
            return 0;
        }
        long perimeter() {
            // Your code here
            return 0;
        }
    }

    public static void main(String[] args) throws IOException {
        int t = nextInt();
        StringBuilder out = new StringBuilder();
        while (t-- > 0) {
            Rectangle r = new Rectangle(nextLong(), nextLong());
            out.append(r.area()).append(' ').append(r.perimeter()).append('\\n');
        }
        System.out.print(out);
    }"""),
)


def bank_case():
    ops = []
    for _ in range(random.randint(1, 15)):
        ops.append((random.choice(["deposit", "withdraw", "withdraw"]), random.randint(1, 5000)))
    return ops


def bank(ops):
    bal = failed = 0
    for op, x in ops:
        if op == "deposit":
            bal += x
        elif x <= bal:
            bal -= x
        else:
            failed += 1
    return f"{bal} {failed}"


problem(
    "bank-account", "Bank account", "OOP", "Medium",
    "Write a BankAccount class that starts with a balance of 0. deposit(x) adds x. withdraw(x) takes x out only if the balance is at least x; otherwise it changes nothing and returns false. Keep the balance private.",
    "The first line has T. Each test case starts with a line holding q, followed by q lines, each either \"deposit x\" or \"withdraw x\".",
    "For each test case, print the final balance and how many withdrawals failed, separated by a space.",
    ["1 ≤ T ≤ 20", "1 ≤ q ≤ 100", "1 ≤ x ≤ 10^6"],
    [[("deposit", 500), ("withdraw", 200), ("withdraw", 400)], [("withdraw", 10)]] + [bank_case() for _ in range(15)],
    bank,
    lambda ops: f"{len(ops)}\n" + "".join(f"{o} {x}\n" for o, x in ops),
    """
class BankAccount {
    long long balance = 0;
public:
    void deposit(long long x) {
        // Your code here
    }
    bool withdraw(long long x) {
        // Your code here
        return false;
    }
    long long getBalance() const { return balance; }
};

int main() {
    int t;
    cin >> t;
    while (t--) {
        int q;
        cin >> q;
        BankAccount account;
        int failed = 0;
        while (q--) {
            string op;
            long long x;
            cin >> op >> x;
            if (op == "deposit") account.deposit(x);
            else if (!account.withdraw(x)) failed++;
        }
        cout << account.getBalance() << " " << failed << "\\n";
    }
}""",
    tok_java("""    static class BankAccount {
        private long balance = 0;
        void deposit(long x) {
            // Your code here
        }
        boolean withdraw(long x) {
            // Your code here
            return false;
        }
        long getBalance() { return balance; }
    }

    public static void main(String[] args) throws IOException {
        int t = nextInt();
        StringBuilder out = new StringBuilder();
        while (t-- > 0) {
            int q = nextInt();
            BankAccount account = new BankAccount();
            int failed = 0;
            while (q-- > 0) {
                String op = next();
                long x = nextLong();
                if (op.equals("deposit")) account.deposit(x);
                else if (!account.withdraw(x)) failed++;
            }
            out.append(account.getBalance()).append(' ').append(failed).append('\\n');
        }
        System.out.print(out);
    }"""),
    sample_count=2,
)


def frac_case():
    return (random.randint(-999, 999), random.randint(1, 999), random.randint(-999, 999), random.randint(1, 999))


def frac_sum(c):
    f = Fraction(c[0], c[1]) + Fraction(c[2], c[3])
    return f"{f.numerator}/{f.denominator}"


problem(
    "fraction-class", "Adding fractions", "OOP", "Medium",
    "Write a Fraction class with a numerator and a denominator that always keeps itself in lowest terms with a positive denominator. Overload + (in C++) or write add() (in Java), and add two fractions.",
    "The first line has T. Each of the next T lines has two fractions written as a/b c/d.",
    "For each test case, print the sum as p/q in lowest terms, with q > 0. Zero is written 0/1.",
    ["1 ≤ T ≤ 40", "-999 ≤ a, c ≤ 999", "1 ≤ b, d ≤ 999"],
    [(1, 2, 1, 3), (1, 4, 3, 4), (-1, 2, 1, 2), (2, 6, -5, 9)] + [frac_case() for _ in range(30)],
    frac_sum,
    lambda c: f"{c[0]}/{c[1]} {c[2]}/{c[3]}\n",
    """
class Fraction {
public:
    long long num, den;
    Fraction(long long n, long long d) : num(n), den(d) {
        // Reduce to lowest terms and make the denominator positive
    }
    Fraction operator+(const Fraction& other) const {
        // Your code here
        return Fraction(0, 1);
    }
};

int main() {
    int t;
    cin >> t;
    while (t--) {
        long long a, b, c, d;
        char slash;
        cin >> a >> slash >> b >> c >> slash >> d;
        Fraction sum = Fraction(a, b) + Fraction(c, d);
        cout << sum.num << "/" << sum.den << "\\n";
    }
}""",
    tok_java("""    static class Fraction {
        final long num, den;
        Fraction(long n, long d) {
            // Reduce to lowest terms and make the denominator positive
            num = n;
            den = d;
        }
        Fraction add(Fraction other) {
            // Your code here
            return new Fraction(0, 1);
        }
    }

    static Fraction parse(String s) {
        String[] p = s.split("/");
        return new Fraction(Long.parseLong(p[0]), Long.parseLong(p[1]));
    }

    public static void main(String[] args) throws IOException {
        int t = nextInt();
        StringBuilder out = new StringBuilder();
        while (t-- > 0) {
            Fraction sum = parse(next()).add(parse(next()));
            out.append(sum.num).append('/').append(sum.den).append('\\n');
        }
        System.out.print(out);
    }"""),
)


def shape_case():
    out = []
    for _ in range(random.randint(1, 10)):
        k = random.choice(["rect", "square", "triangle"])
        if k == "square":
            out.append((k, random.randint(1, 1000)))
        else:
            out.append((k, random.randint(1, 1000), random.randint(1, 1000)))
    return out


def shape_area(shapes):
    twice = 0  # work in halves to stay exact
    for s in shapes:
        if s[0] == "rect":
            twice += 2 * s[1] * s[2]
        elif s[0] == "square":
            twice += 2 * s[1] * s[1]
        else:
            twice += s[1] * s[2]
    return f"{twice // 2}.{5 if twice % 2 else 0}"


problem(
    "shape-areas", "Shapes and polymorphism", "OOP", "Medium",
    "Make an abstract Shape class with a virtual area() method, and three subclasses: Rectangle (width, height), Square (side) and Triangle (base, height, area = base × height / 2). Read a list of shapes into one collection of Shape pointers or references and add up their areas.",
    "The first line has T. Each test case starts with n, followed by n lines: \"rect w h\", \"square s\" or \"triangle b h\".",
    "For each test case, print the total area with exactly one digit after the decimal point.",
    ["1 ≤ T ≤ 20", "1 ≤ n ≤ 10", "1 ≤ every length ≤ 1000"],
    [[("rect", 3, 4), ("square", 2), ("triangle", 5, 3)], [("triangle", 1, 1)]] + [shape_case() for _ in range(15)],
    shape_area,
    lambda shapes: f"{len(shapes)}\n" + "".join(" ".join(map(str, s)) + "\n" for s in shapes),
    """
class Shape {
public:
    virtual double area() const = 0;
    virtual ~Shape() = default;
};

// Write Rectangle, Square and Triangle here

int main() {
    int t;
    cin >> t;
    while (t--) {
        int n;
        cin >> n;
        vector<unique_ptr<Shape>> shapes;
        for (int i = 0; i < n; i++) {
            string kind;
            cin >> kind;
            if (kind == "square") {
                long long side;
                cin >> side;
                // shapes.push_back(make_unique<Square>(side));
            } else {
                long long a, b;
                cin >> a >> b;
                // rect: width a, height b. triangle: base a, height b.
            }
        }
        double total = 0;
        for (const auto& s : shapes) total += s->area();
        cout << fixed << setprecision(1) << total << "\\n";
    }
}""",
    tok_java("""    static abstract class Shape {
        abstract double area();
    }

    // Write Rectangle, Square and Triangle here

    public static void main(String[] args) throws IOException {
        int t = nextInt();
        StringBuilder out = new StringBuilder();
        while (t-- > 0) {
            int n = nextInt();
            List<Shape> shapes = new ArrayList<>();
            for (int i = 0; i < n; i++) {
                String kind = next();
                if (kind.equals("square")) {
                    long side = nextLong();
                    // shapes.add(new Square(side));
                } else {
                    long a = nextLong(), b = nextLong();
                    // rect: width a, height b. triangle: base a, height b.
                }
            }
            double total = 0;
            for (Shape s : shapes) total += s.area();
            out.append(String.format("%.1f", total)).append('\\n');
        }
        System.out.print(out);
    }"""),
)


def cmul(c):
    a, b, x, y = c
    return f"{a * x - b * y} {a * y + b * x}"


problem(
    "complex-multiply", "Complex numbers", "OOP", "Easy",
    "Write a Complex class with a real and an imaginary part, and a method (or overloaded * operator) that multiplies two complex numbers. (a + bi)(c + di) = (ac − bd) + (ad + bc)i.",
    "The first line has T. Each of the next T lines has four whole numbers a b c d, meaning (a + bi) and (c + di).",
    "For each test case, print the real and imaginary parts of the product separated by a space.",
    ["1 ≤ T ≤ 40", "-10^6 ≤ a, b, c, d ≤ 10^6"],
    [(1, 2, 3, 4), (0, 1, 0, 1), (5, 0, -2, 0)] + [tuple(ints(4, -10**6, 10**6)) for _ in range(25)],
    cmul,
    lambda c: line(c),
    """
class Complex {
public:
    long long re, im;
    Complex(long long r, long long i) : re(r), im(i) {}
    Complex operator*(const Complex& o) const {
        // Your code here
        return Complex(0, 0);
    }
};

int main() {
    int t;
    cin >> t;
    while (t--) {
        long long a, b, c, d;
        cin >> a >> b >> c >> d;
        Complex p = Complex(a, b) * Complex(c, d);
        cout << p.re << " " << p.im << "\\n";
    }
}""",
    tok_java("""    static class Complex {
        final long re, im;
        Complex(long re, long im) { this.re = re; this.im = im; }
        Complex times(Complex o) {
            // Your code here
            return new Complex(0, 0);
        }
    }

    public static void main(String[] args) throws IOException {
        int t = nextInt();
        StringBuilder out = new StringBuilder();
        while (t-- > 0) {
            Complex p = new Complex(nextLong(), nextLong()).times(new Complex(nextLong(), nextLong()));
            out.append(p.re).append(' ').append(p.im).append('\\n');
        }
        System.out.print(out);
    }"""),
)

names = "ali sara ahmad hina usman fatima bilal ayesha hamza zainab omar maryam saad noor".split()


def grades_case():
    n = random.randint(1, 8)
    picked = random.sample(names, n)
    return [(nm, *ints(3, 0, 100)) for nm in picked]


def top_student(rows):
    best = sorted(rows, key=lambda r: (-(r[1] + r[2] + r[3]), r[0]))[0]
    return f"{best[0]} {best[1] + best[2] + best[3]}"


problem(
    "top-student", "Top student", "OOP", "Medium",
    "Write a Student class holding a name and three marks, with a total() method. Read the students into a vector or ArrayList and find the one with the highest total. If two students tie, pick the name that comes first alphabetically.",
    "The first line has T. Each test case starts with n, followed by n lines, each with a lowercase name and three marks.",
    "For each test case, print the top student's name and total, separated by a space.",
    ["1 ≤ T ≤ 20", "1 ≤ n ≤ 14", "0 ≤ each mark ≤ 100", "Names are distinct within a test case."],
    [[("ali", 80, 90, 70), ("sara", 95, 85, 60), ("bilal", 90, 90, 60)], [("zainab", 50, 50, 50), ("omar", 60, 40, 50)]] + [grades_case() for _ in range(15)],
    top_student,
    lambda rows: f"{len(rows)}\n" + "".join(" ".join(map(str, r)) + "\n" for r in rows),
    """
class Student {
public:
    string name;
    int m1, m2, m3;
    Student(string n, int a, int b, int c) : name(n), m1(a), m2(b), m3(c) {}
    int total() const {
        // Your code here
        return 0;
    }
};

int main() {
    int t;
    cin >> t;
    while (t--) {
        int n;
        cin >> n;
        vector<Student> students;
        for (int i = 0; i < n; i++) {
            string name;
            int a, b, c;
            cin >> name >> a >> b >> c;
            students.emplace_back(name, a, b, c);
        }
        // Find the top student
        cout << students[0].name << " " << students[0].total() << "\\n";
    }
}""",
    tok_java("""    static class Student {
        final String name;
        final int m1, m2, m3;
        Student(String name, int a, int b, int c) { this.name = name; m1 = a; m2 = b; m3 = c; }
        int total() {
            // Your code here
            return 0;
        }
    }

    public static void main(String[] args) throws IOException {
        int t = nextInt();
        StringBuilder out = new StringBuilder();
        while (t-- > 0) {
            int n = nextInt();
            List<Student> students = new ArrayList<>();
            for (int i = 0; i < n; i++) students.add(new Student(next(), nextInt(), nextInt(), nextInt()));
            Student best = students.get(0);
            // Find the top student
            out.append(best.name).append(' ').append(best.total()).append('\\n');
        }
        System.out.print(out);
    }"""),
)

# ---------------------------------------------------------------- DSA


def two_sum_case():
    while True:
        n = random.randint(2, 1000)
        a = ints(n, -10**6, 10**6)
        i, j = sorted(random.sample(range(n), 2))
        target = a[i] + a[j]
        seen, pairs = {}, 0
        for x in a:
            pairs += seen.get(target - x, 0)
            seen[x] = seen.get(x, 0) + 1
        if pairs == 1:
            return (target, a)


def two_sum(c):
    target, a = c
    seen = {}
    for j, x in enumerate(a):
        if target - x in seen:
            return f"{seen[target - x]} {j}"
        seen.setdefault(x, j)


problem(
    "pair-with-target", "Pair with target sum", "DSA", "Easy",
    "Given an array and a target, find the two positions i < j whose values add up to the target. Exactly one such pair exists. Positions start at 0.",
    "The first line has T. Each test case has a line with n and target, then a line with n numbers.",
    "For each test case, print i and j separated by a space.",
    ["1 ≤ T ≤ 15", "2 ≤ n ≤ 1000", "-10^6 ≤ each value ≤ 10^6", "An O(n) solution with a hash map is expected; O(n²) also passes these limits."],
    [(9, [2, 7, 11, 15]), (6, [3, 2, 4])] + [two_sum_case() for _ in range(13)],
    two_sum,
    lambda c: f"{len(c[1])} {c[0]}\n" + line(c[1]),
    """
pair<int, int> findPair(const vector<long long>& a, long long target) {
    // Your code here
    return {0, 1};
}

int main() {
    int t;
    cin >> t;
    while (t--) {
        int n;
        long long target;
        cin >> n >> target;
        vector<long long> a(n);
        for (auto& x : a) cin >> x;
        auto [i, j] = findPair(a, target);
        cout << i << " " << j << "\\n";
    }
}""",
    tok_java("""    static int[] findPair(long[] a, long target) {
        // Your code here
        return new int[] {0, 1};
    }

    public static void main(String[] args) throws IOException {
        int t = nextInt();
        StringBuilder out = new StringBuilder();
        while (t-- > 0) {
            int n = nextInt();
            long target = nextLong();
            long[] a = new long[n];
            for (int i = 0; i < n; i++) a[i] = nextLong();
            int[] p = findPair(a, target);
            out.append(p[0]).append(' ').append(p[1]).append('\\n');
        }
        System.out.print(out);
    }"""),
    hint="Walk left to right, remembering each value's position in a map. For each new value x, check whether target - x is already in the map.",
)


def bracket_string():
    if random.random() < 0.5:
        # build a balanced one
        s, stack = [], []
        for _ in range(random.randint(1, 40)):
            if stack and random.random() < 0.45:
                s.append({"(": ")", "[": "]", "{": "}"}[stack.pop()])
            else:
                o = random.choice("([{")
                stack.append(o)
                s.append(o)
        while stack:
            s.append({"(": ")", "[": "]", "{": "}"}[stack.pop()])
        s = "".join(s)
        if random.random() < 0.4:
            k = random.randrange(len(s))
            s = s[:k] + random.choice("()[]{}") + s[k + 1:]
        return s
    return "".join(random.choice("()[]{}") for _ in range(random.randint(1, 30)))


def balanced(s):
    st = []
    for ch in s:
        if ch in "([{":
            st.append(ch)
        elif not st or "([{".index(st.pop()) != ")]}".index(ch):
            return "NO"
    return "YES" if not st else "NO"


problem(
    "balanced-brackets", "Balanced brackets", "DSA", "Easy",
    "A string of brackets ( ) [ ] { } is balanced when every opening bracket is closed by the same kind, in the right order. ([]{}) is balanced; ([)] and (( are not. Use a stack.",
    "The first line has T. Each of the next T lines is a string of brackets.",
    "For each string, print YES if it is balanced and NO otherwise.",
    ["1 ≤ T ≤ 40", "1 ≤ length ≤ 10^4"],
    ["([]{})", "([)]", "((", "}", "{[()()]}"] + [bracket_string() for _ in range(30)] + ["(" * 5000 + ")" * 5000],
    balanced,
    lambda s: f"{s}\n",
    """
bool isBalanced(const string& s) {
    // Your code here (use std::stack<char>)
    return false;
}

int main() {
    int t;
    cin >> t;
    while (t--) {
        string s;
        cin >> s;
        cout << (isBalanced(s) ? "YES" : "NO") << "\\n";
    }
}""",
    tok_java("""    static boolean isBalanced(String s) {
        // Your code here (use ArrayDeque<Character> as a stack)
        return false;
    }

    public static void main(String[] args) throws IOException {
        int t = nextInt();
        StringBuilder out = new StringBuilder();
        while (t-- > 0) out.append(isBalanced(next()) ? "YES" : "NO").append('\\n');
        System.out.print(out);
    }"""),
    sample_count=3,
)


def bs_case():
    n = random.randint(1, 1000)
    a = sorted(random.sample(range(-10**6, 10**6), n))
    x = random.choice(a) if random.random() < 0.6 else random.randint(-10**6, 10**6)
    return (x, a)


problem(
    "binary-search", "Binary search", "DSA", "Easy",
    "Given a sorted array of distinct numbers, find the position of x, or print -1 if it is not there. Positions start at 0. Use binary search, not a loop over every element.",
    "The first line has T. Each test case has a line with n and x, then a line with the n sorted numbers.",
    "For each test case, print the position of x or -1.",
    ["1 ≤ T ≤ 30", "1 ≤ n ≤ 1000", "-10^6 ≤ values, x ≤ 10^6"],
    [(7, [1, 3, 5, 7, 9]), (4, [1, 3, 5, 7, 9]), (1, [1])] + [bs_case() for _ in range(25)],
    lambda c: c[1].index(c[0]) if c[0] in c[1] else -1,
    lambda c: f"{len(c[1])} {c[0]}\n" + line(c[1]),
    """
int binarySearch(const vector<int>& a, int x) {
    int lo = 0, hi = (int)a.size() - 1;
    // Your code here
    return -1;
}

int main() {
    int t;
    cin >> t;
    while (t--) {
        int n, x;
        cin >> n >> x;
        vector<int> a(n);
        for (auto& v : a) cin >> v;
        cout << binarySearch(a, x) << "\\n";
    }
}""",
    tok_java("""    static int binarySearch(int[] a, int x) {
        int lo = 0, hi = a.length - 1;
        // Your code here
        return -1;
    }

    public static void main(String[] args) throws IOException {
        int t = nextInt();
        StringBuilder out = new StringBuilder();
        while (t-- > 0) {
            int n = nextInt(), x = nextInt();
            int[] a = new int[n];
            for (int i = 0; i < n; i++) a[i] = nextInt();
            out.append(binarySearch(a, x)).append('\\n');
        }
        System.out.print(out);
    }"""),
)


def kadane(a):
    best = cur = a[0]
    for x in a[1:]:
        cur = max(x, cur + x)
        best = max(best, cur)
    return best


problem(
    "max-subarray", "Maximum subarray sum", "DSA", "Medium",
    "Find the largest sum of a contiguous, non-empty part of an array. In -2 1 -3 4 -1 2 1 -5 4 the best part is 4 -1 2 1, with sum 6.",
    "The first line has T. Each test case has a line with n, then a line with n numbers.",
    "For each test case, print the largest sum.",
    ["1 ≤ T ≤ 20", "1 ≤ n ≤ 2·10^4", "-10^4 ≤ each value ≤ 10^4 (sums need long long / long)"],
    [[-2, 1, -3, 4, -1, 2, 1, -5, 4], [-3, -1, -2], [5]] + arr_cases(12, 1, 2000, -10**4, 10**4) + [ints(20000, -10**4, 10**4)],
    kadane,
    lambda a: f"{len(a)}\n" + line(a),
    """
long long maxSubarray(const vector<long long>& a) {
    // Your code here (Kadane's algorithm runs in O(n))
    return 0;
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int t;
    cin >> t;
    while (t--) {
        int n;
        cin >> n;
        vector<long long> a(n);
        for (auto& x : a) cin >> x;
        cout << maxSubarray(a) << "\\n";
    }
}""",
    tok_java("""    static long maxSubarray(long[] a) {
        // Your code here (Kadane's algorithm runs in O(n))
        return 0;
    }

    public static void main(String[] args) throws IOException {
        int t = nextInt();
        StringBuilder out = new StringBuilder();
        while (t-- > 0) {
            int n = nextInt();
            long[] a = new long[n];
            for (int i = 0; i < n; i++) a[i] = nextLong();
            out.append(maxSubarray(a)).append('\\n');
        }
        System.out.print(out);
    }"""),
    hint="Keep the best sum of a part that ends at the current element: either the element alone, or the element added to the previous best.",
)


def longest_unique(s):
    last, start, best = {}, 0, 0
    for i, ch in enumerate(s):
        if last.get(ch, -1) >= start:
            start = last[ch] + 1
        last[ch] = i
        best = max(best, i - start + 1)
    return best


def rand_word(n, alpha="abcdefghijklmnopqrstuvwxyz"):
    return "".join(random.choice(alpha) for _ in range(n))


problem(
    "longest-unique-substring", "Longest part without repeats", "DSA", "Medium",
    "Find the length of the longest contiguous part of a string in which no letter repeats. In abcabcbb it is abc, length 3.",
    "The first line has T. Each of the next T lines is a lowercase string.",
    "For each string, print the length.",
    ["1 ≤ T ≤ 20", "1 ≤ length ≤ 2·10^4"],
    ["abcabcbb", "bbbbb", "pwwkew", "a"] + [rand_word(random.randint(1, 3000), "abcdefghij"[: random.randint(2, 10)]) for _ in range(12)] + [rand_word(20000)],
    longest_unique,
    lambda s: f"{s}\n",
    """
int longestUnique(const string& s) {
    // Your code here (sliding window)
    return 0;
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int t;
    cin >> t;
    while (t--) {
        string s;
        cin >> s;
        cout << longestUnique(s) << "\\n";
    }
}""",
    tok_java("""    static int longestUnique(String s) {
        // Your code here (sliding window)
        return 0;
    }

    public static void main(String[] args) throws IOException {
        int t = nextInt();
        StringBuilder out = new StringBuilder();
        while (t-- > 0) out.append(longestUnique(next())).append('\\n');
        System.out.print(out);
    }"""),
    sample_count=3,
)


def kth_case():
    a = ints(random.randint(1, 1000), -10**6, 10**6)
    return (random.randint(1, len(a)), a)


problem(
    "kth-largest", "K-th largest", "DSA", "Medium",
    "Find the k-th largest value in an array. Equal values count separately, so in 3 3 1 the 2nd largest is 3. A min-heap of size k, or sorting, both work.",
    "The first line has T. Each test case has a line with n and k, then a line with n numbers.",
    "For each test case, print the k-th largest value.",
    ["1 ≤ T ≤ 15", "1 ≤ k ≤ n ≤ 2·10^4", "-10^6 ≤ each value ≤ 10^6"],
    [(2, [3, 2, 1, 5, 6, 4]), (2, [3, 3, 1]), (1, [7])] + [kth_case() for _ in range(10)] + [(10000, ints(20000, -10**6, 10**6))],
    lambda c: sorted(c[1], reverse=True)[c[0] - 1],
    lambda c: f"{len(c[1])} {c[0]}\n" + line(c[1]),
    """
int kthLargest(vector<int>& a, int k) {
    // Your code here (try priority_queue<int, vector<int>, greater<int>>)
    return 0;
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int t;
    cin >> t;
    while (t--) {
        int n, k;
        cin >> n >> k;
        vector<int> a(n);
        for (auto& x : a) cin >> x;
        cout << kthLargest(a, k) << "\\n";
    }
}""",
    tok_java("""    static int kthLargest(int[] a, int k) {
        // Your code here (try PriorityQueue<Integer>, which is a min-heap)
        return 0;
    }

    public static void main(String[] args) throws IOException {
        int t = nextInt();
        StringBuilder out = new StringBuilder();
        while (t-- > 0) {
            int n = nextInt(), k = nextInt();
            int[] a = new int[n];
            for (int i = 0; i < n; i++) a[i] = nextInt();
            out.append(kthLargest(a, k)).append('\\n');
        }
        System.out.print(out);
    }"""),
)


def grid(r, c, p, chars="10"):
    return ["".join(chars[0] if random.random() < p else chars[1] for _ in range(c)) for _ in range(r)]


def islands(g):
    r, c = len(g), len(g[0])
    seen = [[False] * c for _ in range(r)]
    count = 0
    for i in range(r):
        for j in range(c):
            if g[i][j] == "1" and not seen[i][j]:
                count += 1
                seen[i][j] = True
                q = deque([(i, j)])
                while q:
                    x, y = q.popleft()
                    for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                        a, b = x + dx, y + dy
                        if 0 <= a < r and 0 <= b < c and g[a][b] == "1" and not seen[a][b]:
                            seen[a][b] = True
                            q.append((a, b))
    return count


problem(
    "count-islands", "Count the islands", "DSA", "Medium",
    "A map is a grid of 1s (land) and 0s (water). An island is a group of land cells joined up, down, left or right (not diagonally). Count the islands. Use BFS or DFS.",
    "The first line has T. Each test case has a line with r and c, then r lines of c characters, each 0 or 1.",
    "For each test case, print the number of islands.",
    ["1 ≤ T ≤ 15", "1 ≤ r, c ≤ 200"],
    [["11000", "11000", "00100", "00011"], ["111", "010", "111"], ["0"]] + [grid(random.randint(1, 60), random.randint(1, 60), random.random() * .7) for _ in range(10)] + [grid(200, 200, .45)],
    islands,
    lambda g: f"{len(g)} {len(g[0])}\n" + "".join(row + "\n" for row in g),
    """
int countIslands(const vector<string>& grid) {
    // Your code here
    return 0;
}

int main() {
    int t;
    cin >> t;
    while (t--) {
        int r, c;
        cin >> r >> c;
        vector<string> grid(r);
        for (auto& row : grid) cin >> row;
        cout << countIslands(grid) << "\\n";
    }
}""",
    tok_java("""    static int countIslands(char[][] grid) {
        // Your code here
        return 0;
    }

    public static void main(String[] args) throws IOException {
        int t = nextInt();
        StringBuilder out = new StringBuilder();
        while (t-- > 0) {
            int r = nextInt(), c = nextInt();
            char[][] grid = new char[r][];
            for (int i = 0; i < r; i++) grid[i] = next().toCharArray();
            out.append(countIslands(grid)).append('\\n');
        }
        System.out.print(out);
    }"""),
    hint="Recursive DFS can overflow the stack on a 200 × 200 grid; a queue-based BFS is safer.",
)


def maze_case(r, c, p):
    g = [list(row) for row in grid(r, c, p, "#.")]
    g[0][0] = "."
    g[-1][-1] = "."
    return ["".join(row) for row in g]


def shortest(g):
    r, c = len(g), len(g[0])
    dist = [[-1] * c for _ in range(r)]
    dist[0][0] = 0
    q = deque([(0, 0)])
    while q:
        x, y = q.popleft()
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            a, b = x + dx, y + dy
            if 0 <= a < r and 0 <= b < c and g[a][b] == "." and dist[a][b] < 0:
                dist[a][b] = dist[x][y] + 1
                q.append((a, b))
    return dist[r - 1][c - 1]


problem(
    "grid-shortest-path", "Shortest path in a maze", "DSA", "Hard",
    "A maze is a grid where . is open and # is a wall. Start at the top-left cell and reach the bottom-right cell, moving up, down, left or right. Print the fewest moves, or -1 if it cannot be done. Both corner cells are always open.",
    "The first line has T. Each test case has a line with r and c, then r lines of c characters.",
    "For each test case, print the fewest moves or -1.",
    ["1 ≤ T ≤ 15", "1 ≤ r, c ≤ 200"],
    [["..#", "#..", "#.."], [".#", "#."], ["."]] + [maze_case(random.randint(1, 60), random.randint(1, 60), random.random() * .4) for _ in range(10)] + [maze_case(200, 200, .25)],
    shortest,
    lambda g: f"{len(g)} {len(g[0])}\n" + "".join(row + "\n" for row in g),
    """
int shortestPath(const vector<string>& grid) {
    // Your code here (BFS from the top-left cell)
    return -1;
}

int main() {
    int t;
    cin >> t;
    while (t--) {
        int r, c;
        cin >> r >> c;
        vector<string> grid(r);
        for (auto& row : grid) cin >> row;
        cout << shortestPath(grid) << "\\n";
    }
}""",
    tok_java("""    static int shortestPath(char[][] grid) {
        // Your code here (BFS from the top-left cell)
        return -1;
    }

    public static void main(String[] args) throws IOException {
        int t = nextInt();
        StringBuilder out = new StringBuilder();
        while (t-- > 0) {
            int r = nextInt(), c = nextInt();
            char[][] grid = new char[r][];
            for (int i = 0; i < r; i++) grid[i] = next().toCharArray();
            out.append(shortestPath(grid)).append('\\n');
        }
        System.out.print(out);
    }"""),
)

MOD = 10**9 + 7
stairs = [0, 1, 2]
for i in range(3, 100001):
    stairs.append((stairs[-1] + stairs[-2]) % MOD)
problem(
    "climbing-stairs", "Climbing stairs", "DSA", "Easy",
    "You climb a staircase of n steps, taking 1 or 2 steps at a time. Count the different ways to reach the top. For n = 3 there are 3 ways: 1+1+1, 1+2 and 2+1. The count grows fast, so print it modulo 1,000,000,007.",
    "The first line has T. Each of the next T lines has n.",
    "For each test case, print the number of ways modulo 1000000007.",
    ["1 ≤ T ≤ 50", "1 ≤ n ≤ 10^5"],
    [3, 1, 2, 10, 100000] + ints(30, 1, 100000),
    lambda n: stairs[n],
    lambda n: f"{n}\n",
    """
const long long MOD = 1000000007;

long long ways(int n) {
    // Your code here (dynamic programming)
    return 0;
}

int main() {
    int t;
    cin >> t;
    while (t--) {
        int n;
        cin >> n;
        cout << ways(n) << "\\n";
    }
}""",
    tok_java("""    static final long MOD = 1_000_000_007L;

    static long ways(int n) {
        // Your code here (dynamic programming)
        return 0;
    }

    public static void main(String[] args) throws IOException {
        int t = nextInt();
        StringBuilder out = new StringBuilder();
        while (t-- > 0) out.append(ways(nextInt())).append('\\n');
        System.out.print(out);
    }"""),
    hint="ways(n) = ways(n - 1) + ways(n - 2). Precompute once up to 100000 if you like.",
)


def coin_case():
    coins = sorted(set(ints(random.randint(1, 6), 1, 200)))
    return (random.randint(0, 10000), coins)


def min_coins(c):
    amount, coins = c
    INF = float("inf")
    dp = [0] + [INF] * amount
    for v in range(1, amount + 1):
        for k in coins:
            if k <= v and dp[v - k] + 1 < dp[v]:
                dp[v] = dp[v - k] + 1
    return dp[amount] if dp[amount] != INF else -1


problem(
    "min-coins", "Fewest coins", "DSA", "Hard",
    "You have unlimited coins of some values. Find the fewest coins that add up to an amount exactly, or -1 if it cannot be made. With coins 1 5 6 9 and amount 11, the answer is 2 (5 + 6). Choosing the biggest coin first does not always work.",
    "The first line has T. Each test case has a line with the number of coin values m and the amount, then a line with the m coin values.",
    "For each test case, print the fewest coins or -1.",
    ["1 ≤ T ≤ 15", "1 ≤ m ≤ 10", "1 ≤ coin ≤ 10^4", "0 ≤ amount ≤ 10^4"],
    [(11, [1, 5, 6, 9]), (3, [2]), (0, [7])] + [coin_case() for _ in range(12)],
    min_coins,
    lambda c: f"{len(c[1])} {c[0]}\n" + line(c[1]),
    """
int minCoins(const vector<int>& coins, int amount) {
    // Your code here (dp[v] = fewest coins for value v)
    return -1;
}

int main() {
    int t;
    cin >> t;
    while (t--) {
        int m, amount;
        cin >> m >> amount;
        vector<int> coins(m);
        for (auto& c : coins) cin >> c;
        cout << minCoins(coins, amount) << "\\n";
    }
}""",
    tok_java("""    static int minCoins(int[] coins, int amount) {
        // Your code here (dp[v] = fewest coins for value v)
        return -1;
    }

    public static void main(String[] args) throws IOException {
        int t = nextInt();
        StringBuilder out = new StringBuilder();
        while (t-- > 0) {
            int m = nextInt(), amount = nextInt();
            int[] coins = new int[m];
            for (int i = 0; i < m; i++) coins[i] = nextInt();
            out.append(minCoins(coins, amount)).append('\\n');
        }
        System.out.print(out);
    }"""),
)


def anagram_case():
    w = rand_word(random.randint(1, 50), "abcdefg")
    v = list(w)
    random.shuffle(v)
    v = "".join(v)
    if random.random() < 0.45:
        k = random.randrange(len(v))
        v = v[:k] + random.choice("abcdefgh") + v[k + 1:]
    return (w, v)


problem(
    "anagram-check", "Anagrams", "DSA", "Easy",
    "Two words are anagrams if one is a rearrangement of the other's letters, like listen and silent. Count letters with an array of 26 or a hash map.",
    "The first line has T. Each of the next T lines has two lowercase words.",
    "For each pair, print YES if they are anagrams and NO otherwise.",
    ["1 ≤ T ≤ 40", "1 ≤ length ≤ 10^4"],
    [("listen", "silent"), ("rat", "car"), ("a", "ab")] + [anagram_case() for _ in range(30)],
    lambda c: "YES" if sorted(c[0]) == sorted(c[1]) else "NO",
    lambda c: line(c),
    """
bool isAnagram(const string& a, const string& b) {
    // Your code here
    return false;
}

int main() {
    int t;
    cin >> t;
    while (t--) {
        string a, b;
        cin >> a >> b;
        cout << (isAnagram(a, b) ? "YES" : "NO") << "\\n";
    }
}""",
    tok_java("""    static boolean isAnagram(String a, String b) {
        // Your code here
        return false;
    }

    public static void main(String[] args) throws IOException {
        int t = nextInt();
        StringBuilder out = new StringBuilder();
        while (t-- > 0) out.append(isAnagram(next(), next()) ? "YES" : "NO").append('\\n');
        System.out.print(out);
    }"""),
    sample_count=3,
)


def next_greater(a):
    res, st = [-1] * len(a), []
    for i, x in enumerate(a):
        while st and a[st[-1]] < x:
            res[st.pop()] = x
        st.append(i)
    return " ".join(map(str, res))


problem(
    "next-greater", "Next greater element", "DSA", "Hard",
    "For every element, find the first element to its right that is strictly greater, or -1 if there is none. For 4 5 2 25 the answer is 5 25 25 -1. A monotonic stack does it in O(n).",
    "The first line has T. Each test case has a line with n, then a line with n numbers.",
    "For each test case, print n numbers on one line, separated by spaces.",
    ["1 ≤ T ≤ 10", "1 ≤ n ≤ 2·10^4", "0 ≤ each value ≤ 10^9", "Aim for O(n) with a stack."],
    [[4, 5, 2, 25], [13, 7, 6, 12], [5]] + arr_cases(6, 1, 2000, 0, 100) + [list(range(20000, 0, -1)) + [20001]],
    next_greater,
    lambda a: f"{len(a)}\n" + line(a),
    """
vector<long long> nextGreater(const vector<long long>& a) {
    vector<long long> result(a.size(), -1);
    // Your code here (use a stack of positions)
    return result;
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int t;
    cin >> t;
    while (t--) {
        int n;
        cin >> n;
        vector<long long> a(n);
        for (auto& x : a) cin >> x;
        auto r = nextGreater(a);
        for (int i = 0; i < n; i++) cout << r[i] << (i + 1 < n ? ' ' : '\\n');
    }
}""",
    tok_java("""    static long[] nextGreater(long[] a) {
        long[] result = new long[a.length];
        Arrays.fill(result, -1);
        // Your code here (use a stack of positions)
        return result;
    }

    public static void main(String[] args) throws IOException {
        int t = nextInt();
        StringBuilder out = new StringBuilder();
        while (t-- > 0) {
            int n = nextInt();
            long[] a = new long[n];
            for (int i = 0; i < n; i++) a[i] = nextLong();
            long[] r = nextGreater(a);
            for (int i = 0; i < n; i++) out.append(r[i]).append(i + 1 < n ? ' ' : '\\n');
        }
        System.out.print(out);
    }"""),
    sample_count=2,
)


def majority_case():
    n = random.randint(1, 2000)
    m = random.randint(0, 10**9)
    k = n // 2 + 1 + random.randint(0, n - n // 2 - 1)
    a = [m] * k + ints(n - k, 0, 10**9)
    random.shuffle(a)
    return a


problem(
    "majority-element", "Majority element", "DSA", "Medium",
    "An array has a value that appears more than n / 2 times. Find it. Can you do it with O(1) extra memory? (Look up the Boyer–Moore voting idea.)",
    "The first line has T. Each test case has a line with n, then a line with n numbers.",
    "For each test case, print the majority value.",
    ["1 ≤ T ≤ 15", "1 ≤ n ≤ 2000", "0 ≤ each value ≤ 10^9"],
    [[3, 2, 3], [2, 2, 1, 1, 1, 2, 2]] + [majority_case() for _ in range(12)],
    lambda a: max(set(a), key=a.count) if len(a) < 4000 else None,
    lambda a: f"{len(a)}\n" + line(a),
    """
long long majority(const vector<long long>& a) {
    // Your code here
    return a[0];
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int t;
    cin >> t;
    while (t--) {
        int n;
        cin >> n;
        vector<long long> a(n);
        for (auto& x : a) cin >> x;
        cout << majority(a) << "\\n";
    }
}""",
    tok_java("""    static long majority(long[] a) {
        // Your code here
        return a[0];
    }

    public static void main(String[] args) throws IOException {
        int t = nextInt();
        StringBuilder out = new StringBuilder();
        while (t-- > 0) {
            int n = nextInt();
            long[] a = new long[n];
            for (int i = 0; i < n; i++) a[i] = nextLong();
            out.append(majority(a)).append('\\n');
        }
        System.out.print(out);
    }"""),
)

out = sys.argv[1]
for p in P:
    assert "None" not in p["tests"]["output"], p["slug"]
    assert len(p["tests"]["input"]) < 230_000, (p["slug"], len(p["tests"]["input"]))
json.dump(P, open(out, "w"), ensure_ascii=False)
print(len(P), "problems;", sum(len(p["tests"]["input"]) for p in P) // 1024, "KB of input")
for p in P:
    print(f'{p["track"]:4} {p["difficulty"]:6} {p["slug"]:26} in={len(p["tests"]["input"])//1024}KB')
