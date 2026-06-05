import { Link } from "react-router-dom";
import { AgoraGlyph } from "../lib/agora-glyph";

export function MethodologyFooter() {
  return (
    <aside className="mt-16 flex flex-col items-start justify-between gap-6 rounded-2xl bg-surface-mut px-8 py-7 sm:flex-row sm:items-center">
      <div className="flex items-start gap-5 sm:items-center">
        <span className="text-ink-primary">
          <AgoraGlyph size={40} />
        </span>
        <div>
          <p className="font-serif text-[20px] leading-[1.25] text-ink-primary">
            How does Agora arrive at its agents?
          </p>
          <p className="mt-1 max-w-[640px] text-[13px] leading-[20px] text-ink-muted">
            Read the methodology - how personas are derived, what each round optimizes for, how the
            synthesis stays neutral.
          </p>
        </div>
      </div>
      <Link
        to="/methodology"
        className="inline-flex h-10 shrink-0 items-center justify-center rounded-full border border-hair bg-surface px-4 text-[13px] font-medium text-ink-primary transition-colors hover:bg-canvas"
      >
        Read methodology
      </Link>
    </aside>
  );
}
