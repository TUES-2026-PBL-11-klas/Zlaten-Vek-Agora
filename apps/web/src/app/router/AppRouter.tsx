import { Link, NavLink, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { DashboardPage } from "@/pages/DashboardPage";
import { CreateDebatePage } from "@/pages/CreateDebatePage";
import { DebateRoomPage } from "@/pages/DebateRoomPage";
import { LoginPage } from "@/pages/LoginPage";
import { RegisterPage } from "@/pages/RegisterPage";
import { SynthesisPage } from "@/pages/SynthesisPage";
import { ProfilePage } from "@/pages/ProfilePage";
import { ProtectedRoute } from "@/features/auth/components/ProtectedRoute";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { notify } from "@/shared/lib/notify";
import { AgoraGlyph } from "@/features/debates/lib/agora-glyph";

function Wordmark() {
  return (
    <NavLink to="/" className="flex items-center gap-2 text-ink-primary">
      <span className="text-ink-primary">
        <AgoraGlyph size={26} />
      </span>
      <span className="font-serif text-[22px] leading-none">Agora</span>
    </NavLink>
  );
}

function userInitial(email: string | undefined | null): string {
  if (!email) return "·";
  const local = email.split("@")[0] ?? "";
  return (local.charAt(0) || "·").toUpperCase();
}

function AuthNav() {
  const { session, user, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handlePointer = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  if (!session) {
    return (
      <div className="flex items-center gap-4">
        <NavLink
          to="/login"
          className="inline-flex h-9 items-center rounded-full px-4 text-[14px] font-medium text-ink-body hover:text-ink-primary"
        >
          Sign in
        </NavLink>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <div ref={menuRef} className="relative">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label="Account menu"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-hair bg-surface text-[13px] font-medium text-ink-primary transition-colors hover:bg-surface-mut"
        >
          {userInitial(user?.email)}
        </button>

        {open ? (
          <div
            role="menu"
            className="absolute right-0 top-[calc(100%+8px)] z-20 flex w-60 flex-col gap-3 rounded-2xl border border-hair bg-surface p-4 shadow-[0_18px_44px_-22px_rgba(31,27,22,0.45)]"
          >
            <div className="flex flex-col gap-0.5">
              <span className="text-[11px] uppercase tracking-[0.14em] text-ink-label">
                Signed in as
              </span>
              <span className="truncate text-[13px] text-ink-primary">{user?.email}</span>
            </div>
            <Link
              to="/profile"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="inline-flex h-9 items-center justify-center rounded-full border border-hair bg-surface text-[13px] font-medium text-ink-body transition-colors hover:bg-surface-mut"
            >
              Profile
            </Link>
            <button
              type="button"
              role="menuitem"
              onClick={async () => {
                setOpen(false);
                await signOut();
                notify.success("Signed out.");
                navigate("/login", { replace: true });
              }}
              className="inline-flex h-9 items-center justify-center rounded-full bg-ink-button text-[13px] font-medium text-cream transition-colors hover:bg-ink-primary"
            >
              Sign out
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function TopBar() {
  return (
    <header className="border-b border-hair">
      <div className="mx-auto flex h-[72px] max-w-[1240px] items-center justify-between px-12">
        <Wordmark />
        <AuthNav />
      </div>
    </header>
  );
}

export function AppRouter() {
  return (
    <div className="min-h-screen bg-canvas text-ink-primary">
      <TopBar />
      <main className="mx-auto max-w-[1240px] px-12 py-16">
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/debates/new"
            element={
              <ProtectedRoute>
                <CreateDebatePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/debates/:id"
            element={
              <ProtectedRoute>
                <DebateRoomPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/synthesis/:id"
            element={
              <ProtectedRoute>
                <SynthesisPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
