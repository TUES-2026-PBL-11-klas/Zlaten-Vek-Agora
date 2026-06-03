import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";
import type { StreamedMessage } from "./use-debate-stream";

export interface LivePlaybackState {
  currentIndex: number;
  isPlaying: boolean;
  total: number;
}

export type LivePlaybackAction =
  | { type: "NEXT" }
  | { type: "PREV" }
  | { type: "PLAY" }
  | { type: "PAUSE" }
  | { type: "SEEK"; index: number }
  | { type: "SYNC_TOTAL"; total: number };

export function reducer(state: LivePlaybackState, action: LivePlaybackAction): LivePlaybackState {
  switch (action.type) {
    case "NEXT":
      return { ...state, currentIndex: Math.min(state.currentIndex + 1, state.total - 1) };
    case "PREV":
      return { ...state, currentIndex: Math.max(state.currentIndex - 1, 0) };
    case "PLAY":
      return state.total > 0 ? { ...state, isPlaying: true } : state;
    case "PAUSE":
      return { ...state, isPlaying: false };
    case "SEEK": {
      const clamped = Math.max(0, Math.min(action.index, state.total - 1));
      return { ...state, currentIndex: clamped, isPlaying: false };
    }
    case "SYNC_TOTAL": {
      const clamped = Math.min(state.currentIndex, action.total - 1);
      return { ...state, total: action.total, currentIndex: Math.max(clamped, 0) };
    }
    default:
      return state;
  }
}

const AUTO_PLAY_INTERVAL = 4000;

/**
 * User-controlled cursor over the live SSE stream. The backend keeps generating
 * personas ahead; the viewer only advances when the user clicks next (or, in
 * auto-play, once the current turn finishes streaming).
 */
export function useLivePlayback(messages: StreamedMessage[]) {
  const total = messages.length;

  const [state, dispatch] = useReducer(reducer, {
    currentIndex: 0,
    isPlaying: false,
    total,
  });

  useEffect(() => {
    if (total !== state.total) dispatch({ type: "SYNC_TOTAL", total });
  }, [total, state.total]);

  const currentMessage = total > 0 ? (messages[state.currentIndex] ?? null) : null;
  const canNext = state.currentIndex < total - 1;
  const canPrev = state.currentIndex > 0;

  // Auto-play advances only once the current turn has fully streamed, so we
  // never skip a persona that is still mid-response.
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (state.isPlaying && currentMessage?.complete && canNext) {
      timeoutRef.current = setTimeout(() => dispatch({ type: "NEXT" }), AUTO_PLAY_INTERVAL);
    }
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [state.isPlaying, state.currentIndex, currentMessage?.complete, canNext]);

  const turnLabel = useMemo(
    () =>
      total > 0
        ? `${String(state.currentIndex + 1).padStart(2, "0")} / ${String(total).padStart(2, "0")}`
        : "00 / 00",
    [state.currentIndex, total],
  );

  const next = useCallback(() => dispatch({ type: "NEXT" }), []);
  const prev = useCallback(() => dispatch({ type: "PREV" }), []);
  const play = useCallback(() => dispatch({ type: "PLAY" }), []);
  const pause = useCallback(() => dispatch({ type: "PAUSE" }), []);
  const seek = useCallback((index: number) => dispatch({ type: "SEEK", index }), []);

  return {
    currentIndex: state.currentIndex,
    currentMessage,
    isPlaying: state.isPlaying,
    total,
    turnLabel,
    canPrev,
    canNext,
    next,
    prev,
    play,
    pause,
    seek,
  };
}
