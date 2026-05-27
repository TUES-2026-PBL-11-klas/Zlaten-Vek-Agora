import { useQuery } from "@tanstack/react-query";
import type { PersonaDraftDto } from "@agora/shared";
import { httpClient } from "@/shared/api/http-client";

export function usePersonasQuery(debateId: string | null | undefined) {
  return useQuery({
    queryKey: ["debates", "personas", debateId],
    queryFn: async () => {
      const response = await httpClient.get<PersonaDraftDto[]>(`/debates/${debateId}/personas`);
      return response.data;
    },
    enabled: Boolean(debateId),
  });
}
