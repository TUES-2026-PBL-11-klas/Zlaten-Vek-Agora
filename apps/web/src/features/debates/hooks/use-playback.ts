import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";
import type { DebateDetailMessageDto } from "@agora/shared";

interface PlaybackState {
  currentIndex: number;
  isPlaying: boolean;
  total: number;
}

type PlaybackAction =
  | { type: "NEXT" }
  | { type: "PREV" }
  | { type: "PLAY" }
  | { type: "PAUSE" }
  | { type: "SEEK"; index: number }
  | { type: "SYNC_TOTAL"; total: number };

function reducer(state: PlaybackState, action: PlaybackAction): PlaybackState {
  switch (action.type) {
    case "NEXT": {
      const next = Math.min(state.currentIndex + 1, state.total - 1);
      const done = next >= state.total - 1;
      return { ...state, currentIndex: next, isPlaying: done ? false : state.isPlaying };
    }
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

export function usePlayback(rawMessages: DebateDetailMessageDto[]) {
  const messages = useMemo(
    () =>
      [...rawMessages].sort((a, b) => a.roundNumber - b.roundNumber || a.turnIndex - b.turnIndex),
    [rawMessages],
  );

  const total = messages.length;

  const [state, dispatch] = useReducer(reducer, {
    currentIndex: total > 0 ? total - 1 : 0,
    isPlaying: false,
    total,
  });

  useEffect(() => {
    if (total !== state.total) dispatch({ type: "SYNC_TOTAL", total });
  }, [total, state.total]);

  const currentMessage = total > 0 ? (messages[state.currentIndex] ?? null) : null;
  const progress = total > 1 ? state.currentIndex / (total - 1) : 0;
  const turnLabel =
    total > 0
      ? `${String(state.currentIndex + 1).padStart(2, "0")} / ${String(total).padStart(2, "0")}`
      : "00 / 00";

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (state.isPlaying) {
      intervalRef.current = setInterval(() => dispatch({ type: "NEXT" }), AUTO_PLAY_INTERVAL);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [state.isPlaying]);

  const next = useCallback(() => dispatch({ type: "NEXT" }), []);
  const prev = useCallback(() => dispatch({ type: "PREV" }), []);
  const play = useCallback(() => dispatch({ type: "PLAY" }), []);
  const pause = useCallback(() => dispatch({ type: "PAUSE" }), []);
  const seek = useCallback((index: number) => dispatch({ type: "SEEK", index }), []);

  const skipToSynthesis = useCallback(() => {
    const lastRound = Math.max(...messages.map((m) => m.roundNumber), 0);
    const synthIdx = messages.findIndex((m) => m.roundNumber === lastRound);
    if (synthIdx >= 0) dispatch({ type: "SEEK", index: synthIdx });
  }, [messages]);

  return {
    messages,
    currentIndex: state.currentIndex,
    currentMessage,
    isPlaying: state.isPlaying,
    progress,
    turnLabel,
    totalTurns: total,
    canPrev: state.currentIndex > 0,
    canNext: state.currentIndex < total - 1,
    next,
    prev,
    play,
    pause,
    seek,
    skipToSynthesis,
  };
}
