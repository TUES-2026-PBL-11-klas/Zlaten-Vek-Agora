interface AgoraGlyphProps {
  size?: number;
  className?: string;
}

export function AgoraGlyph({ size = 32, className }: AgoraGlyphProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <circle cx="20" cy="20" r="19" stroke="currentColor" strokeWidth="1" opacity="0.35" />
      <circle cx="20" cy="11" r="2.4" fill="currentColor" />
      <circle cx="28" cy="16" r="2.4" fill="currentColor" />
      <circle cx="28" cy="25" r="2.4" fill="currentColor" />
      <circle cx="20" cy="30" r="2.4" fill="currentColor" />
      <circle cx="12" cy="25" r="2.4" fill="currentColor" />
      <circle cx="12" cy="16" r="2.4" fill="currentColor" />
      <circle cx="20" cy="20" r="1.6" fill="currentColor" opacity="0.55" />
    </svg>
  );
}
