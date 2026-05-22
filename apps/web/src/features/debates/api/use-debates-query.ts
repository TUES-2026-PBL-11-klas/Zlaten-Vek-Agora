import { useQuery } from "@tanstack/react-query";
import type { DebateListItemDto, Paginated } from "@agora/shared";
import { httpClient } from "@/shared/api/http-client";

export const debatesQueryKey = (pageSize: number) => ["debates", "list", pageSize] as const;

export function useDebatesQuery(pageSize: number) {
  return useQuery({
    queryKey: debatesQueryKey(pageSize),
    queryFn: async () => {
      const response = await httpClient.get<Paginated<DebateListItemDto>>("/debates", {
        params: { page: 1, pageSize },
      });
      return response.data;
    },
    refetchOnWindowFocus: true,
  });
}
