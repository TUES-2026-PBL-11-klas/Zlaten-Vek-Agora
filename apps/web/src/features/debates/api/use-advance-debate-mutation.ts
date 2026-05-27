import { useMutation } from "@tanstack/react-query";
import { httpClient } from "@/shared/api/http-client";

export function useAdvanceDebateMutation() {
  return useMutation({
    mutationFn: async (debateId: string) => {
      await httpClient.post(`/debates/${debateId}/advance`);
    },
  });
}
