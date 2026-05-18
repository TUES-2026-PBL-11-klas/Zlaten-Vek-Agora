import { useParams } from "react-router-dom";

export function DebateRoomPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <section className="space-y-6">
      <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-ink-label">
        {id ?? "-"}
      </p>
      <h1 className="font-serif text-[56px] leading-[62px] text-ink-primary">
        The <em className="italic text-accent-rust">chamber.</em>
      </h1>
      <p className="max-w-[640px] text-[16px] leading-[24px] text-ink-body">
        Personas, rounds, and the judge&rsquo;s synthesis will be staged here.
      </p>
    </section>
  );
}
