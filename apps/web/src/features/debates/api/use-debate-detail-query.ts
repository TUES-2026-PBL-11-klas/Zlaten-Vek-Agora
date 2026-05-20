import { useQuery } from "@tanstack/react-query";
import type { DebateDetailDto } from "@agora/shared";
import { httpClient } from "@/shared/api/http-client";

export function useDebateDetailQuery(id: string | null | undefined) {
  return useQuery({
    queryKey: ["debates", "detail", id],
    queryFn: async () => {
      const response = await httpClient.get<DebateDetailDto>(`/debates/${id}`);
      return response.data;
    },
    enabled: Boolean(id),
  });
}
