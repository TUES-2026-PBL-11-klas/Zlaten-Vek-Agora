import { useCallback, useEffect, useState } from "react";
import type { CreateUserDto } from "@agora/shared";
import { usersApi, type User } from "@/entities/user";

interface UseUsersState {
  users: User[];
  loading: boolean;
  error: string | null;
}

export function useUsers() {
  const [state, setState] = useState<UseUsersState>({ users: [], loading: true, error: null });

  const refresh = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const users = await usersApi.list();
      setState({ users, loading: false, error: null });
    } catch (err) {
      setState({ users: [], loading: false, error: err instanceof Error ? err.message : "Unknown error" });
    }
  }, []);

  const create = useCallback(
    async (input: CreateUserDto) => {
      await usersApi.create(input);
      await refresh();
    },
    [refresh],
  );

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { ...state, refresh, create };
}
