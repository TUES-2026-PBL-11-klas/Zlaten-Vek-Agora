import { Route, Routes, Link, Navigate } from "react-router-dom";
import { DashboardPage } from "@/pages/DashboardPage";
import { NewDebatePage } from "@/pages/NewDebatePage";
import { DebateRoomPage } from "@/pages/DebateRoomPage";
import { LoginPage } from "@/pages/LoginPage";

export function AppRouter() {
  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100 font-sans">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <nav className="flex gap-4 border-b border-neutral-700 pb-4 mb-8">
          <Link to="/" className="text-sky-400 hover:underline">Dashboard</Link>
          <Link to="/debates/new" className="text-sky-400 hover:underline">New Debate</Link>
          <Link to="/login" className="text-sky-400 hover:underline">Login</Link>
        </nav>
        <main className="flex flex-col gap-4">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/debates/new" element={<NewDebatePage />} />
            <Route path="/debates/:id" element={<DebateRoomPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
