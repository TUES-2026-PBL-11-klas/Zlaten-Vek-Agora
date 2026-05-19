import { DebateStatus } from "@agora/shared";
import { statusVisual } from "../lib/debate-status";

interface StatusPillProps {
  status: DebateStatus;
}

export function StatusPill({ status }: StatusPillProps) {
  const v = statusVisual(status);
  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[12px] font-medium",
        v.bg,
        v.ink,
      ].join(" ")}
    >
      {v.pulse ? (
        <span
          className="inline-block h-1.5 w-1.5 rounded-full bg-current animate-pulse-soft"
          aria-hidden
        />
      ) : null}
      {v.label}
    </span>
  );
}
