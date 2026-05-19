import { Link } from "react-router-dom";

interface ChamberHeaderProps {
  displayName: string;
  debateCount: number;
  participantCount: number;
  lastActive: string | null;
}

export function ChamberHeader({
  displayName,
  debateCount,
  participantCount,
  lastActive,
}: ChamberHeaderProps) {
  return (
    <header className="flex flex-col gap-6 border-b border-hair pb-10 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex flex-col gap-3">
        <h1 className="font-serif text-[44px] leading-[1.05] text-ink-primary sm:text-[52px]">
          {displayName}&rsquo;s chamber
        </h1>
        <dl className="flex flex-wrap items-baseline gap-x-6 gap-y-2 text-[13px] text-ink-muted">
          <MetaChip value={String(debateCount)} label={debateCount === 1 ? "debate" : "debates"} />
          <MetaChip value={String(participantCount)} label="participants" />
          {lastActive ? <MetaChip value={lastActive} label="last active" /> : null}
        </dl>
      </div>

      <Link
        to="/debates/new"
        className="inline-flex h-11 items-center justify-center self-start rounded-full bg-accent-rust px-5 text-[14px] font-medium text-cream transition-colors hover:bg-accent-rust-hi sm:self-auto"
      >
        + New debate
      </Link>
    </header>
  );
}

function MetaChip({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <dt className="font-medium text-ink-primary">{value}</dt>
      <dd className="text-[11px] uppercase tracking-[0.14em] text-ink-label">{label}</dd>
    </div>
  );
}
