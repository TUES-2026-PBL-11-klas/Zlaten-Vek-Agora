import { useMemo, useState } from "react";
import { DebateStatus } from "@agora/shared";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useDebatesQuery } from "@/features/debates/api/use-debates-query";
import { useChamberStatsQuery } from "@/features/debates/api/use-chamber-stats-query";
import { useProfileQuery } from "@/features/profile/api/use-profile-query";
import { ChamberHeader } from "@/features/debates/components/ChamberHeader";
import { ActiveNowPanel } from "@/features/debates/components/ActiveNowPanel";
import { FilterPills, type DebateFilter } from "@/features/debates/components/FilterPills";
import { DebateCard } from "@/features/debates/components/DebateCard";
import { DebateCardSkeleton } from "@/features/debates/components/DebateCardSkeleton";
import { DebateEmptyState } from "@/features/debates/components/DebateEmptyState";
import { MethodologyFooter } from "@/features/debates/components/MethodologyFooter";
import { isActiveStatus } from "@/features/debates/lib/debate-status";
import { relativeDays } from "@/features/debates/lib/debate-code";
import type { DebateListItemDto } from "@agora/shared";

const PREVIEW_COUNT = 6;
const ALL_COUNT = 100;

export function DashboardPage() {
  const { user } = useAuth();
  const [showAll, setShowAll] = useState(false);
  const [filter, setFilter] = useState<DebateFilter>("all");

  const stats = useChamberStatsQuery();
  const profile = useProfileQuery();
  const debates = useDebatesQuery(showAll ? ALL_COUNT : PREVIEW_COUNT);

  const displayName = useMemo(
    () => profile.data?.name?.trim() || deriveDisplayName(user?.email),
    [profile.data?.name, user?.email],
  );

  const list = useMemo(() => debates.data?.items ?? [], [debates.data]);
  const total = debates.data?.total ?? 0;

  const debateCount = stats.data?.totalDebates ?? 0;
  const participantCount = stats.data?.totalParticipants ?? 0;
  const lastActive = stats.data?.lastActiveAt ? relativeDays(stats.data.lastActiveAt) : null;

  const activeDebates = useMemo(() => list.filter((d) => isActiveStatus(d.status)), [list]);

  const filtered = useMemo(() => applyFilter(list, filter), [list, filter]);
  const canSeeAll = !showAll && total > PREVIEW_COUNT;

  return (
    <div className="flex flex-col">
      <ChamberHeader
        displayName={displayName}
        debateCount={debateCount}
        participantCount={participantCount}
        lastActive={lastActive}
      />

      {activeDebates.length > 0 ? (
        <section className="mt-10">
          <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.18em] text-ink-label">
            Active now
          </p>
          <div className="flex flex-col gap-4">
            {activeDebates.map((debate) => (
              <ActiveNowPanel key={debate.id} summary={debate} />
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-14 flex flex-col gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-2">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-ink-label">
              Your debates {total > 0 ? `· ${total}` : ""}
            </p>
            <h2 className="font-serif text-[32px] leading-[1.1] text-ink-primary">
              The chamber, in retrospect.
            </h2>
          </div>
          {total > 0 ? <FilterPills value={filter} onChange={setFilter} /> : null}
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
        ) : total === 0 ? (
          <DebateEmptyState />
        ) : filtered.length === 0 ? (
          <p className="rounded-2xl border border-hair bg-surface px-6 py-5 text-[14px] text-ink-muted">
            Nothing matches this filter yet.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map((debate) => (
                <DebateCard key={debate.id} debate={debate} />
              ))}
            </div>
            {canSeeAll ? (
              <button
                type="button"
                onClick={() => setShowAll(true)}
                disabled={debates.isFetching}
                className="self-center rounded-full bg-surface px-6 text-[14px] font-medium text-ink-primary transition-colors hover:bg-surface-mut disabled:opacity-60 inline-flex h-12 items-center justify-center"
              >
                See all {total} debates &rarr;
              </button>
            ) : null}
          </>
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

function applyFilter(list: DebateListItemDto[], filter: DebateFilter): DebateListItemDto[] {
  switch (filter) {
    case "active":
      return list.filter((d) => isActiveStatus(d.status) || d.status === DebateStatus.Analyzing);
    case "synthesized":
      return list.filter((d) => d.status === DebateStatus.Completed);
    case "drafts":
      return list.filter((d) => d.status === DebateStatus.Draft);
    case "all":
    default:
      return list;
  }
}
