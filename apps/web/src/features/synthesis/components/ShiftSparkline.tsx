import { personaColor } from "@/features/debates/lib/persona-avatar";

interface ShiftSparklineProps {
  color: string;
  shiftPercent: number;
}

const TRACK_START = 10;
const TRACK_END = 110;
const TRACK_LEN = TRACK_END - TRACK_START;
// Shifts cluster in the low end (~0-30%); cap the scale so small
// differences travel a visible distance instead of bunching at the start.
const FULL_TRAVEL_AT = 50;

export function ShiftSparkline({ color, shiftPercent }: ShiftSparklineProps) {
  const hue = personaColor(color);
  const progress = Math.min(Math.max(shiftPercent, 0), FULL_TRAVEL_AT) / FULL_TRAVEL_AT;
  const headX = TRACK_START + TRACK_LEN * progress;

  return (
    <svg viewBox="0 0 120 28" width={120} height={28} aria-hidden className="block">
      {/* full track */}
      <line
        x1={TRACK_START}
        x2={TRACK_END}
        y1={14}
        y2={14}
        stroke="var(--color-hair)"
        strokeWidth={1}
        strokeLinecap="round"
      />

      {/* traveled portion, proportional to shift */}
      <line
        x1={TRACK_START}
        x2={headX}
        y1={14}
        y2={14}
        stroke={hue}
        strokeWidth={2}
        strokeLinecap="round"
      />

      {/* start anchor (opened position) */}
      <circle
        cx={TRACK_START}
        cy={14}
        r={4}
        fill="var(--color-surface)"
        stroke={hue}
        strokeWidth={2}
      />

      {/* moving head (closed position) - distance from start shows shift magnitude */}
      <circle cx={headX} cy={14} r={5} fill={hue} stroke={hue} strokeWidth={2} />
    </svg>
  );
}
