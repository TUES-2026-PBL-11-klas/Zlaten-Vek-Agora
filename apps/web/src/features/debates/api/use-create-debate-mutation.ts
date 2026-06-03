import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import type { CreateDebateResponseDto } from "@agora/shared";
import { httpClient } from "@/shared/api/http-client";

export interface CreateDebateParams {
  billTitle: string;
  billText?: string;
  file?: File;
}

function toReadableError(err: unknown): Error {
  if (axios.isAxiosError(err)) {
    const status = err.response?.status;
    const body = err.response?.data as { message?: string | string[] } | undefined;
    const serverMessage = body?.message;

    if (status === 413) return new Error("The PDF is too large. Maximum file size is 20 MB.");
    if (status === 401) return new Error("You need to be signed in to create a debate.");
    if (status === 400) {
      if (Array.isArray(serverMessage)) return new Error(serverMessage[0]);
      if (typeof serverMessage === "string") return new Error(serverMessage);
      return new Error("Invalid input. Check the title and bill text.");
    }
    if (status === 422) {
      if (typeof serverMessage === "string") return new Error(serverMessage);
      return new Error("The file could not be processed. Try a different PDF.");
    }
    if (!err.response) return new Error("Could not reach the server. Check your connection.");
    return new Error("Something went wrong. Please try again.");
  }
  if (err instanceof Error) return err;
  return new Error("Something went wrong. Please try again.");
}

export function useCreateDebateMutation() {
  return useMutation({
    mutationFn: async (params: CreateDebateParams): Promise<CreateDebateResponseDto> => {
      const form = new FormData();
      form.append("billTitle", params.billTitle);
      if (params.billText) form.append("billText", params.billText);
      if (params.file) form.append("file", params.file);

      try {
        const response = await httpClient.post<CreateDebateResponseDto>("/debates", form, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        return response.data;
      } catch (err) {
        throw toReadableError(err);
      }
    },
  });
}
