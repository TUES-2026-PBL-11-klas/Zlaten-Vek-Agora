import { personaColor } from "@/features/debates/lib/persona-avatar";

interface ShiftSparklineProps {
  color: string;
  shiftPercent: number;
}

export function ShiftSparkline({ color, shiftPercent }: ShiftSparklineProps) {
  const hue = personaColor(color);
  const middleFill = Math.min(Math.max(shiftPercent, 0), 100) / 100;

  return (
    <svg viewBox="0 0 120 28" width={120} height={28} aria-hidden className="block">
      <line
        x1={10}
        x2={110}
        y1={14}
        y2={14}
        stroke="var(--color-hair)"
        strokeWidth={1}
        strokeLinecap="round"
      />

      <circle cx={10} cy={14} r={5} fill="var(--color-surface)" stroke={hue} strokeWidth={2} />
      <circle
        cx={60}
        cy={14}
        r={5}
        fill={hue}
        fillOpacity={0.35 + middleFill * 0.45}
        stroke={hue}
        strokeWidth={2}
      />
      <circle cx={110} cy={14} r={5} fill={hue} stroke={hue} strokeWidth={2} />
    </svg>
  );
}
