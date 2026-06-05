import { Link } from "react-router-dom";

interface SynthesisFooterProps {
  onReRun?: () => void;
}

export function SynthesisFooter({ onReRun }: SynthesisFooterProps) {
  return (
    <footer className="flex flex-col gap-4 border-t border-hair pt-10 sm:flex-row sm:items-center sm:justify-between">
      <Link
        to="/"
        className="inline-flex h-12 items-center justify-center rounded-full bg-ink-button px-6 text-[14px] font-medium text-cream transition-colors hover:opacity-90"
      >
        &larr; Back to dashboard
      </Link>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onReRun}
          className="inline-flex h-12 items-center justify-center rounded-full bg-surface px-6 text-[14px] font-medium text-ink-primary transition-colors hover:bg-surface-mut"
        >
          Re-run with new participants
        </button>
      </div>
    </footer>
  );
}
