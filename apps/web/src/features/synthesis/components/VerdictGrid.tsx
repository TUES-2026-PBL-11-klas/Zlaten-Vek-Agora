import type { SynthesisDto } from "@agora/shared";

interface VerdictColumnProps {
  label: string;
  dotVar: string;
  items: string[];
  emphasized?: boolean;
}

function VerdictColumn({ label, dotVar, items, emphasized = false }: VerdictColumnProps) {
  return (
    <article
      className={[
        "flex flex-col gap-6 rounded-2xl border border-hair px-8 py-8",
        emphasized ? "bg-surface-2" : "bg-surface",
      ].join(" ")}
    >
      <div className="flex items-center gap-3">
        <span
          aria-hidden
          className="inline-block h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: `var(${dotVar})` }}
        />
        <h2 className="font-serif text-[24px] leading-tight text-ink-primary">{label}</h2>
      </div>

      <ol className="flex flex-col gap-5">
        {items.map((item, idx) => (
          <li key={idx} className="grid grid-cols-[32px_1fr] items-baseline gap-3">
            <span className="font-serif text-[28px] italic leading-none text-accent-rust">
              {idx + 1}
            </span>
            <p className="text-[15px] leading-[22px] text-ink-body">{item}</p>
          </li>
        ))}
      </ol>
    </article>
  );
}

export function VerdictGrid({ synthesis }: { synthesis: SynthesisDto }) {
  return (
    <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <VerdictColumn
        label="Contradictions"
        dotVar="--color-persona-terracotta"
        items={synthesis.contradictions}
      />
      <VerdictColumn
        label="Common ground"
        dotVar="--color-persona-sage"
        items={synthesis.commonGround}
      />
      <VerdictColumn
        label="Compromise"
        dotVar="--color-persona-mustard"
        items={synthesis.compromise}
        emphasized
      />
    </section>
  );
}
