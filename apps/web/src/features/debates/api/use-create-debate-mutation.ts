import { useMutation } from "@tanstack/react-query";
import type { CreateDebateResponseDto } from "@agora/shared";
import { httpClient } from "@/shared/api/http-client";

export interface CreateDebateParams {
  billTitle: string;
  billText?: string;
  file?: File;
}

export function useCreateDebateMutation() {
  return useMutation({
    mutationFn: async (params: CreateDebateParams): Promise<CreateDebateResponseDto> => {
      const form = new FormData();
      form.append("billTitle", params.billTitle);
      if (params.billText) {
        form.append("billText", params.billText);
      }
      if (params.file) {
        form.append("file", params.file);
      }

      const response = await httpClient.post<CreateDebateResponseDto>("/debates", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data;
    },
  });
}
