import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { AuthMeResponseDto, UpdateProfileRequestDto } from "@agora/shared";
import { httpClient } from "@/shared/api/http-client";
import { profileQueryKey } from "./use-profile-query";

export function useUpdateProfileMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateProfileRequestDto): Promise<AuthMeResponseDto> => {
      const res = await httpClient.patch<AuthMeResponseDto>("/users/me", data);
      return res.data;
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(profileQueryKey, updated);
    },
  });
}
