import { useState, type MouseEvent } from "react";
import { Link } from "react-router-dom";
import type { DebateListItemDto } from "@agora/shared";
import { DebateStatus } from "@agora/shared";
import { StatusPill } from "./StatusPill";
import { PersonaStack } from "./PersonaStack";
import { debateCode, formatDate } from "../lib/debate-code";
import { personaColor } from "../lib/persona-avatar";
import { useDeleteDebateMutation } from "../api/use-delete-debate-mutation";
import { notify } from "@/shared/lib/notify";

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

  const [confirming, setConfirming] = useState(false);
  const deleteDebate = useDeleteDebateMutation();

  function handleDeleteClick(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    setConfirming(true);
  }

  function handleCancel(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    setConfirming(false);
  }

  async function handleConfirm(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    try {
      await deleteDebate.mutateAsync(debate.id);
      notify.success("Debate deleted.");
    } catch {
      notify.error("Failed to delete debate.");
      setConfirming(false);
    }
  }

  return (
    <Link
      to={`/debates/${debate.id}`}
      className="group relative block rounded-2xl border border-hair bg-surface px-6 pt-5 pb-6 transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_28px_-18px_rgba(31,27,22,0.35)]"
    >
      <div className="h-1 w-full rounded-full" style={{ backgroundColor: accent }} aria-hidden />

      <div className="mt-5 flex items-center justify-between">
        <span className="font-mono text-[12px] tracking-[0.08em] text-ink-muted">
          {debateCode(debate.title, debate.createdAt, debate.id)}
        </span>
        {confirming ? (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleConfirm}
              disabled={deleteDebate.isPending}
              className="inline-flex h-7 items-center rounded-full bg-accent-rust px-3 text-[11px] font-medium text-cream transition-colors hover:bg-accent-rust-hi disabled:opacity-40"
            >
              {deleteDebate.isPending ? "Deleting..." : "Delete"}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={deleteDebate.isPending}
              className="inline-flex h-7 items-center rounded-full border border-hair bg-surface px-3 text-[11px] text-ink-muted transition-colors hover:text-ink-body disabled:opacity-40"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="font-mono text-[12px] tracking-[0.08em] text-ink-muted">
              {formatDate(debate.createdAt)}
            </span>
            <button
              type="button"
              onClick={handleDeleteClick}
              aria-label="Delete debate"
              className="inline-flex h-7 w-7 items-center justify-center rounded-full text-ink-label opacity-0 transition-all hover:bg-accent-rust/10 hover:text-accent-rust focus-visible:opacity-100 group-hover:opacity-100"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6" />
              </svg>
            </button>
          </div>
        )}
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
