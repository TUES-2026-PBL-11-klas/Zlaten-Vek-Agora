import { useState, type FormEvent } from "react";
import type { CreateUserDto } from "@agora/shared";

interface Props {
  onSubmit: (input: CreateUserDto) => Promise<void>;
}

const inputClass =
  "rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-neutral-100 placeholder-neutral-500 focus:border-sky-400 focus:outline-none";

export function CreateUserForm({ onSubmit }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({ name, email });
      setName("");
      setEmail("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create user");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-2">
      <input
        type="text"
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        className={inputClass}
      />
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className={inputClass}
      />
      <button
        type="submit"
        disabled={submitting}
        className="rounded-md border border-neutral-700 bg-neutral-800 px-4 py-2 hover:border-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? "Adding…" : "Add user"}
      </button>
      {error && <p className="w-full text-red-400">{error}</p>}
    </form>
  );
}
