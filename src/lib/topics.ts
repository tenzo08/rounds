// Topics are free-form and student-created (no fixed list), but each one still
// gets a stable accent color from docs/DESIGN.md's rotation palette, picked
// deterministically by name so the same topic always renders the same color.
const TOPIC_PALETTE = [
  "#4A7C59",
  "#6B5B95",
  "#3B6E8F",
  "#C4547D",
  "#3A8F8C",
  "#B33A3A",
];

export function topicColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return TOPIC_PALETTE[hash % TOPIC_PALETTE.length];
}
