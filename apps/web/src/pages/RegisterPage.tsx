import { useEffect, useState, type FormEvent } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { EmailConfirmationCard } from "@/features/auth/components/EmailConfirmationCard";
import { notify } from "@/shared/lib/notify";

const fieldClass =
  "h-11 rounded-lg border border-hair bg-surface-mut px-3 font-sans text-[15px] text-ink-primary placeholder:text-ink-label focus:border-accent-rust focus:outline-none focus:ring-2 focus:ring-accent-rust/15";

const labelClass = "text-[12px] font-medium uppercase tracking-[0.14em] text-ink-label";

export function RegisterPage() {
  const { session, loading, signUp } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmationEmail, setConfirmationEmail] = useState<string | null>(null);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    setError(null);
  }, [email, password]);

  if (loading) {
    return <p className="text-ink-muted">Loading session...</p>;
  }

  if (session) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    const result = await signUp(email, password);
    setSubmitting(false);

    if (result.error) {
      setError(result.error.message);
      notify.error("Sign-up failed.", { description: result.error.message });
      return;
    }

    setConfirmationEmail(email);
    notify.success("Account created.", {
      description: `We sent a confirmation link to ${email}.`,
      duration: 7000,
    });
  };

  const handleResend = async () => {
    if (!confirmationEmail) return;
    setResending(true);
    const result = await signUp(confirmationEmail, password);
    setResending(false);

    if (result.error) {
      notify.error("Could not resend.", { description: result.error.message });
      return;
    }

    notify.success("Confirmation resent.", {
      description: `Another link is on its way to ${confirmationEmail}.`,
    });
  };

  if (confirmationEmail) {
    return (
      <EmailConfirmationCard
        email={confirmationEmail}
        onResend={handleResend}
        resending={resending}
      />
    );
  }

  return (
    <article className="mx-auto max-w-md rounded-2xl border border-hair bg-surface px-8 py-10">
      <p className={labelClass}>Register</p>
      <h1 className="mt-3 font-serif text-[36px] leading-[42px] text-ink-primary">
        Join the <em className="italic text-accent-rust">chamber.</em>
      </h1>
      <p className="mt-3 font-sans text-[14px] leading-[20px] text-ink-muted">
        Email and a password is all you need to start a debate.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
        <label className="flex flex-col gap-2">
          <span className={labelClass}>Email</span>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={fieldClass}
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className={labelClass}>Password</span>
          <input
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className={fieldClass}
          />
        </label>

        {error ? (
          <p role="alert" className="font-sans text-[13px] leading-[20px] text-persona-terracotta">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 inline-flex h-12 items-center justify-center rounded-full bg-ink-button px-6 font-sans text-[14px] font-medium text-cream transition hover:bg-ink-primary disabled:opacity-60"
        >
          {submitting ? "Creating account..." : "Create account"}
        </button>
      </form>

      <p className="mt-6 font-sans text-[13px] leading-[20px] text-ink-muted">
        Already registered?{" "}
        <Link to="/login" className="text-accent-rust hover:text-accent-rust-hi">
          Sign in &rarr;
        </Link>
      </p>
    </article>
  );
}
