import { Link, useParams } from "react-router-dom";
import { AxiosError } from "axios";
import { toast } from "sonner";
import {
  useSynthesisQuery,
  useRegenerateSynthesisMutation,
} from "@/features/synthesis/api/use-synthesis-query";
import { SynthesisContent } from "@/features/synthesis/components/SynthesisContent";

export function SynthesisPage() {
  const { id } = useParams<{ id: string }>();
  const query = useSynthesisQuery(id);
  const regenerate = useRegenerateSynthesisMutation(id);

  if (query.isLoading) return <SynthesisSkeleton />;

  if (query.isError) {
    const status = query.error instanceof AxiosError ? query.error.response?.status : undefined;
    if (status === 409) return <NotReadyState debateId={id ?? null} />;
    return <NotFoundState />;
  }

  if (!query.data) return <NotFoundState />;

  if (query.data.failed) {
    return (
      <FailedSynthesisState
        debateId={id ?? null}
        onRegenerate={() => regenerate.mutate()}
        isRegenerating={regenerate.isPending}
        error={regenerate.isError ? "Synthesis failed again. Try once more." : null}
      />
    );
  }

  const synthesis = query.data;
  const handleExport = () => {
    // Lazy-load the PDF renderer so @react-pdf only ships when a user exports.
    import("@/features/synthesis/pdf/export-synthesis-pdf")
      .then(({ exportSynthesisPdf }) => exportSynthesisPdf(synthesis))
      .catch(() => {
        toast.error("Could not export the synthesis PDF. Please try again.");
      });
  };

  return <SynthesisContent synthesis={synthesis} onExport={handleExport} />;
}

function SynthesisSkeleton() {
  return (
    <div className="flex flex-col gap-16">
      <div className="flex flex-col gap-4 border-b border-hair pb-12">
        <div className="h-3 w-32 animate-pulse rounded bg-surface-mut" />
        <div className="h-16 w-2/3 animate-pulse rounded bg-surface-mut" />
        <div className="h-4 w-3/4 animate-pulse rounded bg-surface-mut" />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-72 animate-pulse rounded-2xl bg-surface" />
        ))}
      </div>
      <div className="h-48 animate-pulse rounded-2xl bg-surface" />
    </div>
  );
}

function NotReadyState({ debateId }: { debateId: string | null }) {
  return (
    <section className="flex max-w-[640px] flex-col gap-5">
      <p className="text-[11px] uppercase tracking-[0.14em] text-ink-label">Synthesis pending</p>
      <h1 className="font-serif text-[40px] leading-[1.1] text-ink-primary">
        The chamber has not finished its third round.
      </h1>
      <p className="text-[16px] leading-7 text-ink-body">
        The neutral judge writes a synthesis once positions, counter-arguments, and common ground
        have all been heard. Return to the debate to keep advancing.
      </p>
      <div className="flex gap-3">
        {debateId ? (
          <Link
            to={`/debates/${debateId}`}
            className="inline-flex h-12 items-center justify-center rounded-full bg-ink-button px-6 text-[14px] font-medium text-cream transition-colors hover:opacity-90"
          >
            &larr; Back to debate
          </Link>
        ) : null}
        <Link
          to="/"
          className="inline-flex h-12 items-center justify-center rounded-full bg-surface px-6 text-[14px] font-medium text-ink-primary transition-colors hover:bg-surface-mut"
        >
          Back to dashboard
        </Link>
      </div>
    </section>
  );
}

function FailedSynthesisState({
  debateId,
  onRegenerate,
  isRegenerating,
  error,
}: {
  debateId: string | null;
  onRegenerate: () => void;
  isRegenerating: boolean;
  error: string | null;
}) {
  return (
    <section className="flex max-w-[640px] flex-col gap-5">
      <p className="text-[11px] uppercase tracking-[0.14em] text-ink-label">Synthesis failed</p>
      <h1 className="font-serif text-[40px] leading-[1.1] text-ink-primary">
        The judge could not produce a structured verdict.
      </h1>
      <p className="text-[16px] leading-7 text-ink-body">
        The mediator returned an incomplete result - the transcript is intact and the synthesis can
        be run again without losing any debate content.
      </p>
      {error ? <p className="text-[14px] leading-6 text-accent-rust">{error}</p> : null}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onRegenerate}
          disabled={isRegenerating}
          className="inline-flex h-12 items-center justify-center rounded-full bg-ink-button px-6 text-[14px] font-medium text-cream transition-colors hover:opacity-90 disabled:opacity-50"
        >
          {isRegenerating ? "Regenerating..." : "Regenerate synthesis"}
        </button>
        {debateId ? (
          <Link
            to={`/debates/${debateId}`}
            className="inline-flex h-12 items-center justify-center rounded-full bg-surface px-6 text-[14px] font-medium text-ink-primary transition-colors hover:bg-surface-mut"
          >
            &larr; Back to debate
          </Link>
        ) : null}
      </div>
    </section>
  );
}

function NotFoundState() {
  return (
    <section className="flex max-w-[640px] flex-col gap-5">
      <h1 className="font-serif text-[40px] leading-[1.1] text-ink-primary">
        This synthesis could not be found.
      </h1>
      <p className="text-[16px] leading-7 text-ink-body">
        The debate may have been removed, or it belongs to another chamber.
      </p>
      <Link
        to="/"
        className="inline-flex h-12 items-center justify-center self-start rounded-full bg-ink-button px-6 text-[14px] font-medium text-cream transition-colors hover:opacity-90"
      >
        &larr; Back to dashboard
      </Link>
    </section>
  );
}
