import type { CreateUserDto } from "@agora/shared";
import { httpClient } from "@/shared/api/http-client";
import type { User } from "../model/types";

export const usersApi = {
  list: () => httpClient.get<User[]>("/users"),
  getById: (id: string) => httpClient.get<User>(`/users/${id}`),
  create: (input: CreateUserDto) => httpClient.post<User>("/users", input),
};
