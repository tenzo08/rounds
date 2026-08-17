export interface TileItem {
  key: string;
  label: string;
  count: number;
  color: string;
}

interface TileGridProps {
  items: TileItem[];
  countLabel: string;
  onSelect: (key: string) => void;
}

export function TileGrid({ items, countLabel, onSelect }: TileGridProps) {
  if (items.length === 0) {
    return (
      <div className="py-[70px] text-center text-ink-soft">
        <h3 className="m-0 mb-2 font-serif text-[19px] text-ink">
          Nothing here yet
        </h3>
        <p className="m-0 text-[13.5px]">Add an entry to get started.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-[14px]">
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          onClick={() => onSelect(item.key)}
          className="relative overflow-hidden rounded-[3px] border border-line bg-card px-4 pt-4 pb-3.5 text-left shadow-[0_1px_0_rgba(0,0,0,0.04)] transition-[transform,box-shadow] duration-150 ease-out motion-reduce:transition-none motion-safe:hover:-translate-y-[3px] motion-safe:hover:shadow-[0_10px_20px_rgba(30,40,35,0.12)]"
        >
          <div
            className="absolute top-0 left-0 h-[5px] w-full"
            style={{ background: item.color }}
          />
          <p className="m-0 mt-1.5 truncate font-serif text-[16px] text-ink">
            {item.label}
          </p>
          <p className="m-0 mt-1 font-mono text-[11px] text-ink-soft">
            {item.count} {countLabel}
          </p>
        </button>
      ))}
    </div>
  );
}
