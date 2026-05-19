import { Link } from "react-router-dom";
import { AgoraGlyph } from "../lib/agora-glyph";

export function DebateEmptyState() {
  return (
    <div className="flex flex-col items-center gap-6 rounded-3xl border border-hair bg-surface px-8 py-20 text-center">
      <span className="text-accent-rust">
        <AgoraGlyph size={56} />
      </span>
      <h2 className="font-serif text-[36px] leading-[1.1] text-ink-primary">
        Start your first debate.
      </h2>
      <p className="max-w-[440px] text-[15px] leading-[22px] text-ink-muted">
        Upload a bill or paste its text. Agora extracts the affected groups and assembles a chamber
        of agents to argue it out, round by round.
      </p>
      <Link
        to="/debates/new"
        className="mt-2 inline-flex h-11 items-center justify-center rounded-full bg-accent-rust px-5 text-[14px] font-medium text-cream transition-colors hover:bg-accent-rust-hi"
      >
        + New debate
      </Link>
    </div>
  );
}
