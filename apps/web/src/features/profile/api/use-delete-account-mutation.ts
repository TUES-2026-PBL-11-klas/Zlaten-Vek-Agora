import { useMutation } from "@tanstack/react-query";
import { httpClient } from "@/shared/api/http-client";

export function useDeleteAccountMutation() {
  return useMutation({
    mutationFn: async (): Promise<void> => {
      await httpClient.delete("/users/me");
    },
  });
}
