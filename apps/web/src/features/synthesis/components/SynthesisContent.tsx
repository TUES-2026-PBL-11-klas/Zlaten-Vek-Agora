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
  onShare?: () => void;
}

export function SynthesisContent({ synthesis, onExport, onReRun, onShare }: SynthesisContentProps) {
  return (
    <article className="flex flex-col gap-24">
      <SynthesisHeader synthesis={synthesis} onExport={onExport} />
      <VerdictGrid synthesis={synthesis} />
      <ShiftSection shifts={synthesis.participantShifts} />
      <JudgeClosingCard statement={synthesis.closingStatement} />
      <SynthesisFooter onReRun={onReRun} onShare={onShare} />
    </article>
  );
}
