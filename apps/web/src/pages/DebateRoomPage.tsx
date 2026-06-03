import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { DebateStatus } from "@agora/shared";
import { useDebateDetailQuery } from "@/features/debates/api/use-debate-detail-query";
import { useAdvanceDebateMutation } from "@/features/debates/api/use-advance-debate-mutation";
import { StatusPill } from "@/features/debates/components/StatusPill";
import { DebateTranscript } from "@/features/debates/components/DebateTranscript";
import { debateCode, formatDate } from "@/features/debates/lib/debate-code";
import { usePlayback } from "@/features/debates/hooks/use-playback";
import { useLivePlayback } from "@/features/debates/hooks/use-live-playback";
import { useDebateStream } from "@/features/debates/hooks/use-debate-stream";
import { DebateFlowStepper } from "@/features/debates/components/room/DebateFlowStepper";
import { StageView } from "@/features/debates/components/room/StageView";
import { BillSummaryPanel } from "@/features/debates/components/room/BillSummaryPanel";
import { PersonaListPanel } from "@/features/debates/components/room/PersonaListPanel";
import { ActiveQuoteCard } from "@/features/debates/components/room/ActiveQuoteCard";
import { PlaybackControls } from "@/features/debates/components/room/PlaybackControls";
import { PersonaAvatar } from "@/features/debates/components/PersonaAvatar";
import {
  fromPlaybackMessage,
  fromStreamedMessage,
  type ActiveMessage,
} from "@/features/debates/lib/active-message";

type ViewMode = "stage" | "chamber";

export function DebateRoomPage() {
  const { id } = useParams<{ id: string }>();
  const detail = useDebateDetailQuery(id);

  if (detail.isLoading) {
    return <DebateRoomSkeleton />;
  }

  if (detail.isError || !detail.data) {
    return (
      <section className="space-y-4">
        <h1 className="font-serif text-[40px] leading-[1.1] text-ink-primary">
          This debate could not be found.
        </h1>
        <p className="text-[16px] leading-6 text-ink-body">
          It may have been removed, or it belongs to another chamber.
        </p>
        <Link
          to="/"
          className="inline-flex h-12 items-center justify-center rounded-full bg-ink-button px-6 text-[14px] font-medium text-cream transition-colors hover:opacity-90"
        >
          &larr; Back to dashboard
        </Link>
      </section>
    );
  }

  return <DebateRoomContent debate={detail.data} debateId={id} />;
}

function DebateRoomContent({
  debate,
  debateId,
}: {
  debate: NonNullable<ReturnType<typeof useDebateDetailQuery>["data"]>;
  debateId: string | undefined;
}) {
  const [view, setView] = useState<ViewMode>("stage");
  const isRunning = debate.status === DebateStatus.Running;
  const stream = useDebateStream(debateId, isRunning);
  const playback = usePlayback(debate.messages);
  const live = useLivePlayback(stream.streamedMessages);
  const advanceMutation = useAdvanceDebateMutation();
  const navigate = useNavigate();

  const isLive = isRunning && stream.isStreaming;

  useEffect(() => {
    if (stream.isComplete && debateId) {
      navigate(`/synthesis/${debateId}`);
    }
  }, [stream.isComplete, debateId, navigate]);

  const liveActiveMessage: ActiveMessage | null = useMemo(() => {
    const current = live.currentMessage;
    if (!current) return null;
    const persona = debate.personas.find((p) => p.id === current.personaId);
    if (!persona) return null;
    return fromStreamedMessage(current, persona);
  }, [live.currentMessage, debate.personas]);

  const displayMessage: ActiveMessage | null = isLive
    ? liveActiveMessage
    : playback.currentMessage
      ? fromPlaybackMessage(playback.currentMessage)
      : null;

  const activePersonaId = isLive
    ? (live.currentMessage?.personaId ?? debate.activeTurn?.personaId ?? null)
    : (playback.currentMessage?.persona.id ?? null);

  const streamEmotions = useMemo(() => {
    const map = new Map<string, string>();
    for (const msg of stream.streamedMessages) {
      if (msg.complete && msg.emotion) map.set(msg.personaId, msg.emotion);
    }
    return map;
  }, [stream.streamedMessages]);

  const liveTurnLabel = isLive ? live.turnLabel : playback.turnLabel;

  const current = debate.rounds.current;
  const currentRound = isLive
    ? (live.currentMessage?.roundNumber ?? stream.currentRound ?? current?.number ?? 1)
    : (playback.currentMessage?.roundNumber ?? current?.number ?? 1);
  const code = debateCode(debate.title, debate.createdAt, debate.id);
  const roundLabel = `Round ${currentRound} of ${debate.rounds.total}`;
  const uploadDate = formatDate(debate.createdAt);

  function handleAdvance() {
    if (debateId) advanceMutation.mutate(debateId);
  }

  function handleSkipToSynthesis() {
    if (debateId) navigate(`/synthesis/${debateId}`);
  }

  return (
    <div className="flex flex-col gap-8">
      <Link
        to="/"
        className="inline-flex items-center gap-1 text-[13px] text-accent-rust hover:underline"
      >
        &larr; Dashboard
      </Link>
      <header className="flex flex-col gap-4 border-b border-hair pb-8">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[12px] uppercase tracking-[0.08em] text-ink-muted">
            {code} &middot; uploaded {uploadDate}
          </span>
          <div className="flex items-center gap-3">
            {isLive && (
              <span className="flex items-center gap-1.5 text-[12px] text-ink-muted">
                <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-accent-rust" />
                Live
              </span>
            )}
            <ViewToggle active={view} onChange={setView} />
          </div>
        </div>
        <div className="flex items-start justify-between gap-4">
          <h1 className="font-serif text-[36px] leading-[1.1] text-ink-primary lg:text-[44px]">
            {debate.title}
          </h1>
          <StatusPill status={debate.status} />
        </div>
      </header>

      {view === "stage" ? (
        <>
          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[220px_1fr_280px]">
            <div className="hidden flex-col gap-4 lg:flex">
              <DebateFlowStepper currentRound={currentRound} hasSynthesis={debate.hasSynthesis} />
              {debate.hasSynthesis && debate.status === DebateStatus.Completed && (
                <Link
                  to={`/synthesis/${debateId}`}
                  className="inline-flex items-center gap-1 text-[13px] font-medium text-accent-rust transition-colors hover:text-accent-rust-hi"
                >
                  See the synthesis &rarr;
                </Link>
              )}
            </div>

            <StageView
              personas={debate.personas}
              activePersonaId={activePersonaId}
              allMessages={playback.messages}
              currentIndex={playback.currentIndex}
              billCode={code}
              roundLabel={roundLabel}
              streamEmotions={isLive ? streamEmotions : undefined}
            />

            <div className="flex flex-col gap-4">
              <BillSummaryPanel keyChanges={debate.keyChanges} />
              <PersonaListPanel personas={debate.personas} activePersonaId={activePersonaId} />
            </div>
          </div>

          {displayMessage && <ActiveQuoteCard message={displayMessage} />}

          <PlaybackControls
            isPlaying={isLive ? live.isPlaying : playback.isPlaying}
            canPrev={isLive ? live.canPrev : playback.canPrev}
            canNext={isLive ? live.canNext : playback.canNext}
            progress={playback.progress}
            turnLabel={liveTurnLabel}
            totalTurns={isLive ? live.total : playback.totalTurns}
            hasSynthesis={debate.hasSynthesis && debate.status === DebateStatus.Completed}
            onPrev={isLive ? live.prev : playback.prev}
            onNext={isLive ? live.next : playback.next}
            onPlayPause={
              isLive
                ? live.isPlaying
                  ? live.pause
                  : live.play
                : playback.isPlaying
                  ? playback.pause
                  : playback.play
            }
            onSeek={playback.seek}
            onSkipToSynthesis={handleSkipToSynthesis}
            isLive={isLive}
            waitingForAdvance={stream.waitingForAdvance}
            onAdvance={handleAdvance}
          />
        </>
      ) : (
        <ChamberView debate={debate} />
      )}
    </div>
  );
}

