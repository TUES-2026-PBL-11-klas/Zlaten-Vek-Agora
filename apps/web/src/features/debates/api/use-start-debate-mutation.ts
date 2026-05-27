import { useMutation, useQueryClient } from "@tanstack/react-query";
import { httpClient } from "@/shared/api/http-client";

export function useStartDebateMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (debateId: string) => {
      await httpClient.post(`/debates/${debateId}/start`);
    },
    onSuccess: (_data, debateId) => {
      void queryClient.invalidateQueries({ queryKey: ["debates", "overview", debateId] });
      void queryClient.invalidateQueries({ queryKey: ["debates", "detail", debateId] });
    },
  });
}
