import type { ReactNode } from "react";

// Ported from docs/prototype-reference.html's renderNotes()/inline() — same lightweight
// syntax (# ## ### headings, - / * bullets, **bold**, *italic*), but building React
// nodes directly instead of an HTML string.
function parseInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern = /\*\*(.+?)\*\*|(?<!\*)\*(?!\*)(.+?)\*(?!\*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }
    if (match[1] !== undefined) {
      nodes.push(<strong key={key++}>{match[1]}</strong>);
    } else if (match[2] !== undefined) {
      nodes.push(<em key={key++}>{match[2]}</em>);
    }
    lastIndex = pattern.lastIndex;
  }
  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }
  return nodes;
}

export function renderMarkdown(text: string): ReactNode {
  const lines = (text || "").split("\n");
  const blocks: ReactNode[] = [];
  let listItems: ReactNode[] = [];
  let key = 0;

  const flushList = () => {
    if (listItems.length > 0) {
      blocks.push(
        <ul key={`ul-${key++}`} className="mb-2.5 list-disc pl-5">
          {listItems}
        </ul>,
      );
      listItems = [];
    }
  };

  for (const raw of lines) {
    const trimmed = raw.trim();
    const headingMatch = trimmed.match(/^(#{1,3})\s+(.*)$/);
    if (headingMatch) {
      flushList();
      const level = headingMatch[1].length;
      const content = parseInline(headingMatch[2]);
      if (level === 1) {
        blocks.push(
          <h3 key={key++} className="mt-4 mb-1.5 font-serif text-base">
            {content}
          </h3>,
        );
      } else if (level === 2) {
        blocks.push(
          <h4 key={key++} className="mt-3.5 mb-1 font-serif text-[14.5px]">
            {content}
          </h4>,
        );
      } else {
        blocks.push(
          <h5
            key={key++}
            className="mt-3 mb-1 font-sans text-[13.5px] font-semibold tracking-[0.04em] text-ink-soft uppercase"
          >
            {content}
          </h5>,
        );
      }
    } else if (/^[-*]\s+/.test(trimmed)) {
      listItems.push(
        <li key={`li-${key++}`} className="my-0.5">
          {parseInline(trimmed.replace(/^[-*]\s+/, ""))}
        </li>,
      );
    } else if (trimmed === "") {
      flushList();
    } else {
      flushList();
      blocks.push(
        <p key={key++} className="mb-2.5">
          {parseInline(trimmed)}
        </p>,
      );
    }
  }
  flushList();

  if (blocks.length === 0) {
    return <p className="text-ink-soft">No notes yet.</p>;
  }

  return <>{blocks}</>;
}

export function stripMarkdown(text: string): string {
  return (text || "")
    .replace(/^#{1,3}\s+/gm, "")
    .replace(/^[-*]\s+/gm, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/\n+/g, " ")
    .trim();
}
