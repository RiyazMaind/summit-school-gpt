export const classes = Array.from({ length: 10 }, (_, i) => ({
  id: i + 1,
  name: `Class ${i + 1}`,
}));

export const subjects: Record<number, { id: string; name: string; icon: string; chapters: number }[]> = {
  10: [
    { id: "math-10", name: "Mathematics", icon: "📐", chapters: 15 },
    { id: "sci-10", name: "Science", icon: "🔬", chapters: 16 },
    { id: "eng-10", name: "English", icon: "📖", chapters: 12 },
    { id: "sst-10", name: "Social Science", icon: "🌍", chapters: 24 },
    { id: "hindi-10", name: "Hindi", icon: "📝", chapters: 17 },
  ],
  9: [
    { id: "math-9", name: "Mathematics", icon: "📐", chapters: 15 },
    { id: "sci-9", name: "Science", icon: "🔬", chapters: 15 },
    { id: "eng-9", name: "English", icon: "📖", chapters: 11 },
    { id: "sst-9", name: "Social Science", icon: "🌍", chapters: 22 },
  ],
  12: [
    { id: "math-12", name: "Mathematics", icon: "📐", chapters: 13 },
    { id: "phy-12", name: "Physics", icon: "⚡", chapters: 15 },
    { id: "chem-12", name: "Chemistry", icon: "🧪", chapters: 16 },
    { id: "bio-12", name: "Biology", icon: "🧬", chapters: 16 },
    { id: "eng-12", name: "English", icon: "📖", chapters: 8 },
  ],
};

// Default subjects for classes without specific data
for (let i = 1; i <= 12; i++) {
  if (!subjects[i]) {
    subjects[i] = [
      { id: `math-${i}`, name: "Mathematics", icon: "📐", chapters: 14 },
      { id: `sci-${i}`, name: "Science", icon: "🔬", chapters: 12 },
      { id: `eng-${i}`, name: "English", icon: "📖", chapters: 10 },
      { id: `sst-${i}`, name: "Social Science", icon: "🌍", chapters: 15 },
    ];
  }
}

export const chapters: Record<string, { id: string; name: string; topics: string[] }[]> = {
  "math-10": [
    { id: "ch1", name: "Real Numbers", topics: ["Euclid's Division Lemma", "Fundamental Theorem of Arithmetic", "Irrational Numbers", "Rational Numbers"] },
    { id: "ch2", name: "Polynomials", topics: ["Geometrical Meaning of Zeroes", "Relationship between Zeroes and Coefficients", "Division Algorithm"] },
    { id: "ch3", name: "Pair of Linear Equations", topics: ["Graphical Method", "Substitution Method", "Elimination Method", "Cross-Multiplication Method"] },
    { id: "ch4", name: "Quadratic Equations", topics: ["Standard Form", "Factorisation", "Completing the Square", "Quadratic Formula", "Nature of Roots"] },
    { id: "ch5", name: "Arithmetic Progressions", topics: ["nth Term", "Sum of n Terms", "Applications"] },
    { id: "ch6", name: "Triangles", topics: ["Similarity Criteria", "Areas of Similar Triangles", "Pythagoras Theorem"] },
    { id: "ch7", name: "Coordinate Geometry", topics: ["Distance Formula", "Section Formula", "Area of Triangle"] },
    { id: "ch8", name: "Trigonometry", topics: ["Trigonometric Ratios", "Complementary Angles", "Trigonometric Identities"] },
  ],
  "sci-10": [
    { id: "ch1", name: "Chemical Reactions", topics: ["Types of Reactions", "Balancing Equations", "Corrosion", "Rancidity"] },
    { id: "ch2", name: "Acids, Bases and Salts", topics: ["pH Scale", "Indicators", "Neutralisation", "Salts"] },
    { id: "ch3", name: "Metals and Non-metals", topics: ["Properties", "Reactivity Series", "Ionic Bonds", "Metallurgy"] },
    { id: "ch4", name: "Carbon Compounds", topics: ["Covalent Bonding", "Hydrocarbons", "Functional Groups", "Nomenclature"] },
    { id: "ch5", name: "Life Processes", topics: ["Nutrition", "Respiration", "Transportation", "Excretion"] },
    { id: "ch6", name: "Control and Coordination", topics: ["Nervous System", "Hormones", "Plant Hormones", "Reflex Action"] },
  ],
};

