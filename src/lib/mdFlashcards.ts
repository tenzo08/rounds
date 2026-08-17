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

export const FLASHCARD_IMPORT_PROMPT = `You are helping a nursing student turn raw lecture/study notes into flashcard-style study material.

I will paste my raw notes below. Convert them into flashcards using EXACTLY this Markdown format, and output ONLY the markdown — no commentary before or after it:

## <short, specific card title>
Focus: <the one key word or short phrase to memorize>
Description: <a concise 2-5 sentence explanation of what the student needs to remember about it>

Repeat that block for every distinct concept, term, drug, lab value, or fact worth memorizing on its own. Break a big topic into MANY small, focused cards rather than one giant note — each card should stand alone as a proper flashcard, front (focus) and back (description).

Here are my notes:

<paste your notes here>`;
