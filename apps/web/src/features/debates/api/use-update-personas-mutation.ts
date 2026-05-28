import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { UpdatePersonasRequestDto } from "@agora/shared";
import { httpClient } from "@/shared/api/http-client";

export function useUpdatePersonasMutation(debateId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: UpdatePersonasRequestDto) => {
      const response = await httpClient.patch(`/debates/${debateId}/personas`, body);
      return response.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["debates", "detail", debateId] });
    },
  });
}
