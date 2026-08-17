export interface ParsedFlashcard {
  title: string;
  focus: string;
  description: string;
}

// Parses the flashcard markdown format an external LLM produces from
// FLASHCARD_IMPORT_PROMPT below: repeated "## Title" sections, each with a
// "Focus:" line and a "Description:" line (description may span multiple
// lines/paragraphs until the next "## " heading). Lenient about missing
// labels so minor LLM formatting drift still parses into something usable.
export function parseFlashcardMarkdown(markdown: string): ParsedFlashcard[] {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const cards: ParsedFlashcard[] = [];
  let current: { title: string; focus: string; descLines: string[] } | null =
    null;

  function flush() {
    if (!current) return;
    const title = current.title.trim();
    const focus = current.focus.trim();
    const description = current.descLines.join("\n").trim();
    if (title && (focus || description)) {
      cards.push({
        title,
        focus: focus || title,
        description: description || focus,
      });
    }
    current = null;
  }

  for (const raw of lines) {
    const heading = raw.match(/^##\s+(.+)$/);
    if (heading) {
      flush();
      current = { title: heading[1], focus: "", descLines: [] };
      continue;
    }
    if (!current) continue;

    const focusMatch = raw.match(/^Focus:\s*(.*)$/i);
    if (focusMatch && !current.focus) {
      current.focus = focusMatch[1];
      continue;
    }
    const descMatch = raw.match(/^Description:\s*(.*)$/i);
    if (descMatch) {
      if (descMatch[1]) current.descLines.push(descMatch[1]);
      continue;
    }
    current.descLines.push(raw);
  }
  flush();
  return cards;
}

export function normalizeFocus(focus: string): string {
  return focus.trim().toLowerCase();
}

// Safety net for quiz mode: some descriptions (especially older/manually
// written ones, or ones an LLM wrote before the prompt told it not to)
// restate the focus term directly, which gives away the answer. Blank out
// any occurrence of the term itself so recall is still required — this only
// ever runs for the quiz view, never for the normal note display.
export function redactFocusFromText(text: string, focus: string): string {
  const trimmedFocus = focus.trim();
  if (!trimmedFocus) return text;
  const escaped = trimmedFocus.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`\\b${escaped}\\b`, "gi");
  return text.replace(pattern, "▓▓▓▓▓");
}

export const FLASHCARD_IMPORT_PROMPT = `Please create a markdown flashcard file based on the PDF I've attached to this conversation.

YOUR #1 PRIORITY IS COMPLETENESS. Read the entire document from the first page to the last — every section, every paragraph, do not stop early and do not sample only the "important-looking" parts. Extract EVERY named term, drug, lab value, sign/symptom, procedure, anatomical structure, classification, and concept a nursing student could be tested on. If the document names it, defines it, or explains what it does, it gets a card — even a term mentioned once, in passing, in a single sentence. When in doubt, include it. A 10-page document with 60 distinct terms should produce roughly 60 cards, not 10 or 20. Missing terms is the #1 failure mode — do not let that happen.

Apply these three rules to every card:

1. ATOMIC: one card = one term. Never merge two or more terms into a single card, even if the source discusses them in the same sentence. ("Loop and thiazide diuretics" → two separate cards, one per drug class. "Signs of shock: tachycardia, hypotension, cool skin" → three separate cards, one per sign.)
2. DON'T GIVE AWAY THE ANSWER: never state the focus term itself (or an obvious variant of it) inside its own Description — describe what it is/does without naming it. (Focus "Gerontological Nursing" → description should NOT start with "Gerontological nursing is/focuses on..."; instead describe the specialty without saying its name.)
3. SELF-CONTAINED: each description should make sense on its own, in 2-5 sentences, without needing any other card.

Output ONLY this markdown format, repeated once per term, nothing else before or after it (no intro, no summary, no explanation):

## <card title>
Focus: <the term to memorize>
Description: <2-5 sentences explaining it, per rules 2 and 3 above>

If you have a file-creation/code-interpreter tool available, use it to generate an actual downloadable .md file and give me the link. If you don't have that ability, output the complete raw markdown directly in your reply instead, with nothing before or after it, so I can copy it and save it as a .md file myself.`;
