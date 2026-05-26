import { ChevronLeft, ChevronRight, Play, Pause } from "lucide-react";

interface PlaybackControlsProps {
  isPlaying: boolean;
  canPrev: boolean;
  canNext: boolean;
  progress: number;
  turnLabel: string;
  totalTurns: number;
  hasSynthesis: boolean;
  onPrev: () => void;
  onNext: () => void;
  onPlayPause: () => void;
  onSeek: (index: number) => void;
  onSkipToSynthesis: () => void;
}

export function PlaybackControls({
  isPlaying,
  canPrev,
  canNext,
  progress,
  turnLabel,
  totalTurns,
  hasSynthesis,
  onPrev,
  onNext,
  onPlayPause,
  onSeek,
  onSkipToSynthesis,
}: PlaybackControlsProps) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-hair bg-surface px-6 py-4">
      <div className="flex items-center gap-1.5">
        <button
          onClick={onPrev}
          disabled={!canPrev}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-mut text-ink-primary transition-colors hover:bg-surface-2 disabled:opacity-30"
          aria-label="Previous turn"
        >
          <ChevronLeft size={18} />
        </button>
        <button
          onClick={onPlayPause}
          disabled={totalTurns === 0}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-ink-button text-cream transition-colors hover:opacity-90 disabled:opacity-30"
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
        </button>
        <button
          onClick={onNext}
          disabled={!canNext}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-mut text-ink-primary transition-colors hover:bg-surface-2 disabled:opacity-30"
          aria-label="Next turn"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <div
        className="relative flex-1 cursor-pointer py-2"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
          onSeek(Math.round(ratio * (totalTurns - 1)));
        }}
      >
        <div className="h-1.5 rounded-full bg-surface-2">
          <div
            className="h-full rounded-full bg-accent-rust transition-[width] duration-200"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </div>

      <span className="shrink-0 font-mono text-[13px] tracking-wide text-ink-muted">
        {turnLabel}
      </span>

      {hasSynthesis && (
        <button
          onClick={onSkipToSynthesis}
          className="shrink-0 rounded-full border border-hair px-4 py-2 text-[13px] text-ink-primary transition-colors hover:bg-surface-mut"
        >
          Skip to synthesis &rarr;
        </button>
      )}
    </div>
  );
}
