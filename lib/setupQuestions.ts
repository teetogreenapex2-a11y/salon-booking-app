// The first-visit questionnaire: the questions, the allowed answers, and
// a parser that safely reads whatever is stored. No database or server
// imports here, so both the quiz component and the server can use it.

export type SetupAnswers = {
  skipped?: boolean;
  who?: "solo" | "salon" | "booth" | "mix";
  coowner?: "yes" | "no";
  switching?: "vagaro" | "booksy" | "glossgenius" | "fresha" | "other" | "none";
  payments?: "card" | "apps" | "cash" | "mix";
  products?: "yes" | "no";
  noshow?: "yes" | "no";
  commission?: "yes" | "no";
};

export type Question = {
  key: "who" | "coowner" | "switching" | "payments" | "products" | "noshow" | "commission";
  prompt: string;
  // Optional: only ask this question when it makes sense given the
  // answers so far (e.g. don't ask about staff commission of a solo stylist).
  askIf?: (answers: Record<string, string>) => boolean;
  options: { value: string; label: string }[];
};

export const QUESTIONS: Question[] = [
  {
    key: "who",
    prompt: "How do you work?",
    options: [
      { value: "solo", label: "On my own — just me" },
      { value: "salon", label: "I run a salon with employees" },
      { value: "booth", label: "I run a salon where stylists rent their chairs" },
      { value: "mix", label: "A mix of employees and chair renters" },
    ],
  },
  {
    key: "coowner",
    prompt: "Does anyone co-own the business with you?",
    askIf: (a) => a.who !== "solo",
    options: [
      { value: "yes", label: "Yes — I have a partner or co-owner" },
      { value: "no", label: "No, it's just me" },
    ],
  },
  {
    key: "switching",
    prompt: "Are you switching from another booking app?",
    options: [
      { value: "vagaro", label: "Vagaro" },
      { value: "booksy", label: "Booksy" },
      { value: "glossgenius", label: "GlossGenius" },
      { value: "fresha", label: "Fresha" },
      { value: "other", label: "Another app or a spreadsheet" },
      { value: "none", label: "No — starting fresh" },
    ],
  },
  {
    key: "payments",
    prompt: "How do clients usually pay you?",
    options: [
      { value: "card", label: "Credit or debit cards" },
      { value: "apps", label: "Venmo, Cash App or Zelle" },
      { value: "cash", label: "Mostly cash" },
      { value: "mix", label: "A mix of these" },
    ],
  },
  {
    key: "products",
    prompt: "Do you sell hair products?",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
    ],
  },
  {
    key: "commission",
    prompt: "Do your stylists earn a commission on the products they sell?",
    askIf: (a) => a.products === "yes" && a.who !== "solo",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
    ],
  },
  {
    key: "noshow",
    prompt: "Do you want to charge a fee when a client doesn't show up?",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No / not sure yet" },
    ],
  },
];

// The questions that apply given the answers so far, in order.
export function visibleQuestions(answers: Record<string, string>): Question[] {
  return QUESTIONS.filter((q) => !q.askIf || q.askIf(answers));
}

// Only keeps values that are actually allowed, so anything unexpected in
// the stored JSON (or sent to the API) is ignored rather than trusted.
export function parseAnswers(raw: unknown): SetupAnswers | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const obj = raw as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  if (obj.skipped === true) out.skipped = true;
  for (const q of QUESTIONS) {
    const v = obj[q.key];
    if (typeof v === "string" && q.options.some((o) => o.value === v)) out[q.key] = v;
  }
  return Object.keys(out).length ? (out as SetupAnswers) : null;
}
