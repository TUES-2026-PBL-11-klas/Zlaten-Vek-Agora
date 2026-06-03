import { describe, it, expect } from "vitest";
import { reducer, type LivePlaybackState } from "./use-live-playback";

function state(overrides: Partial<LivePlaybackState> = {}): LivePlaybackState {
  return { currentIndex: 0, isPlaying: false, total: 5, ...overrides };
}

describe("live reducer", () => {
  describe("NEXT", () => {
    it("advances index", () => {
      const s = reducer(state({ currentIndex: 2 }), { type: "NEXT" });
      expect(s.currentIndex).toBe(3);
    });

    it("clamps at last available turn", () => {
      const s = reducer(state({ currentIndex: 4 }), { type: "NEXT" });
      expect(s.currentIndex).toBe(4);
    });

    it("keeps isPlaying at the head so auto-play resumes as more turns arrive", () => {
      const s = reducer(state({ currentIndex: 4, isPlaying: true }), { type: "NEXT" });
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
    it("sets isPlaying when turns exist", () => {
      const s = reducer(state({ total: 3 }), { type: "PLAY" });
      expect(s.isPlaying).toBe(true);
    });

    it("does nothing when no turns have arrived", () => {
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
      const s = reducer(state({ currentIndex: 0, isPlaying: true }), { type: "SEEK", index: 3 });
      expect(s.currentIndex).toBe(3);
      expect(s.isPlaying).toBe(false);
    });

    it("clamps negative index to 0", () => {
      const s = reducer(state(), { type: "SEEK", index: -1 });
      expect(s.currentIndex).toBe(0);
    });

    it("clamps over-bound index to last available", () => {
      const s = reducer(state({ total: 5 }), { type: "SEEK", index: 99 });
      expect(s.currentIndex).toBe(4);
    });
  });

  describe("SYNC_TOTAL", () => {
    it("grows total as new streamed turns arrive without moving the cursor", () => {
      const s = reducer(state({ currentIndex: 1, total: 3 }), { type: "SYNC_TOTAL", total: 5 });
      expect(s.total).toBe(5);
      expect(s.currentIndex).toBe(1);
    });

    it("keeps currentIndex at 0 when no turns have arrived", () => {
      const s = reducer(state({ currentIndex: 2 }), { type: "SYNC_TOTAL", total: 0 });
      expect(s.currentIndex).toBe(0);
    });
  });
});
