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

Go through the PDF and pull out every important word, term, drug name, lab value, procedure, and concept — anything a nursing student would reasonably be tested on. Do not skip minor-looking terms just because they're mentioned briefly; if it's a real term with a real definition in the material, it gets its own card.

Each card must be atomic: one single word, term, or short phrase per card — never bundle multiple concepts into one card, and never make a card that summarizes a whole section. If a sentence in the PDF defines or explains three different terms, that's three separate cards, not one.

Convert the material into flashcards using EXACTLY this Markdown format, and output ONLY the markdown — no commentary before or after it:

## <short, specific card title — usually the same as the focus term>
Focus: <the single word or short phrase being defined — this is the card's front>
Description: <a concise, self-contained 2-5 sentence definition/explanation of that one term — this is the card's back. It should make sense on its own, without needing to see any other card>

Repeat that block for every distinct concept, term, drug, lab value, or fact in the PDF worth memorizing on its own. Err on the side of MORE small cards rather than fewer large ones — a chapter with 40 important terms should produce 40 cards, not 5.`;
