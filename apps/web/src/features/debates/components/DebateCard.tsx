import { Link } from "react-router-dom";
import type { DebateListItemDto } from "@agora/shared";
import { DebateStatus } from "@agora/shared";
import { StatusPill } from "./StatusPill";
import { PersonaStack } from "./PersonaStack";
import { debateCode, formatDate } from "../lib/debate-code";
import { personaColor } from "../lib/persona-avatar";

interface DebateCardProps {
  debate: DebateListItemDto;
}

const ACCENT_BY_STATUS: Record<DebateStatus, string> = {
  [DebateStatus.Draft]: "var(--color-status-draft-bg)",
  [DebateStatus.Analyzing]: "var(--color-status-analyzing-ink)",
  [DebateStatus.AnalysisFailed]: "var(--color-status-draft-bg)",
  [DebateStatus.PersonasPending]: "var(--color-status-pending-ink)",
  [DebateStatus.Running]: "var(--color-persona-mustard)",
  [DebateStatus.Completed]: "var(--color-persona-sage)",
};

export function DebateCard({ debate }: DebateCardProps) {
  const accent = debate.personas[0]
    ? personaColor(debate.personas[0].color)
    : ACCENT_BY_STATUS[debate.status];

  return (
    <Link
      to={`/debates/${debate.id}`}
      className="group block rounded-2xl border border-hair bg-surface px-6 pt-5 pb-6 transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_28px_-18px_rgba(31,27,22,0.35)]"
    >
      <div className="h-1 w-full rounded-full" style={{ backgroundColor: accent }} aria-hidden />

      <div className="mt-5 flex items-baseline justify-between">
        <span className="font-mono text-[12px] tracking-[0.08em] text-ink-muted">
          {debateCode(debate.title, debate.createdAt, debate.id)}
        </span>
        <span className="font-mono text-[12px] tracking-[0.08em] text-ink-muted">
          {formatDate(debate.createdAt)}
        </span>
      </div>

      <h3 className="mt-4 line-clamp-2 font-serif text-[22px] leading-[28px] text-ink-primary">
        {debate.title}
      </h3>

      <div className="mt-8 flex items-center justify-between">
        <PersonaStack personas={debate.personas} total={debate.personaCount} size={32} />
        <div className="flex items-center gap-3 text-[13px] text-ink-muted">
          <StatusPill status={debate.status} />
          <span>·</span>
          <span>
            {debate.roundCount} {debate.roundCount === 1 ? "round" : "rounds"}
          </span>
        </div>
      </div>
    </Link>
  );
}
