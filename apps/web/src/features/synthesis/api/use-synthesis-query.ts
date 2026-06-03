import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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

export function useRegenerateSynthesisMutation(debateId: string | null | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const response = await httpClient.post<SynthesisDto>(
        `/debates/${debateId}/synthesis/regenerate`,
      );
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["debates", "synthesis", debateId], data);
    },
  });
}
