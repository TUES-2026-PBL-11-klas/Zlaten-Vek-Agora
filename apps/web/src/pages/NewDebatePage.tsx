export function NewDebatePage() {
  return (
    <section className="space-y-6">
      <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-ink-label">
        New session
      </p>
      <h1 className="font-serif text-[56px] leading-[62px] text-ink-primary">
        Begin a <em className="italic text-accent-rust">debate.</em>
      </h1>
      <p className="max-w-[640px] text-[16px] leading-[24px] text-ink-body">
        Upload a PDF or paste a bill. The chamber will read it, name the affected groups, and seat
        them around the table.
      </p>
    </section>
  );
}
