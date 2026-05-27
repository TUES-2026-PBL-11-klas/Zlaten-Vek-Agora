const PALETTE = ["sage", "rust", "cobalt", "amber", "plum", "teal", "coral", "slate"] as const;

export function assignColor(index: number): string {
  return PALETTE[index % PALETTE.length];
}
