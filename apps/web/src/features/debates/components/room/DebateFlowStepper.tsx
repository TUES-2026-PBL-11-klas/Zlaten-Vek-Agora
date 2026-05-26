import { Check } from "lucide-react";

interface DebateFlowStepperProps {
  currentRound: number;
  hasSynthesis: boolean;
}

const STEPS = [
  {
    phase: "position",
    label: "Opening positions",
    desc: "Each agent states their initial stance.",
  },
  { phase: "counter", label: "Counter-arguments", desc: "Agents respond directly to others." },
  { phase: "common_ground", label: "Common ground", desc: "Where compromise is possible." },
  { phase: "synthesis", label: "Synthesis", desc: "Neutral judge writes a summary." },
] as const;

function phaseIndex(round: number): number {
  return Math.min(round - 1, 2);
}

export function DebateFlowStepper({ currentRound, hasSynthesis }: DebateFlowStepperProps) {
  const isSynthesisPhase = hasSynthesis && currentRound > 3;
  const activeIdx = isSynthesisPhase ? 3 : phaseIndex(currentRound);
  const completedUpTo = isSynthesisPhase ? 2 : phaseIndex(currentRound) - 1;

  return (
    <nav className="flex flex-col gap-1" aria-label="Debate flow">
      <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.18em] text-ink-label">
        Debate flow
      </p>
      {STEPS.map((step, idx) => {
        const isCompleted = idx <= completedUpTo;
        const isCurrent = idx === activeIdx;

        return (
          <div key={step.phase} className="flex gap-3">
            <div className="flex flex-col items-center">
              {isCompleted ? (
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-persona-sage text-cream">
                  <Check size={14} strokeWidth={2.5} />
                </span>
              ) : (
                <span
                  className={[
                    "flex h-7 w-7 items-center justify-center rounded-full text-[13px] font-medium",
                    isCurrent ? "bg-ink-primary text-cream" : "border border-hair text-ink-muted",
                  ].join(" ")}
                >
                  {idx + 1}
                </span>
              )}
              {idx < STEPS.length - 1 && (
                <span
                  className={[
                    "mt-1 w-px flex-1 min-h-4",
                    idx <= completedUpTo ? "bg-persona-sage" : "border-l border-dashed border-hair",
                  ].join(" ")}
                />
              )}
            </div>
            <div
              className={[
                "flex flex-col gap-0.5 pb-4",
                isCurrent ? "rounded-xl bg-surface px-3 py-2.5" : "",
              ].join(" ")}
            >
              <span
                className={[
                  "font-serif text-[16px] leading-snug",
                  isCurrent ? "text-ink-primary" : isCompleted ? "text-ink-body" : "text-ink-muted",
                ].join(" ")}
              >
                {step.label}
              </span>
              <span className="text-[13px] leading-snug text-ink-muted">{step.desc}</span>
            </div>
          </div>
        );
      })}
    </nav>
  );
}
