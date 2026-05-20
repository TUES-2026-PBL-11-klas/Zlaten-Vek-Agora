import { Link } from "react-router-dom";
import type { DebateListItemDto, DebateOverviewDto } from "@agora/shared";
import { DebateStatus } from "@agora/shared";
import { StatusPill } from "./StatusPill";
import { PersonaAvatar } from "./PersonaAvatar";
import { debateCode, formatDate } from "../lib/debate-code";

interface ActiveNowPanelProps {
  summary: DebateListItemDto;
  overview: DebateOverviewDto | undefined;
  isLoading: boolean;
}

export function ActiveNowPanel({ summary, overview, isLoading }: ActiveNowPanelProps) {
  return (
    <section className="mt-10">
      <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.18em] text-ink-label">
        Active now
      </p>

      <div className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-hair bg-hair lg:grid-cols-[1.2fr_1fr_0.9fr]">
        <BillColumn summary={summary} overview={overview} isLoading={isLoading} />
        <TableColumn overview={overview} isLoading={isLoading} />
        <RailColumn summary={summary} overview={overview} isLoading={isLoading} />
      </div>
    </section>
  );
}

function BillColumn({
  summary,
  overview,
  isLoading,
}: {
  summary: DebateListItemDto;
  overview: DebateOverviewDto | undefined;
  isLoading: boolean;
}) {
  return (
    <div className="flex flex-col gap-5 bg-surface px-8 py-8">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[12px] tracking-[0.08em] text-ink-muted">
          {debateCode(summary.title, summary.createdAt, summary.id)}
        </span>
        <StatusPill status={summary.status} />
      </div>
      <h2 className="font-serif text-[32px] leading-[1.15] text-ink-primary">{summary.title}</h2>

      <ul className="mt-2 flex flex-col gap-2.5">
        {isLoading
          ? Array.from({ length: 3 }).map((_, idx) => (
              <li key={idx} className="h-3 w-3/4 animate-pulse rounded bg-surface-mut" />
            ))
          : (overview?.keyChanges.slice(0, 4) ?? []).map((change, idx) => (
              <li key={idx} className="flex gap-3 text-[14px] leading-[20px] text-ink-body">
                <span className="font-mono text-[12px] text-ink-label">§{idx + 1}</span>
                <span>{change}</span>
              </li>
            ))}
        {!isLoading && (overview?.keyChanges.length ?? 0) === 0 ? (
          <li className="text-[13px] text-ink-muted">No key changes extracted yet.</li>
        ) : null}
      </ul>
    </div>
  );
}

function TableColumn({
  overview,
  isLoading,
}: {
  overview: DebateOverviewDto | undefined;
  isLoading: boolean;
}) {
  return (
    <div className="flex flex-col gap-4 bg-surface px-8 py-8">
      <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-ink-label">
        At the table
      </p>
      <ul className="flex flex-col gap-3">
        {isLoading
          ? Array.from({ length: 4 }).map((_, idx) => (
              <li key={idx} className="flex items-center gap-3">
                <span className="h-8 w-8 animate-pulse rounded-full bg-surface-mut" />
                <span className="h-3 w-32 animate-pulse rounded bg-surface-mut" />
              </li>
            ))
          : (overview?.personas ?? []).map((persona) => (
              <li key={persona.id} className="flex items-center gap-3">
                <PersonaAvatar name={persona.name} color={persona.color} size={32} />
                <div className="flex flex-col">
                  <span className="text-[14px] text-ink-primary">{persona.name}</span>
                  <span className="text-[12px] text-ink-muted">{persona.demographic}</span>
                </div>
              </li>
            ))}
      </ul>
    </div>
  );
}

function RailColumn({
  summary,
  overview,
  isLoading,
}: {
  summary: DebateListItemDto;
  overview: DebateOverviewDto | undefined;
  isLoading: boolean;
}) {
  const completed = overview?.rounds.completed ?? 0;
  const total = overview?.rounds.total ?? 3;
  const turns = overview?.turns ?? 0;

  return (
    <div className="flex flex-col gap-5 bg-surface-mut px-8 py-8">
      <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-ink-label">
        Round {completed + (completed < total ? 1 : 0)} pending
      </p>
      <p className="font-serif text-[20px] leading-[1.3] text-ink-primary">
        {summary.status === DebateStatus.PersonasPending
          ? "Personas await your review."
          : "Common ground - where they might compromise."}
      </p>
      <p className="text-[13px] leading-[20px] text-ink-muted">
        {isLoading
          ? "Loading round status..."
          : `${summary.personaCount} agents have opened. Round ${completed + 1} starts when you return.`}
      </p>

      <div className="mt-2 flex flex-col gap-2">
        <Link
          to={`/debates/${summary.id}`}
          className="inline-flex h-11 items-center justify-center rounded-full bg-accent-rust px-5 text-[14px] font-medium text-cream transition-colors hover:bg-accent-rust-hi"
        >
          Continue debate &rarr;
        </Link>
        {overview?.hasSynthesis ? (
          <Link
            to={`/debates/${summary.id}#synthesis`}
            className="text-center text-[13px] text-ink-muted underline-offset-4 hover:text-ink-primary hover:underline"
          >
            Jump to synthesis
          </Link>
        ) : null}
      </div>

      <dl className="mt-4 flex items-center gap-4 border-t border-hair pt-4 text-[12px] text-ink-muted">
        <div className="flex items-baseline gap-1.5">
          <dt className="font-medium text-ink-primary">
            {completed}/{total}
          </dt>
          <dd className="text-[11px] uppercase tracking-[0.14em] text-ink-label">rounds</dd>
        </div>
        <div className="flex items-baseline gap-1.5">
          <dt className="font-medium text-ink-primary">{turns}</dt>
          <dd className="text-[11px] uppercase tracking-[0.14em] text-ink-label">turns</dd>
        </div>
        <div className="flex items-baseline gap-1.5">
          <dt className="font-medium text-ink-primary">{formatDate(summary.createdAt)}</dt>
          <dd className="text-[11px] uppercase tracking-[0.14em] text-ink-label">started</dd>
        </div>
      </dl>
    </div>
  );
}
