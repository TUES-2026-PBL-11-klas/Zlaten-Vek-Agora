import { useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import type { CreateDebateResponseDto, PersonaDraftDto } from "@agora/shared";
import { DebateStatus } from "@agora/shared";
import { PersonaAvatar } from "@/features/debates/components/PersonaAvatar";
import { personaColor } from "@/features/debates/lib/persona-avatar";
import { useCreateDebateMutation } from "@/features/debates/api/use-create-debate-mutation";
import { useUpdatePersonasMutation } from "@/features/debates/api/use-update-personas-mutation";
import { useStartDebateMutation } from "@/features/debates/api/use-start-debate-mutation";
import { useDebateStatusQuery } from "@/features/debates/api/use-debate-status-query";
import { usePersonasQuery } from "@/features/debates/api/use-personas-query";

// ─── Step 1: Upload form ─────────────────────────────────────────────────────

type InputMode = "pdf" | "text";

interface UploadFormProps {
  onCreated: (dto: CreateDebateResponseDto) => void;
}

function UploadForm({ onCreated }: UploadFormProps) {
  const [mode, setMode] = useState<InputMode>("pdf");
  const [title, setTitle] = useState("");
  const [billText, setBillText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const create = useCreateDebateMutation();

  const MAX_FILE_BYTES = 20 * 1024 * 1024;

  function pickFile(f: File) {
    if (f.type !== "application/pdf") {
      setFileError("Only PDF files are accepted.");
      return;
    }
    if (f.size > MAX_FILE_BYTES) {
      setFileError(`File is ${(f.size / 1024 / 1024).toFixed(1)} MB - maximum is 20 MB.`);
      return;
    }
    setFileError(null);
    setFile(f);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) pickFile(dropped);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    if (mode === "pdf" && !file) return;
    if (mode === "text" && billText.trim().length < 200) return;

    const dto = await create.mutateAsync({
      billTitle: title.trim(),
      file: mode === "pdf" && file ? file : undefined,
      billText: mode === "text" ? billText.trim() : undefined,
    });
    onCreated(dto);
  }

  return (
    <section className="mx-auto max-w-[640px] space-y-10">
      <Link
        to="/"
        className="inline-flex items-center gap-1 text-[13px] text-accent-rust hover:underline"
      >
        ← Dashboard
      </Link>
      <div className="space-y-3">
        <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-ink-label">
          New session
        </p>
        <h1 className="font-serif text-[56px] leading-[62px] text-ink-primary">
          Begin a <em className="italic text-accent-rust">debate.</em>
        </h1>
        <p className="text-[16px] leading-[24px] text-ink-body">
          Upload a PDF or paste a bill. The chamber will read it, name the affected groups, and seat
          them around the table.
        </p>
      </div>

      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-8">
        {/* Bill title */}
        <div className="space-y-2">
          <label
            htmlFor="bill-title"
            className="block text-[12px] font-medium uppercase tracking-[0.14em] text-ink-label"
          >
            Bill title
          </label>
          <input
            id="bill-title"
            type="text"
            required
            maxLength={200}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Закон за изменение на Закона за наемните отношения"
            className="w-full rounded-2xl border border-hair bg-surface px-5 py-4 text-[16px] leading-6 text-ink-primary placeholder:text-ink-label focus:outline-none focus:ring-2 focus:ring-accent-rust/30"
          />
        </div>

        {/* Mode toggle */}
        <div className="space-y-4">
          <div className="flex overflow-hidden rounded-full border border-hair">
            {(["pdf", "text"] as InputMode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={[
                  "flex-1 px-5 py-2 text-[13px] font-medium transition-colors",
                  mode === m ? "bg-ink-button text-cream" : "text-ink-body hover:bg-surface-mut",
                ].join(" ")}
              >
                {m === "pdf" ? "Upload PDF" : "Paste text"}
              </button>
            ))}
          </div>

          {mode === "pdf" ? (
            <div
              role="button"
              tabIndex={0}
              onDrop={handleDrop}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onClick={() => fileRef.current?.click()}
              onKeyDown={(e) => e.key === "Enter" && fileRef.current?.click()}
              className={[
                "flex min-h-[160px] cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-8 transition-colors",
                dragOver
                  ? "border-accent-rust bg-surface-2"
                  : "border-hair bg-surface hover:border-accent-rust/40",
              ].join(" ")}
            >
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,application/pdf"
                className="sr-only"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) pickFile(f);
                }}
              />
              {file ? (
                <p className="text-[14px] text-ink-primary">
                  <span className="font-medium">{file.name}</span>
                  <span className="ml-2 text-ink-muted">
                    ({(file.size / 1024 / 1024).toFixed(1)} MB)
                  </span>
                </p>
              ) : (
                <>
                  <svg
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    className="text-ink-muted"
                    aria-hidden="true"
                  >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="12" y1="18" x2="12" y2="12" />
                    <line x1="9" y1="15" x2="15" y2="15" />
                  </svg>
                  <p className="text-[14px] text-ink-muted">Drop a PDF here, or click to browse</p>
                  <p className="text-[12px] text-ink-label">Max 20 MB</p>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-1">
              <textarea
                value={billText}
                onChange={(e) => setBillText(e.target.value)}
                placeholder="Paste the full bill text here (minimum 200 characters)..."
                rows={12}
                className="w-full resize-y rounded-2xl border border-hair bg-surface px-5 py-4 text-[14px] leading-6 text-ink-primary placeholder:text-ink-label focus:outline-none focus:ring-2 focus:ring-accent-rust/30"
              />
              <p
                className={[
                  "text-right text-[12px]",
                  billText.length < 200 ? "text-ink-label" : "text-ink-muted",
                ].join(" ")}
              >
                {billText.length.toLocaleString()} / 200 min
              </p>
            </div>
          )}

          {mode === "pdf" && fileError && <p className="text-[13px] text-[#B85A1E]">{fileError}</p>}
        </div>

        {create.error && (
          <p className="rounded-xl bg-[#FFF0EB] px-4 py-3 text-[14px] text-[#B85A1E]">
            {create.error instanceof Error
              ? create.error.message
              : "Something went wrong. Please try again."}
          </p>
        )}

        <button
          type="submit"
          disabled={
            create.isPending ||
            !title.trim() ||
            (mode === "pdf" && (!file || !!fileError)) ||
            (mode === "text" && billText.trim().length < 200)
          }
          className="inline-flex h-12 items-center justify-center rounded-full bg-ink-button px-8 text-[14px] font-medium text-cream transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {create.isPending ? "Reading..." : "Seat the chamber →"}
        </button>
      </form>
    </section>
  );
}

