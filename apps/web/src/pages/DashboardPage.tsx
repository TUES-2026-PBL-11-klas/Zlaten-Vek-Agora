export function DashboardPage() {
  return (
    <section className="space-y-6">
      <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-ink-label">
        Your chamber
      </p>
      <h1 className="font-serif text-[56px] leading-[62px] text-ink-primary">
        Recent <em className="italic text-accent-rust">debates.</em>
      </h1>
      <p className="max-w-[640px] text-[16px] leading-[24px] text-ink-body">
        Your debates will appear here. Upload a bill or paste its text to start a new session.
      </p>
    </section>
  );
}
