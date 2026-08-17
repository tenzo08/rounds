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

export const FLASHCARD_IMPORT_PROMPT = `Please create a markdown flashcard file based on the PDF I've attached to this conversation.

Your job is extraction, not summarization. Go through the PDF systematically — section by section, paragraph by paragraph — and pull out every important word: every named term, drug, lab value, sign/symptom, procedure, anatomical structure, classification, and concept a nursing student could be tested on. Do not filter by "importance" beyond that; if the material defines it, names it, or explains what it does, it earns its own card. Do not skip terms just because they only appear in one sentence — a one-sentence definition is still a full card.

ATOMICITY IS THE MOST IMPORTANT RULE: each card covers exactly ONE word or phrase. Never combine two or more terms into a single card, even if the source material discusses them together in the same sentence or paragraph.

- WRONG: one card titled "Loop and Thiazide Diuretics" describing both drug classes at once.
- RIGHT: a separate "Furosemide" (or "Loop diuretics") card, and a separate "Hydrochlorothiazide" (or "Thiazide diuretics") card.
- WRONG: one card titled "Signs of Shock" that lists tachycardia, hypotension, and cool clammy skin all in the description.
- RIGHT: three separate cards — one for "Tachycardia" (as a shock sign), one for "Hypotension," one for "Cool, clammy skin" — each with its own focused explanation.

If you catch yourself writing a description with a list of several distinct named things in it, stop and split it into that many separate cards instead.

Convert the material into flashcards using EXACTLY this Markdown format, and output ONLY the markdown — no commentary before or after it:

## <short, specific card title — usually the same as the focus term>
Focus: <the single word or short phrase being defined — this is the card's front>
Description: <a concise, self-contained 2-5 sentence definition/explanation of that ONE term only — this is the card's back. It should make sense on its own, without needing to see any other card>

Repeat that block for every distinct term in the PDF. Err heavily on the side of MORE, smaller cards rather than fewer, larger ones — a chapter with 40 important terms should produce roughly 40 cards, not 5. When unsure whether to split something into more cards, split it.`;
