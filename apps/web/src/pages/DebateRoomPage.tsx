import { Link, useParams } from "react-router-dom";
import { useDebateDetailQuery } from "@/features/debates/api/use-debate-detail-query";
import { StatusPill } from "@/features/debates/components/StatusPill";
import { PersonaAvatar } from "@/features/debates/components/PersonaAvatar";
import { DebateTranscript } from "@/features/debates/components/DebateTranscript";
import { debateCode, formatDate } from "@/features/debates/lib/debate-code";

export function DebateRoomPage() {
  const { id } = useParams<{ id: string }>();
  const detail = useDebateDetailQuery(id);

  if (detail.isLoading) {
    return <DebateRoomSkeleton />;
  }

  if (detail.isError || !detail.data) {
    return (
      <section className="space-y-4">
        <h1 className="font-serif text-[40px] leading-[1.1] text-ink-primary">
          This debate could not be found.
        </h1>
        <p className="text-[16px] leading-6 text-ink-body">
          It may have been removed, or it belongs to another chamber.
        </p>
        <Link
          to="/"
          className="inline-flex h-12 items-center justify-center rounded-full bg-ink-button px-6 text-[14px] font-medium text-cream transition-colors hover:opacity-90"
        >
          &larr; Back to dashboard
        </Link>
      </section>
    );
  }

  const debate = detail.data;
  const current = debate.rounds.current;

  return (
    <div className="flex flex-col gap-12">
      <header className="flex flex-col gap-5 border-b border-hair pb-10">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[12px] uppercase tracking-[0.08em] text-ink-muted">
            {debateCode(debate.title, debate.createdAt, debate.id)}
          </span>
          <StatusPill status={debate.status} />
        </div>
        <h1 className="font-serif text-[44px] leading-[1.05] text-ink-primary sm:text-[56px]">
          {debate.title}
        </h1>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <p className="font-mono text-[12px] uppercase tracking-[0.08em] text-ink-label">
            Round {current?.number ?? debate.rounds.completed} of {debate.rounds.total}
            {current ? ` · ${current.phase}` : ""}
          </p>
          <p className="text-[13px] text-ink-muted">
            {debate.rounds.completed}/{debate.rounds.total} rounds done · {debate.turns} turns ·
            started {formatDate(debate.createdAt)}
          </p>
          {debate.hasSynthesis ? (
            <a
              href="#synthesis"
              className="text-[13px] text-accent-rust underline-offset-4 hover:underline"
            >
              Jump to synthesis &rarr;
            </a>
          ) : null}
        </div>
      </header>

      <section className="flex flex-col gap-4">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-ink-label">
          At the table
        </p>
        <ul className="flex flex-wrap gap-x-8 gap-y-3">
          {debate.personas.map((persona) => (
            <li key={persona.id} className="flex items-center gap-3">
              <PersonaAvatar name={persona.name} color={persona.color} size={40} />
              <div className="flex flex-col">
                <span className="text-[14px] text-ink-primary">{persona.name}</span>
                <span className="text-[12px] text-ink-muted">{persona.demographic}</span>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-6">
        <h2 className="font-serif text-[32px] leading-[1.1] text-ink-primary">
          How the chamber spoke.
        </h2>
        <DebateTranscript messages={debate.messages} />
      </section>
    </div>
  );
}

function DebateRoomSkeleton() {
  return (
    <div className="flex flex-col gap-8">
      <div className="h-4 w-32 animate-pulse rounded bg-surface-mut" />
      <div className="h-12 w-3/4 animate-pulse rounded bg-surface-mut" />
      <div className="h-4 w-1/2 animate-pulse rounded bg-surface-mut" />
      <div className="mt-6 flex flex-col gap-4">
        {Array.from({ length: 3 }).map((_, idx) => (
          <div key={idx} className="h-28 animate-pulse rounded-2xl bg-surface" />
        ))}
      </div>
    </div>
  );
}
