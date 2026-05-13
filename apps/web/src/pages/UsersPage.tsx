import { useUsers } from "@/features/users/hooks/useUsers";
import { UserList } from "@/features/users/ui/UserList";
import { CreateUserForm } from "@/features/users/ui/CreateUserForm";

export function UsersPage() {
  const { users, loading, error, create } = useUsers();

  return (
    <section className="space-y-4">
      <h1 className="text-3xl font-bold">Users</h1>
      <CreateUserForm onSubmit={create} />
      {loading && <p className="text-neutral-400">Loading…</p>}
      {error && <p className="text-red-400">Error: {error}</p>}
      {!loading && !error && <UserList users={users} />}
    </section>
  );
}
