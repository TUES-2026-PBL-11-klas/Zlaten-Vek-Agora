import type { ParticipantShiftDto } from "@agora/shared";
import { PersonaAvatar } from "@/features/debates/components/PersonaAvatar";
import { ShiftSparkline } from "./ShiftSparkline";

export function ShiftRow({ shift }: { shift: ParticipantShiftDto }) {
  return (
    <article className="grid grid-cols-1 gap-6 border-t border-hair py-8 lg:grid-cols-[200px_1fr_140px_1fr_80px] lg:items-center lg:gap-8">
      <div className="flex items-center gap-3">
        <PersonaAvatar name={shift.personaName} color={shift.personaColor} size={40} />
        <div className="flex flex-col">
          <span className="text-[15px] text-ink-primary">{shift.personaName}</span>
          <span className="text-[12px] text-ink-muted">{shift.personaDemographic}</span>
        </div>
      </div>

      <Quote eyebrow="Opened R1" body={shift.openedQuote} />

      <div className="flex justify-center">
        <ShiftSparkline color={shift.personaColor} shiftPercent={shift.shiftPercent} />
      </div>

      <Quote eyebrow="Closed R3" body={shift.closedQuote} />

      <div className="flex flex-col items-start lg:items-end">
        <span className="font-serif text-[40px] italic leading-none text-ink-primary">
          {shift.shiftPercent}%
        </span>
        <span className="mt-1 text-[11px] uppercase tracking-[0.18em] text-ink-label">Shift</span>
      </div>
    </article>
  );
}

function Quote({ eyebrow, body }: { eyebrow: string; body: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[11px] uppercase tracking-[0.18em] text-ink-label">{eyebrow}</span>
      <p className="font-serif text-[16px] italic leading-[22px] text-ink-body">
        &ldquo;{body}&rdquo;
      </p>
    </div>
  );
}
