import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useProfileQuery } from "@/features/profile/api/use-profile-query";
import { useUpdateProfileMutation } from "@/features/profile/api/use-update-profile-mutation";
import { useDeleteAccountMutation } from "@/features/profile/api/use-delete-account-mutation";
import { notify } from "@/shared/lib/notify";

export function ProfilePage() {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const profile = useProfileQuery();
  const updateProfile = useUpdateProfileMutation();
  const deleteAccount = useDeleteAccountMutation();

  const [nameInput, setNameInput] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  function startEdit() {
    setNameInput(profile.data?.name ?? "");
    setEditingName(true);
  }

  function cancelEdit() {
    setEditingName(false);
    setNameInput("");
  }

  async function handleSaveName(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = nameInput.trim();
    if (!trimmed) return;
    try {
      await updateProfile.mutateAsync({ name: trimmed });
      notify.success("Username updated.");
      setEditingName(false);
    } catch {
      notify.error("Failed to update username.");
    }
  }

  async function handleSignOut() {
    await signOut();
    notify.success("Signed out.");
    navigate("/login", { replace: true });
  }

  async function handleDeleteAccount() {
    try {
      await deleteAccount.mutateAsync();
      await signOut();
      notify.success("Account deleted.");
      navigate("/login", { replace: true });
    } catch {
      notify.error("Failed to delete account.");
    }
  }

  const displayName = profile.data?.name ?? "-";
  const email = profile.data?.email ?? "-";
  const initial = displayName !== "-" ? displayName.charAt(0).toUpperCase() : "·";

  return (
    <div className="mx-auto max-w-[640px]">
      {/* Back */}
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-8 flex items-center gap-1.5 text-[13px] text-ink-muted transition-colors hover:text-ink-body hover:underline"
      >
        ← Back
      </button>

      {/* Page header */}
      <div className="mb-10 flex items-start justify-between">
        <div>
          <p className="mb-2 text-[11px] uppercase tracking-[0.14em] text-ink-label">Account</p>
          <h1 className="font-serif text-[36px] leading-[42px] text-ink-primary">
            Your <em className="text-accent-rust">profile.</em>
          </h1>
        </div>
        <button
          type="button"
          onClick={handleSignOut}
          className="mt-2 inline-flex h-9 items-center rounded-full border border-hair px-4 text-[13px] text-ink-muted transition-colors hover:border-ink-muted hover:text-ink-body"
        >
          Sign out
        </button>
      </div>

      {/* Avatar + identity */}
      <div className="mb-8 flex items-center gap-5">
        <div
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-[22px] font-medium text-cream"
          style={{ backgroundColor: "#6B6357" }}
        >
          {initial}
        </div>
        <div>
          <p className="font-serif text-[22px] leading-tight text-ink-primary">{displayName}</p>
          <p className="text-[14px] text-ink-muted">{email}</p>
        </div>
      </div>

      {/* Settings card */}
      <div className="rounded-2xl border border-hair bg-surface">
        {/* Email row */}
        <div className="px-8 py-6">
          <p className="mb-1 text-[11px] uppercase tracking-[0.14em] text-ink-label">
            Email address
          </p>
          <p className="text-[15px] text-ink-body">{email}</p>
          <p className="mt-1 text-[12px] text-ink-label">
            · Managed through your sign-in provider.
          </p>
        </div>

        <div className="mx-8 border-t border-hair" />

        {/* Username row */}
        <div className="px-8 py-6">
          <p className="mb-3 text-[11px] uppercase tracking-[0.14em] text-ink-label">Username</p>

          {editingName ? (
            <form onSubmit={handleSaveName} className="flex flex-col gap-3">
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                maxLength={64}
                autoFocus
                className="h-11 w-full rounded-full border border-hair bg-canvas px-5 text-[15px] text-ink-primary outline-none focus:border-ink-muted"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={updateProfile.isPending || !nameInput.trim()}
                  className="inline-flex h-10 items-center rounded-full bg-ink-button px-5 text-[13px] font-medium text-cream transition-colors hover:bg-ink-primary disabled:opacity-40"
                >
                  {updateProfile.isPending ? "Saving..." : "Save"}
                </button>
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="inline-flex h-10 items-center rounded-full border border-hair px-5 text-[13px] text-ink-muted transition-colors hover:text-ink-body"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="flex items-center justify-between gap-4">
              <p className="text-[15px] text-ink-body">{displayName}</p>
              <button
                type="button"
                onClick={startEdit}
                className="inline-flex h-8 items-center rounded-full border border-hair px-4 text-[12px] text-ink-muted transition-colors hover:border-ink-muted hover:text-ink-body"
              >
                Change
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Danger zone */}
      <div className="mt-12 rounded-2xl border border-accent-rust/40 bg-surface px-8 py-6">
        <p className="mb-1 text-[11px] uppercase tracking-[0.14em] text-accent-rust">Danger zone</p>
        <p className="mb-5 text-[13px] text-ink-muted">
          · Deleting your account removes all debates and data permanently.
        </p>

        {confirmDelete ? (
          <div className="flex flex-col gap-3">
            <p className="text-[14px] font-medium text-ink-primary">
              Cannot be undone. Are you sure?
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleteAccount.isPending}
                className="inline-flex h-10 items-center rounded-full bg-accent-rust px-5 text-[13px] font-medium text-cream transition-colors hover:bg-accent-rust-hi disabled:opacity-40"
              >
                {deleteAccount.isPending ? "Deleting..." : "Yes, delete everything"}
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="inline-flex h-10 items-center rounded-full border border-hair px-5 text-[13px] text-ink-muted transition-colors hover:text-ink-body"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="inline-flex h-10 items-center rounded-full border border-accent-rust/50 px-5 text-[13px] text-accent-rust transition-colors hover:border-accent-rust hover:bg-accent-rust/5"
          >
            Delete account
          </button>
        )}
      </div>
    </div>
  );
}