// ─── Step 2: Persona review ───────────────────────────────────────────────────

interface PersonaReviewProps {
  debateId: string;
  initialPersonas: PersonaDraftDto[];
  initialStatus: DebateStatus;
}

export function PersonaReview({ debateId, initialPersonas, initialStatus }: PersonaReviewProps) {
  const navigate = useNavigate();
  const [personas, setPersonas] = useState<PersonaDraftDto[]>(initialPersonas);

  // Poll overview while analysis is still running
  const needsPolling =
    initialStatus === DebateStatus.Analyzing || initialStatus === DebateStatus.Draft;
  const statusQuery = useDebateStatusQuery(needsPolling ? debateId : null);
  const polledStatus = statusQuery.data?.status ?? initialStatus;

  // Once status flips to personas_pending, fetch full persona data (with interests/fears)
  const personasQuery = usePersonasQuery(
    polledStatus === DebateStatus.PersonasPending && initialPersonas.length === 0 ? debateId : null,
  );

  const displayPersonas = personasQuery.data?.length ? personasQuery.data : personas;

  const updatePersonas = useUpdatePersonasMutation(debateId);
  const startDebate = useStartDebateMutation();

  async function handleRemove(id: string) {
    const next = displayPersonas.filter((p) => p.id !== id);
    setPersonas(next);
    await updatePersonas.mutateAsync({ remove: [id] });
  }

  async function handleStart() {
    await startDebate.mutateAsync({ debateId });
    navigate(`/debates/${debateId}`);
  }

  const isAnalyzing =
    polledStatus === DebateStatus.Analyzing || polledStatus === DebateStatus.Draft;
  const hasFailed = polledStatus === DebateStatus.AnalysisFailed;
  const canStart = polledStatus === DebateStatus.PersonasPending && displayPersonas.length >= 2;

  return (
    <section className="mx-auto max-w-[900px] space-y-10">
      <Link
        to="/"
        className="inline-flex items-center gap-1 text-[13px] text-accent-rust hover:underline"
      >
        ← Dashboard
      </Link>
      <div className="space-y-3">
        <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-ink-label">
          New session
        </p>
        <h1 className="font-serif text-[36px] leading-[42px] text-ink-primary">
          {isAnalyzing ? (
            <>
              Reading the bill
              <em className="italic text-accent-rust">...</em>
            </>
          ) : hasFailed ? (
            <>
              Analysis <em className="italic text-accent-rust">failed.</em>
            </>
          ) : (
            <>
              Review the <em className="italic text-accent-rust">chamber.</em>
            </>
          )}
        </h1>
      </div>

      {isAnalyzing && (
        <>
          <div className="flex items-center gap-4 rounded-2xl border border-hair bg-surface px-6 py-5">
            <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-ink-muted border-t-transparent" />
            <p className="text-[14px] text-ink-body">
              The chamber is reading the bill and identifying affected groups. This takes 10-30
              seconds.
            </p>
          </div>

          <ul aria-hidden="true" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <PersonaCardSkeleton key={i} />
            ))}
          </ul>
        </>
      )}

      {hasFailed && (
        <div className="space-y-4 rounded-2xl border border-hair bg-surface px-6 py-5">
          <p className="text-[14px] text-ink-body">
            Analysis failed. The bill text may be too short, scanned, or unreadable. Try again or
            upload a different file.
          </p>
          <a
            href="/new-debate"
            className="inline-flex h-10 items-center justify-center rounded-full bg-ink-button px-6 text-[13px] font-medium text-cream hover:opacity-90"
          >
            Start over
          </a>
        </div>
      )}

      {!isAnalyzing && !hasFailed && displayPersonas.length > 0 && (
        <>
          <p className="text-[14px] leading-6 text-ink-body">
            These are the groups the chamber identified as affected by this bill. Remove any that
            don&apos;t fit, then start the debate.
          </p>

          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {displayPersonas.map((persona) => (
              <li
                key={persona.id}
                className="relative flex flex-col overflow-hidden rounded-2xl border border-hair bg-surface transition-colors hover:border-ink-label/40"
              >
                <button
                  type="button"
                  onClick={() => void handleRemove(persona.id)}
                  disabled={displayPersonas.length <= 2}
                  aria-label={`Remove ${persona.name}`}
                  className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-surface-mut hover:text-ink-primary disabled:opacity-30"
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    aria-hidden="true"
                  >
                    <line x1="1" y1="1" x2="11" y2="11" />
                    <line x1="11" y1="1" x2="1" y2="11" />
                  </svg>
                </button>

                <div className="flex min-h-[136px] items-start gap-3.5 p-5 pb-4">
                  <PersonaAvatar name={persona.name} color={persona.color} size={44} />
                  <div className="min-w-0 flex-1 pr-6">
                    <p className="truncate text-[15px] font-medium leading-5 text-ink-primary">
                      {persona.name}
                    </p>
                    {persona.role && (
                      <p className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.12em] text-accent-rust">
                        {persona.role}
                      </p>
                    )}
                    <p className="mt-1 line-clamp-3 text-[12px] leading-4 text-ink-muted">
                      {persona.demographic}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 border-t border-hair/70 px-5 py-4">
                  {persona.interests.slice(0, 4).length > 0 && (
                    <TagGroup
                      label="Interests"
                      tags={persona.interests.slice(0, 4)}
                      dotColor={personaColor(persona.color)}
                    />
                  )}
                  {persona.fears.slice(0, 3).length > 0 && (
                    <TagGroup
                      label="Fears"
                      tags={persona.fears.slice(0, 3)}
                      dotColor="var(--color-persona-terracotta)"
                    />
                  )}
                </div>
              </li>
            ))}
          </ul>

          <div className="flex items-center justify-between border-t border-hair pt-6">
            <p className="text-[13px] text-ink-muted">
              {displayPersonas.length} participant{displayPersonas.length !== 1 ? "s" : ""} at the
              table
            </p>
            <button
              type="button"
              disabled={!canStart || startDebate.isPending}
              onClick={() => void handleStart()}
              className="inline-flex h-12 items-center justify-center rounded-full bg-ink-button px-8 text-[14px] font-medium text-cream transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {startDebate.isPending ? "Starting..." : "Start debate →"}
            </button>
          </div>
        </>
      )}
    </section>
  );
}

