import { useMutation, useQueryClient } from "@tanstack/react-query";
import { httpClient } from "@/shared/api/http-client";

export function useDeleteDebateMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (debateId: string): Promise<void> => {
      await httpClient.delete(`/debates/${debateId}`);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["debates", "list"] });
      void queryClient.invalidateQueries({ queryKey: ["debates", "chamber"] });
    },
  });
}
