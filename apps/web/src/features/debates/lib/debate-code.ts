export function debateCode(title: string, createdAt: string, id: string): string {
  const words = title
    .replace(/[^A-Za-z0-9\s]/g, "")
    .split(/\s+/)
    .filter(Boolean);
  const initials =
    words.length >= 3
      ? words
          .slice(0, 3)
          .map((w) => w[0])
          .join("")
      : (words[0] ?? "DBT").slice(0, 3);
  const year = createdAt.slice(0, 4);
  const suffix = id.replace(/-/g, "").slice(0, 2);
  return `${initials.toUpperCase()}-${year}-${suffix.toUpperCase()}`;
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function relativeDays(iso: string, now: Date = new Date()): string {
  const then = new Date(iso).getTime();
  const diffMs = now.getTime() - then;
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days <= 0) return "today";
  if (days === 1) return "1 day ago";
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  if (months === 1) return "1 month ago";
  return `${months} months ago`;
}
