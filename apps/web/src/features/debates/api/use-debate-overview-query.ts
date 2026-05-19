import { useQuery } from "@tanstack/react-query";
import type { DebateOverviewDto } from "@agora/shared";
import { httpClient } from "@/shared/api/http-client";

export function useDebateOverviewQuery(id: string | null | undefined) {
  return useQuery({
    queryKey: ["debates", "overview", id],
    queryFn: async () => {
      const response = await httpClient.get<DebateOverviewDto>(`/debates/${id}/overview`);
      return response.data;
    },
    enabled: Boolean(id),
  });
}
