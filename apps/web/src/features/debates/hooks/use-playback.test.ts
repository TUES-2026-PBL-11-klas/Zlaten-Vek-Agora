import { describe, it, expect } from "vitest";
import { reducer, type PlaybackState } from "./use-playback";

function state(overrides: Partial<PlaybackState> = {}): PlaybackState {
  return { currentIndex: 0, isPlaying: false, total: 5, ...overrides };
}

describe("reducer", () => {
  describe("NEXT", () => {
    it("advances index", () => {
      const s = reducer(state({ currentIndex: 2 }), { type: "NEXT" });
      expect(s.currentIndex).toBe(3);
    });

    it("clamps at last index", () => {
      const s = reducer(state({ currentIndex: 4 }), { type: "NEXT" });
      expect(s.currentIndex).toBe(4);
    });

    it("stops playback when reaching last message", () => {
      const s = reducer(state({ currentIndex: 3, isPlaying: true }), { type: "NEXT" });
      expect(s.currentIndex).toBe(4);
      expect(s.isPlaying).toBe(false);
    });

    it("keeps isPlaying when not yet at last message", () => {
      const s = reducer(state({ currentIndex: 1, isPlaying: true }), { type: "NEXT" });
      expect(s.isPlaying).toBe(true);
    });
  });

  describe("PREV", () => {
    it("decrements index", () => {
      const s = reducer(state({ currentIndex: 3 }), { type: "PREV" });
      expect(s.currentIndex).toBe(2);
    });

    it("clamps at zero", () => {
      const s = reducer(state({ currentIndex: 0 }), { type: "PREV" });
      expect(s.currentIndex).toBe(0);
    });
  });

  describe("PLAY", () => {
    it("sets isPlaying when total > 0", () => {
      const s = reducer(state({ total: 3 }), { type: "PLAY" });
      expect(s.isPlaying).toBe(true);
    });

    it("does nothing when total is 0", () => {
      const s = reducer(state({ total: 0 }), { type: "PLAY" });
      expect(s.isPlaying).toBe(false);
    });
  });

  describe("PAUSE", () => {
    it("clears isPlaying", () => {
      const s = reducer(state({ isPlaying: true }), { type: "PAUSE" });
      expect(s.isPlaying).toBe(false);
    });
  });

  describe("SEEK", () => {
    it("jumps to index and pauses", () => {
      const s = reducer(state({ currentIndex: 0, isPlaying: true }), {
        type: "SEEK",
        index: 3,
      });
      expect(s.currentIndex).toBe(3);
      expect(s.isPlaying).toBe(false);
    });

    it("clamps negative index to 0", () => {
      const s = reducer(state(), { type: "SEEK", index: -1 });
      expect(s.currentIndex).toBe(0);
    });

    it("clamps over-bound index to last", () => {
      const s = reducer(state({ total: 5 }), { type: "SEEK", index: 99 });
      expect(s.currentIndex).toBe(4);
    });
  });

  describe("SYNC_TOTAL", () => {
    it("updates total", () => {
      const s = reducer(state({ total: 3 }), { type: "SYNC_TOTAL", total: 7 });
      expect(s.total).toBe(7);
    });

    it("clamps currentIndex when new total is smaller", () => {
      const s = reducer(state({ currentIndex: 4, total: 5 }), {
        type: "SYNC_TOTAL",
        total: 3,
      });
      expect(s.currentIndex).toBe(2);
    });

    it("keeps currentIndex at 0 when total becomes 0", () => {
      const s = reducer(state({ currentIndex: 2 }), { type: "SYNC_TOTAL", total: 0 });
      expect(s.currentIndex).toBe(0);
    });
  });
});
