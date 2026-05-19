export type DebateFilter = "all" | "active" | "synthesized" | "drafts";

interface FilterPillsProps {
  value: DebateFilter;
  onChange: (next: DebateFilter) => void;
}

const PILLS: Array<{ key: DebateFilter; label: string }> = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "synthesized", label: "Synthesized" },
  { key: "drafts", label: "Drafts" },
];

export function FilterPills({ value, onChange }: FilterPillsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {PILLS.map((pill) => {
        const active = pill.key === value;
        return (
          <button
            key={pill.key}
            type="button"
            onClick={() => onChange(pill.key)}
            className={[
              "inline-flex h-8 items-center rounded-full border px-3.5 text-[13px] font-medium transition-colors",
              active
                ? "border-ink-button bg-ink-button text-cream"
                : "border-hair bg-surface text-ink-body hover:border-ink-muted",
            ].join(" ")}
          >
            {pill.label}
          </button>
        );
      })}
    </div>
  );
}
