import { NavLink, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { DashboardPage } from "@/pages/DashboardPage";
import { NewDebatePage } from "@/pages/NewDebatePage";
import { DebateRoomPage } from "@/pages/DebateRoomPage";
import { LoginPage } from "@/pages/LoginPage";
import { RegisterPage } from "@/pages/RegisterPage";
import { ProtectedRoute } from "@/features/auth/components/ProtectedRoute";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { notify } from "@/shared/lib/notify";
import { AgoraGlyph } from "@/features/debates/lib/agora-glyph";

const APP_VERSION = "prototype · v0.3";

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

function NavItem({ to, end, children }: { to: string; end?: boolean; children: ReactNode }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        [
          "inline-flex h-9 items-center rounded-full px-4 text-[14px] font-medium transition-colors",
          isActive ? "bg-ink-button text-cream" : "text-ink-body hover:text-ink-primary",
        ].join(" ")
      }
    >
      {children}
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
        <span className="hidden text-[12px] tracking-[0.04em] text-ink-label sm:inline">
          {APP_VERSION}
        </span>
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
      <span className="hidden text-[12px] tracking-[0.04em] text-ink-label sm:inline">
        {APP_VERSION}
      </span>
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
        <nav className="flex items-center gap-2">
          <NavItem to="/" end>
            Dashboard
          </NavItem>
          <NavItem to="/debates/new">Debate room</NavItem>
          <NavItem to="/synthesis">Synthesis</NavItem>
          <NavItem to="/design-system">Design system</NavItem>
        </nav>
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
                <NewDebatePage />
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
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
