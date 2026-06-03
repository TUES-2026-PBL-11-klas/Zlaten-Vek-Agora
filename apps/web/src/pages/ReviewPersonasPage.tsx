import { useParams, Navigate } from "react-router-dom";
import { DebateStatus } from "@agora/shared";
import { PersonaReview } from "./CreateDebatePage";

export function ReviewPersonasPage() {
  const { id } = useParams<{ id: string }>();

  if (!id) return <Navigate to="/" replace />;

  return (
    <PersonaReview
      debateId={id}
      initialPersonas={[]}
      initialStatus={DebateStatus.PersonasPending}
    />
  );
}
