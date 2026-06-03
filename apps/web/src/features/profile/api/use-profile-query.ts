import { useQuery } from "@tanstack/react-query";
import type { AuthMeResponseDto } from "@agora/shared";
import { httpClient } from "@/shared/api/http-client";

export const profileQueryKey = ["profile"] as const;

export function useProfileQuery() {
  return useQuery({
    queryKey: profileQueryKey,
    queryFn: async (): Promise<AuthMeResponseDto> => {
      const res = await httpClient.get<AuthMeResponseDto>("/users/me");
      return res.data;
    },
  });
}
