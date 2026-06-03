import { Link } from "react-router-dom";
import type { SynthesisDto } from "@agora/shared";
import { debateCode, formatDate } from "@/features/debates/lib/debate-code";

interface SynthesisHeaderProps {
  synthesis: SynthesisDto;
  onExport?: () => void;
}

export function SynthesisHeader({ synthesis, onExport }: SynthesisHeaderProps) {
  const code = debateCode(synthesis.title, synthesis.createdAt, synthesis.debateId);
  const concluded = formatDate(synthesis.createdAt);

  return (
    <header className="flex flex-col gap-6 border-b border-hair pb-12">
      <span className="font-mono text-[12px] uppercase tracking-[0.14em] text-ink-label">
        Synthesis &middot; {code}
      </span>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex max-w-[720px] flex-col gap-5">
          <h1 className="font-serif text-[56px] leading-[1.05] text-ink-primary lg:text-[64px]">
            Where the table arrived,{" "}
            <em className="not-italic text-accent-rust italic">together.</em>
          </h1>
          <p className="text-[16px] leading-7 text-ink-body">
            Three rounds in, the chamber settles. The neutral judge reads the transcript end to end
            and lays out the fault lines, the agreements, and the shape of a workable compromise -
            without taking a side.
          </p>
          <p className="text-[12px] uppercase tracking-[0.14em] text-ink-label">
            Concluded {concluded}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 print:hidden">
          <Link
            to={`/debates/${synthesis.debateId}`}
            className="inline-flex h-12 items-center justify-center rounded-full bg-surface px-6 text-[14px] font-medium text-ink-primary transition-colors hover:bg-surface-mut"
          >
            &larr; Back to debate
          </Link>
          <button
            type="button"
            onClick={onExport}
            className="inline-flex h-12 items-center justify-center rounded-full bg-ink-button px-6 text-[14px] font-medium text-cream transition-colors hover:opacity-90"
          >
            Export
          </button>
        </div>
      </div>
    </header>
  );
}
