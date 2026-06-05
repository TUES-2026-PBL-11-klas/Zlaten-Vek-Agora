import type { SynthesisDto } from "@agora/shared";
import { SynthesisHeader } from "./SynthesisHeader";
import { VerdictGrid } from "./VerdictGrid";
import { ShiftSection } from "./ShiftSection";
import { JudgeClosingCard } from "./JudgeClosingCard";
import { SynthesisFooter } from "./SynthesisFooter";

interface SynthesisContentProps {
  synthesis: SynthesisDto;
  onExport?: () => void;
  onReRun?: () => void;
}

export function SynthesisContent({ synthesis, onExport, onReRun }: SynthesisContentProps) {
  return (
    <article className="flex flex-col gap-24">
      <SynthesisHeader synthesis={synthesis} onExport={onExport} />
      <VerdictGrid synthesis={synthesis} />
      <ShiftSection shifts={synthesis.participantShifts} />
      <JudgeClosingCard statement={synthesis.closingStatement} />
      <SynthesisFooter onReRun={onReRun} />
    </article>
  );
}
