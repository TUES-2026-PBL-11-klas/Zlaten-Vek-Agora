import { useQuery } from "@tanstack/react-query";
import type { DebateOverviewDto } from "@agora/shared";
import { DebateStatus } from "@agora/shared";
import { httpClient } from "@/shared/api/http-client";

export function useDebateStatusQuery(debateId: string | null | undefined) {
  return useQuery({
    queryKey: ["debates", "overview", debateId],
    queryFn: async () => {
      const response = await httpClient.get<DebateOverviewDto>(`/debates/${debateId}/overview`);
      return response.data;
    },
    enabled: Boolean(debateId),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      // Keep polling through the brief Draft window before analyze() flips to Analyzing.
      return status === DebateStatus.Analyzing || status === DebateStatus.Draft ? 2000 : false;
    },
  });
}
