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

IMPORTANT — you must actually create and give me a downloadable .md file. Do not just describe the flashcards, do not summarize the PDF in plain prose, and do not ask me follow-up questions first. If you have a file-creation/code-interpreter tool available, use it now to generate a real .md file and give me the download link. If you do NOT have that ability, then instead output the complete raw markdown directly in your reply — nothing before it, nothing after it, no extra commentary, no explanation of what you did — just the exact markdown content itself, so I can copy it and save it as a .md file myself.

Your job is extraction, not summarization. Go through the PDF systematically — section by section, paragraph by paragraph — and pull out every important word: every named term, drug, lab value, sign/symptom, procedure, anatomical structure, classification, and concept a nursing student could be tested on. Do not filter by "importance" beyond that; if the material defines it, names it, or explains what it does, it earns its own card. Do not skip terms just because they only appear in one sentence — a one-sentence definition is still a full card.

ATOMICITY IS THE MOST IMPORTANT RULE: each card covers exactly ONE word or phrase. Never combine two or more terms into a single card, even if the source material discusses them together in the same sentence or paragraph.

- WRONG: one card titled "Loop and Thiazide Diuretics" describing both drug classes at once.
- RIGHT: a separate "Furosemide" (or "Loop diuretics") card, and a separate "Hydrochlorothiazide" (or "Thiazide diuretics") card.
- WRONG: one card titled "Signs of Shock" that lists tachycardia, hypotension, and cool clammy skin all in the description.
- RIGHT: three separate cards — one for "Tachycardia" (as a shock sign), one for "Hypotension," one for "Cool, clammy skin" — each with its own focused explanation.

If you catch yourself writing a description with a list of several distinct named things in it, stop and split it into that many separate cards instead.

NEVER STATE THE FOCUS TERM ITSELF (or an obvious variant/plural/conjugation of it) ANYWHERE IN THE DESCRIPTION. These are quiz cards — the student reads the description and has to recall the term; if the description just restates the term, there's nothing to recall.

- WRONG: Focus: Gerontological Nursing / Description: "Gerontological nursing focuses on the care of older adults across healthcare settings..." (restates the answer immediately).
- RIGHT: Focus: Gerontological Nursing / Description: "A nursing specialty focused on the care of older adults across healthcare settings, covering assessment, medication safety, psychosocial support, and end-of-life care." (describes it without naming it).

Write every description as if the term itself is redacted — describe what it IS, what it DOES, or what CAUSES/TREATS/INDICATES it, using other words, never the term.

Convert the material into flashcards using EXACTLY this Markdown format, and output ONLY the markdown — no commentary before or after it:

## <short, specific card title — usually the same as the focus term>
Focus: <the single word or short phrase being defined — this is the card's front>
Description: <a concise, self-contained 2-5 sentence definition/explanation of that ONE term only — this is the card's back. It should make sense on its own, without needing to see any other card>

Repeat that block for every distinct term in the PDF. Err heavily on the side of MORE, smaller cards rather than fewer, larger ones — a chapter with 40 important terms should produce roughly 40 cards, not 5. When unsure whether to split something into more cards, split it.`;
