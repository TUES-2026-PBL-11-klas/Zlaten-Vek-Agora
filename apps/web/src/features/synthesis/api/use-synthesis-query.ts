import { useQuery } from "@tanstack/react-query";
import type { SynthesisDto } from "@agora/shared";
import { httpClient } from "@/shared/api/http-client";

export function useSynthesisQuery(id: string | null | undefined) {
  return useQuery({
    queryKey: ["debates", "synthesis", id],
    queryFn: async () => {
      const response = await httpClient.get<SynthesisDto>(`/debates/${id}/synthesis`);
      return response.data;
    },
    enabled: Boolean(id),
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}
