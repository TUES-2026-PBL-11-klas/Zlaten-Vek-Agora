interface BillSummaryPanelProps {
  keyChanges: string[];
}

export function BillSummaryPanel({ keyChanges }: BillSummaryPanelProps) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-hair bg-surface p-6">
      <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-ink-label">
        The bill, in short
      </p>

      {keyChanges.length > 0 ? (
        <ul className="flex flex-col gap-2.5">
          {keyChanges.map((change, idx) => (
            <li key={idx} className="flex gap-3 text-[14px] leading-[20px] text-ink-body">
              <span className="shrink-0 font-serif text-[13px] italic text-accent-rust">
                &sect;{idx + 1}
              </span>
              <span>{change}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-[13px] text-ink-muted">No key changes extracted yet.</p>
      )}
    </div>
  );
}