export const mockExplanation = {
  simple: `**Euclid's Division Lemma** states that for any two positive integers *a* and *b*, there exist unique integers *q* (quotient) and *r* (remainder) such that:

**a = bq + r**, where 0 ≤ r < b

Think of it like dividing mangoes among friends — you always get some left over (or none). This leftover is the remainder, and it's always less than the number of friends.

📚 *Reference: NCERT Mathematics, Class 10, Chapter 1, Section 1.1*`,
  detailed: `**Euclid's Division Lemma** is a fundamental theorem in number theory. It states:

For any two positive integers **a** and **b**, there exist unique non-negative integers **q** (quotient) and **r** (remainder) such that:

> **a = bq + r**, where 0 ≤ r < b

### Understanding the Lemma

This is essentially the mathematical formalization of the long division process you've been doing since earlier classes. When you divide **a** by **b**:
- **q** is how many times b fits completely into a
- **r** is what's left over

### Key Properties
1. The remainder **r** is always non-negative (r ≥ 0)
2. The remainder is strictly less than the divisor (r < b)
3. Both q and r are **unique** for given a and b

### Application: Finding HCF
Euclid's Division Lemma is the foundation of **Euclid's Division Algorithm**, used to find the HCF (Highest Common Factor) of two numbers.

**Example:** Find HCF of 455 and 42.
- Step 1: 455 = 42 × 10 + 35
- Step 2: 42 = 35 × 1 + 7
- Step 3: 35 = 7 × 5 + 0

Since remainder = 0, **HCF = 7**

📚 *Reference: NCERT Mathematics, Class 10, Chapter 1, Sections 1.1–1.2*`,
};

export const mockQuizQuestions = [
  {
    id: 1,
    type: "mcq" as const,
    question: "For two positive integers a and b, Euclid's division lemma states a = bq + r, where:",
    options: ["0 < r ≤ b", "0 ≤ r < b", "0 < r < b", "0 ≤ r ≤ b"],
    answer: 1,
    chapter: "Ch 1: Real Numbers",
  },
  {
    id: 2,
    type: "mcq" as const,
    question: "The HCF of 306 and 657 is:",
    options: ["3", "9", "18", "6"],
    answer: 1,
    chapter: "Ch 1: Real Numbers",
  },
  {
    id: 3,
    type: "short" as const,
    question: "Explain the Fundamental Theorem of Arithmetic with an example.",
    answer: "Every composite number can be expressed as a product of primes in a unique way. E.g., 60 = 2 × 2 × 3 × 5.",
    chapter: "Ch 1: Real Numbers",
  },
  {
    id: 4,
    type: "mcq" as const,
    question: "If HCF(306, 657) = 9, then LCM(306, 657) is:",
    options: ["22338", "23338", "22__(wrong)", "None"],
    answer: 0,
    chapter: "Ch 1: Real Numbers",
  },
];

export const mockAnalytics = {
  totalQueries: 12847,
  activeUsers: 1243,
  avgResponseTime: "2.3s",
  ingestionAccuracy: "97.8%",
  topTopics: [
    { topic: "Quadratic Equations", queries: 1820, class: 10 },
    { topic: "Trigonometry", queries: 1654, class: 10 },
    { topic: "Chemical Reactions", queries: 1432, class: 10 },
    { topic: "Photosynthesis", queries: 1201, class: 12 },
    { topic: "Linear Equations", queries: 1089, class: 9 },
    { topic: "Coordinate Geometry", queries: 982, class: 10 },
    { topic: "Heredity", queries: 876, class: 12 },
    { topic: "Electricity", queries: 843, class: 10 },
  ],
  weeklyActivity: [
    { day: "Mon", queries: 1840 },
    { day: "Tue", queries: 2100 },
    { day: "Wed", queries: 1950 },
    { day: "Thu", queries: 2300 },
    { day: "Fri", queries: 1780 },
    { day: "Sat", queries: 1520 },
    { day: "Sun", queries: 1357 },
  ],
  usersByRole: [
    { role: "Students", count: 980 },
    { role: "Teachers", count: 213 },
    { role: "Admins", count: 50 },
  ],
};