function PersonaCardSkeleton() {
  return (
    <li className="animate-pulse rounded-2xl border border-hair bg-surface p-6">
      <div className="flex items-start gap-4">
        <div className="h-12 w-12 shrink-0 rounded-full bg-surface-mut" />
        <div className="min-w-0 flex-1 space-y-2 pt-1">
          <div className="h-3.5 w-3/4 rounded bg-surface-mut" />
          <div className="h-3 w-1/2 rounded bg-surface-mut" />
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <div className="space-y-1.5">
          <div className="h-2.5 w-16 rounded bg-surface-mut" />
          <div className="flex flex-wrap gap-1">
            <div className="h-5 w-16 rounded-full bg-surface-mut" />
            <div className="h-5 w-12 rounded-full bg-surface-mut" />
            <div className="h-5 w-14 rounded-full bg-surface-mut" />
          </div>
        </div>
        <div className="space-y-1.5">
          <div className="h-2.5 w-12 rounded bg-surface-mut" />
          <div className="flex flex-wrap gap-1">
            <div className="h-5 w-14 rounded-full bg-surface-mut" />
            <div className="h-5 w-16 rounded-full bg-surface-mut" />
          </div>
        </div>
      </div>
    </li>
  );
}

function TagGroup({ label, tags, dotColor }: { label: string; tags: string[]; dotColor: string }) {
  return (
    <div>
      <p className="mb-1.5 text-[10px] font-medium uppercase tracking-[0.12em] text-ink-label">
        {label}
      </p>
      <ul className="flex flex-wrap gap-1.5">
        {tags.map((tag) => (
          <li
            key={tag}
            className="inline-flex items-center gap-1.5 rounded-full border border-hair bg-surface-mut px-2.5 py-1 text-[11px] leading-none text-ink-body"
          >
            <span
              aria-hidden="true"
              className="h-1.5 w-1.5 shrink-0 rounded-full"
              style={{ backgroundColor: dotColor }}
            />
            {tag}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── Page root ────────────────────────────────────────────────────────────────

export function CreateDebatePage() {
  const [created, setCreated] = useState<CreateDebateResponseDto | null>(null);

  if (created) {
    return (
      <PersonaReview
        debateId={created.debateId}
        initialPersonas={created.personas ?? []}
        initialStatus={created.status}
      />
    );
  }

  return <UploadForm onCreated={setCreated} />;
}
