import { useQuery } from "@tanstack/react-query";
import type { DebateListItemDto } from "@agora/shared";
import { httpClient } from "@/shared/api/http-client";

export const debatesQueryKey = ["debates", "list"] as const;

export function useDebatesQuery() {
  return useQuery({
    queryKey: debatesQueryKey,
    queryFn: async () => {
      const response = await httpClient.get<DebateListItemDto[]>("/debates");
      return response.data;
    },
    refetchOnWindowFocus: true,
  });
}
