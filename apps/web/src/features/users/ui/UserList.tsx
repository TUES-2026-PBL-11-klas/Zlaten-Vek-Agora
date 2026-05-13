import type { User } from "@/entities/user";

export function UserList({ users }: { users: User[] }) {
  if (users.length === 0) {
    return <p className="text-neutral-400">No users yet.</p>;
  }

  return (
    <ul className="divide-y divide-neutral-700 rounded-md border border-neutral-700">
      {users.map((u) => (
        <li key={u.id} className="px-4 py-3">
          <span className="font-semibold">{u.name}</span>
          <span className="text-neutral-400"> — {u.email}</span>
        </li>
      ))}
    </ul>
  );
}
