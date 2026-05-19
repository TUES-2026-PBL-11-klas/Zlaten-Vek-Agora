import { DebateStatus } from "@agora/shared";

export interface StatusVisual {
  label: string;
  bg: string;
  ink: string;
  pulse: boolean;
}

const visuals: Record<DebateStatus, StatusVisual> = {
  [DebateStatus.Draft]: {
    label: "Draft",
    bg: "bg-[var(--color-status-draft-bg)]",
    ink: "text-[var(--color-status-draft-ink)]",
    pulse: false,
  },
  [DebateStatus.Analyzing]: {
    label: "Analyzing",
    bg: "bg-[var(--color-status-analyzing-bg)]",
    ink: "text-[var(--color-status-analyzing-ink)]",
    pulse: true,
  },
  [DebateStatus.PersonasPending]: {
    label: "Review personas",
    bg: "bg-[var(--color-status-pending-bg)]",
    ink: "text-[var(--color-status-pending-ink)]",
    pulse: false,
  },
  [DebateStatus.Running]: {
    label: "Active",
    bg: "bg-[var(--color-status-running-bg)]",
    ink: "text-[var(--color-status-running-ink)]",
    pulse: true,
  },
  [DebateStatus.Completed]: {
    label: "Synthesized",
    bg: "bg-[var(--color-status-completed-bg)]",
    ink: "text-[var(--color-status-completed-ink)]",
    pulse: false,
  },
};

export function statusVisual(status: DebateStatus): StatusVisual {
  return visuals[status] ?? visuals[DebateStatus.Draft];
}

export function isActiveStatus(status: DebateStatus): boolean {
  return status === DebateStatus.Running || status === DebateStatus.PersonasPending;
}