function ViewToggle({
  active,
  onChange,
}: {
  active: ViewMode;
  onChange: (mode: ViewMode) => void;
}) {
  return (
    <div className="flex overflow-hidden rounded-full border border-hair">
      <button
        type="button"
        onClick={() => onChange("stage")}
        aria-pressed={active === "stage"}
        className={[
          "px-4 py-1.5 text-[13px] font-medium transition-colors",
          active === "stage" ? "bg-ink-button text-cream" : "text-ink-body hover:bg-surface-mut",
        ].join(" ")}
      >
        Stage view
      </button>
      <button
        type="button"
        onClick={() => onChange("chamber")}
        aria-pressed={active === "chamber"}
        className={[
          "px-4 py-1.5 text-[13px] font-medium transition-colors",
          active === "chamber" ? "bg-ink-button text-cream" : "text-ink-body hover:bg-surface-mut",
        ].join(" ")}
      >
        Chamber view
      </button>
    </div>
  );
}

function ChamberView({
  debate,
}: {
  debate: NonNullable<ReturnType<typeof useDebateDetailQuery>["data"]>;
}) {
  return (
    <>
      <section className="flex flex-col gap-4">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-ink-label">
          At the table
        </p>
        <ul className="flex flex-wrap gap-x-8 gap-y-3">
          {debate.personas.map((persona) => (
            <li key={persona.id} className="flex items-center gap-3">
              <PersonaAvatar name={persona.name} color={persona.color} size={40} />
              <div className="flex flex-col">
                <span className="text-[14px] text-ink-primary">{persona.name}</span>
                <span className="text-[12px] text-ink-muted">{persona.demographic}</span>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-6">
        <h2 className="font-serif text-[32px] leading-[1.1] text-ink-primary">
          How the chamber spoke.
        </h2>
        <DebateTranscript messages={debate.messages} />
      </section>
    </>
  );
}

function DebateRoomSkeleton() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3 border-b border-hair pb-8">
        <div className="h-4 w-48 animate-pulse rounded bg-surface-mut" />
        <div className="h-10 w-3/4 animate-pulse rounded bg-surface-mut" />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[220px_1fr_280px]">
        <div className="hidden space-y-4 lg:block">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-surface-mut" />
          ))}
        </div>
        <div className="animate-pulse rounded-2xl bg-surface" style={{ aspectRatio: "4 / 3.2" }} />
        <div className="space-y-4">
          <div className="h-48 animate-pulse rounded-2xl bg-surface" />
          <div className="h-56 animate-pulse rounded-2xl bg-surface" />
        </div>
      </div>
      <div className="h-32 animate-pulse rounded-2xl bg-surface" />
      <div className="h-16 animate-pulse rounded-2xl bg-surface" />
    </div>
  );
}
