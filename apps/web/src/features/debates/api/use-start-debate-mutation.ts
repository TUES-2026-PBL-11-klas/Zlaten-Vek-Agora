import { useMutation, useQueryClient } from "@tanstack/react-query";
import { httpClient } from "@/shared/api/http-client";

export function useStartDebateMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ debateId, mode }: { debateId: string; mode?: "step" }) => {
      await httpClient.post(`/debates/${debateId}/start`, null, {
        params: mode ? { mode } : undefined,
      });
    },
    onSuccess: (_data, { debateId }) => {
      void queryClient.invalidateQueries({ queryKey: ["debates", "overview", debateId] });
      void queryClient.invalidateQueries({ queryKey: ["debates", "detail", debateId] });
    },
  });
}
