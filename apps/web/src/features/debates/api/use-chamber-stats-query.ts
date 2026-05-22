import { useQuery } from "@tanstack/react-query";
import type { DebateChamberStatsDto } from "@agora/shared";
import { httpClient } from "@/shared/api/http-client";

export const chamberStatsQueryKey = ["debates", "chamber"] as const;

export function useChamberStatsQuery() {
  return useQuery({
    queryKey: chamberStatsQueryKey,
    queryFn: async () => {
      const response = await httpClient.get<DebateChamberStatsDto>("/debates/me/chamber");
      return response.data;
    },
    refetchOnWindowFocus: true,
  });
}
