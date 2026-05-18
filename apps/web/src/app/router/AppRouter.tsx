import { NavLink, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import type { ReactNode } from "react";
import { DashboardPage } from "@/pages/DashboardPage";
import { NewDebatePage } from "@/pages/NewDebatePage";
import { DebateRoomPage } from "@/pages/DebateRoomPage";
import { LoginPage } from "@/pages/LoginPage";
import { RegisterPage } from "@/pages/RegisterPage";
import { ProtectedRoute } from "@/features/auth/components/ProtectedRoute";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { notify } from "@/shared/lib/notify";

function Wordmark() {
  return (
    <NavLink to="/" className="flex items-baseline gap-2 text-ink-primary">
      <span className="font-serif text-[22px] leading-none">Agora</span>
      <span className="text-[11px] uppercase tracking-[0.14em] text-ink-label">debates</span>
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

function AuthNav() {
  const { session, user, signOut } = useAuth();
  const navigate = useNavigate();

  if (!session) {
    return (
      <NavLink
        to="/login"
        className="inline-flex h-9 items-center rounded-full px-4 text-[14px] font-medium text-ink-body hover:text-ink-primary"
      >
        Sign in
      </NavLink>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-[13px] text-ink-muted">{user?.email}</span>
      <button
        type="button"
        onClick={async () => {
          await signOut();
          notify.success("Signed out.");
          navigate("/login", { replace: true });
        }}
        className="inline-flex h-9 items-center rounded-full bg-surface px-4 text-[13px] font-medium text-ink-primary transition-colors hover:bg-surface-mut"
      >
        Sign out
      </button>
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
          <NavItem to="/debates/new">New debate</NavItem>
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
