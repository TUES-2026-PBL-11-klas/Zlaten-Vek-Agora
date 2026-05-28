import type { ParticipantShiftDto } from "@agora/shared";
import { ShiftRow } from "./ShiftRow";

export function ShiftSection({ shifts }: { shifts: ParticipantShiftDto[] }) {
  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-ink-label">
          By participant
        </p>
        <h2 className="font-serif text-[36px] leading-[1.1] text-ink-primary">
          How each seat shifted.
        </h2>
      </div>

      {shifts.length === 0 ? (
        <p className="text-[14px] text-ink-muted">
          &middot; No participant movement was recorded in this debate.
        </p>
      ) : (
        <div className="flex flex-col">
          {shifts.map((shift) => (
            <ShiftRow key={shift.personaId} shift={shift} />
          ))}
          <div className="border-t border-hair" />
        </div>
      )}
    </section>
  );
}
