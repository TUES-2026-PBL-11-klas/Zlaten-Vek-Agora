import { useMemo, useState } from "react";
import { DebateStatus } from "@agora/shared";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useDebatesQuery } from "@/features/debates/api/use-debates-query";
import { useDebateOverviewQuery } from "@/features/debates/api/use-debate-overview-query";
import { ChamberHeader } from "@/features/debates/components/ChamberHeader";
import { ActiveNowPanel } from "@/features/debates/components/ActiveNowPanel";
import { FilterPills, type DebateFilter } from "@/features/debates/components/FilterPills";
import { DebateCard } from "@/features/debates/components/DebateCard";
import { DebateCardSkeleton } from "@/features/debates/components/DebateCardSkeleton";
import { DebateEmptyState } from "@/features/debates/components/DebateEmptyState";
import { MethodologyFooter } from "@/features/debates/components/MethodologyFooter";
import { isActiveStatus } from "@/features/debates/lib/debate-status";
import { relativeDays } from "@/features/debates/lib/debate-code";

export function DashboardPage() {
  const { user } = useAuth();
  const debates = useDebatesQuery();
  const [filter, setFilter] = useState<DebateFilter>("all");

  const displayName = useMemo(() => deriveDisplayName(user?.email), [user?.email]);

  const list = useMemo(() => debates.data ?? [], [debates.data]);
  const debateCount = list.length;
  const participantCount = list.reduce((sum, d) => sum + d.personaCount, 0);
  const lastActive = list.length > 0 ? relativeDays(list[0].createdAt) : null;

  const activeDebate = useMemo(() => list.find((d) => isActiveStatus(d.status)), [list]);
  const overview = useDebateOverviewQuery(activeDebate?.id);

  const filtered = useMemo(() => applyFilter(list, filter), [list, filter]);

  return (
    <div className="flex flex-col">
      <ChamberHeader
        displayName={displayName}
        debateCount={debateCount}
        participantCount={participantCount}
        lastActive={lastActive}
      />

      {activeDebate ? (
        <ActiveNowPanel
          summary={activeDebate}
          overview={overview.data}
          isLoading={overview.isLoading}
        />
      ) : null}

      <section className="mt-14 flex flex-col gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-2">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-ink-label">
              Your debates {debateCount > 0 ? `· ${debateCount}` : ""}
            </p>
            <h2 className="font-serif text-[32px] leading-[1.1] text-ink-primary">
              The chamber, in retrospect.
            </h2>
          </div>
          {debateCount > 0 ? <FilterPills value={filter} onChange={setFilter} /> : null}
        </div>

        {debates.isLoading ? (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, idx) => (
              <DebateCardSkeleton key={idx} />
            ))}
          </div>
        ) : debates.isError ? (
          <p className="rounded-2xl border border-hair bg-surface px-6 py-5 text-[14px] text-ink-muted">
            Could not load your debates. Refresh to try again.
          </p>
        ) : debateCount === 0 ? (
          <DebateEmptyState />
        ) : filtered.length === 0 ? (
          <p className="rounded-2xl border border-hair bg-surface px-6 py-5 text-[14px] text-ink-muted">
            Nothing matches this filter yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((debate) => (
              <DebateCard key={debate.id} debate={debate} />
            ))}
          </div>
        )}
      </section>

      <MethodologyFooter />
    </div>
  );
}

function deriveDisplayName(email: string | undefined | null): string {
  if (!email) return "Your";
  const local = email.split("@")[0] ?? "";
  if (!local) return "Your";
  return local.charAt(0).toUpperCase() + local.slice(1);
}

function applyFilter(
  list: Awaited<ReturnType<typeof useDebatesQuery>["data"]>,
  filter: DebateFilter,
) {
  const safe = list ?? [];
  switch (filter) {
    case "active":
      return safe.filter((d) => isActiveStatus(d.status) || d.status === DebateStatus.Analyzing);
    case "synthesized":
      return safe.filter((d) => d.status === DebateStatus.Completed);
    case "drafts":
      return safe.filter((d) => d.status === DebateStatus.Draft);
    case "all":
    default:
      return safe;
  }
}
