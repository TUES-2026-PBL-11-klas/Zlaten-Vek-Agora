import { useParams } from "react-router-dom";

export function DebateRoomPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <section className="space-y-2">
      <h1 className="text-3xl font-bold">Debate Room</h1>
      <p className="text-neutral-300">Debate ID: {id ?? "—"}</p>
    </section>
  );
}
