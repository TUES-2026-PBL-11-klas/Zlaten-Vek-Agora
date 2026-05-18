import { Link } from "react-router-dom";

interface EmailConfirmationCardProps {
  email: string;
  onResend(): Promise<void> | void;
  resending: boolean;
}

export function EmailConfirmationCard({ email, onResend, resending }: EmailConfirmationCardProps) {
  return (
    <article className="mx-auto max-w-md rounded-2xl border border-hair bg-surface px-8 py-10 text-ink-primary">
      <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-ink-label">Inbox</p>
      <h2 className="mt-3 font-serif text-[36px] leading-[42px] text-ink-primary">
        Check your <em className="italic text-accent-rust">inbox.</em>
      </h2>
      <p className="mt-4 font-sans text-[15px] leading-[24px] text-ink-body">
        We sent a confirmation link to <span className="font-medium text-ink-primary">{email}</span>
        . Open it to verify your address, then come back here to sign in.
      </p>

      <p className="mt-6 font-sans text-[13px] leading-[20px] text-ink-muted">
        · The link expires in 24 hours. Check your spam folder if it does not arrive within a
        minute.
      </p>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <Link
          to="/login"
          className="inline-flex h-12 items-center rounded-full bg-ink-button px-6 font-sans text-[14px] font-medium text-cream transition hover:bg-ink-primary"
        >
          Back to sign in
        </Link>
        <button
          type="button"
          onClick={() => onResend()}
          disabled={resending}
          className="inline-flex h-12 items-center rounded-full bg-surface-mut px-6 font-sans text-[14px] font-medium text-ink-primary transition hover:bg-surface-2 disabled:opacity-60"
        >
          {resending ? "Resending..." : "Resend confirmation"}
        </button>
      </div>
    </article>
  );
}
