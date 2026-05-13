import { Route, Routes, Link, Navigate } from "react-router-dom";
import { HomePage } from "@/pages/HomePage";
import { UsersPage } from "@/pages/UsersPage";

export function AppRouter() {
  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100 font-sans">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <nav className="flex gap-4 border-b border-neutral-700 pb-4 mb-8">
          <Link to="/" className="text-sky-400 hover:underline">Home</Link>
          <Link to="/users" className="text-sky-400 hover:underline">Users</Link>
        </nav>
        <main className="flex flex-col gap-4">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
