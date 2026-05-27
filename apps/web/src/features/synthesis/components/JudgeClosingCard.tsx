interface JudgeClosingCardProps {
  statement: string;
}

export function JudgeClosingCard({ statement }: JudgeClosingCardProps) {
  return (
    <section className="rounded-2xl border border-hair bg-surface-2 px-10 py-10">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
        <div className="flex flex-col items-center gap-2 lg:items-start">
          <span
            aria-hidden
            className="inline-flex h-16 w-16 items-center justify-center rounded-full font-serif text-[36px] text-cream"
            style={{ backgroundColor: "var(--color-persona-aubergine)" }}
          >
            &sect;
          </span>
        </div>

        <div className="flex flex-1 flex-col gap-3">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-ink-label">
            Closing &middot; Neutral judge
          </p>
          <blockquote className="font-serif text-[26px] italic leading-[1.35] text-ink-primary">
            &ldquo;{statement}&rdquo;
          </blockquote>
        </div>
      </div>
    </section>
  );
}
