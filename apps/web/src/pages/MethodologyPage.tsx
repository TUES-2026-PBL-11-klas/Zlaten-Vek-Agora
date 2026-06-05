import { Link } from "react-router-dom";
import { AgoraGlyph } from "@/features/debates/lib/agora-glyph";

interface Stage {
  eyebrow: string;
  title: string;
  agent: string;
  hue: string;
  body: string;
  points: string[];
}

const STAGES: Stage[] = [
  {
    eyebrow: "Stage one",
    title: "The bill is read for who it touches.",
    agent: "AnalysisAgent",
    hue: "#3F5942",
    body: "A single analyst agent reads the bill text and asks one question: who lives with the consequences of this. It returns four to six distinct affected groups, the headline changes the bill introduces, and the fault lines most likely to divide the room.",
    points: [
      "Each group arrives with demographics, interests, fears, and priorities - not a label, a life.",
      "Every group is assigned a stance (supportive, opposed, or mixed) and a one-line reason it holds that stance.",
      "The contentious points become shared ground: every later speaker is forced to argue them, so the debate cannot drift into pleasantries.",
    ],
  },
  {
    eyebrow: "Stage two",
    title: "Each group is given a seat and a voice.",
    agent: "PersonaAgentFactory",
    hue: "#C9742F",
    body: "A factory builds one persona agent per affected group. Each carries a named representative who will speak in the first person throughout - a landlord, a first-time buyer, a council officer - addressing the others by surname across the table.",
    points: [
      "One persona, one agent, one fixed colour carried everywhere that voice appears.",
      "The representative speaks only from their own livelihood and values, never as a narrator and never as an AI.",
      "You can review and edit the roster before the debate opens - the seats are yours to confirm.",
    ],
  },
  {
    eyebrow: "Stage three",
    title: "The chamber debates in three rounds.",
    agent: "AgentOrchestrator",
    hue: "#C7A03A",
    body: "An orchestrator walks every persona through three rounds in order, streaming each reply token by token. After each statement the speaker's emotional tone is classified and recorded, so the room's mood is part of the record.",
    points: [
      "Round one - Opening Statements: each seat states what it supports, what it opposes, and why.",
      "Round two - Rebuttal: each seat must challenge a specific argument another speaker made, quoting their words.",
      "Round three - Common Ground: each seat names a genuine point of agreement and proposes a concrete compromise.",
    ],
  },
  {
    eyebrow: "Stage four",
    title: "A mediator weighs the whole table.",
    agent: "JudgeAgent",
    hue: "#6B3F5E",
    body: "An impartial mediator reads the full transcript and synthesises it - not to crown a winner, but to map where the room landed. It runs at low temperature so the verdict stays steady rather than inventive.",
    points: [
      "Three contradictions, three points of common ground, three workable compromises - the shape of a settlement.",
      "A shift reading per seat: how far each representative moved from their opening position, measured against the transcript.",
      "A closing verdict that commits to a position on the bill and justifies it from the strongest arguments raised.",
    ],
  },
];

function StageNumber({ index }: { index: number }) {
  return (
    <span className="font-serif text-[40px] italic leading-none text-accent-rust">{index + 1}</span>
  );
}

export function MethodologyPage() {
  return (
    <div className="flex flex-col">
      <Link
        to="/"
        className="mb-8 flex items-center gap-1.5 self-start text-[13px] text-ink-muted transition-colors hover:text-ink-body hover:underline"
      >
        ← Back to dashboard
      </Link>

      <section className="max-w-[720px]">
        <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-ink-label">
          Methodology
        </p>
        <h1 className="mt-4 font-serif text-[56px] leading-[1.08] text-ink-primary">
          How a bill becomes a <span className="italic text-accent-rust">debate</span>.
        </h1>
        <p className="mt-6 text-[16px] leading-[24px] text-ink-body">
          Agora does not summarise a policy. It stages an argument over it. A document enters as
          text and leaves as a chamber of voices, each speaking for the people the bill would touch,
          weighed at the end by a mediator who commits to a verdict. Four agents, in sequence, carry
          it there.
        </p>
      </section>

      <section className="mt-20 flex flex-col gap-16">
        {STAGES.map((stage, index) => (
          <article
            key={stage.agent}
            className="grid grid-cols-1 gap-6 border-t border-hair pt-10 md:grid-cols-[64px_1fr]"
          >
            <div className="flex md:justify-center">
              <StageNumber index={index} />
            </div>
            <div className="max-w-[720px]">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-[12px] font-medium uppercase tracking-[0.14em] text-ink-label">
                  {stage.eyebrow}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-hair bg-surface px-3 py-1 text-[12px] font-medium tracking-[0.04em] text-ink-body">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: stage.hue }}
                    aria-hidden
                  />
                  {stage.agent}
                </span>
              </div>
              <h2 className="mt-3 font-serif text-[32px] leading-[1.12] text-ink-primary">
                {stage.title}
              </h2>
              <p className="mt-4 text-[16px] leading-[24px] text-ink-body">{stage.body}</p>
              <ul className="mt-6 flex flex-col gap-3">
                {stage.points.map((point) => (
                  <li key={point} className="flex gap-3 text-[14px] leading-[20px] text-ink-muted">
                    <span
                      className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ backgroundColor: stage.hue }}
                      aria-hidden
                    />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          </article>
        ))}
      </section>

      <section className="mt-20 border-t border-hair pt-10">
        <div className="max-w-[720px]">
          <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-ink-label">
            On neutrality
          </p>
          <h2 className="mt-3 font-serif text-[32px] leading-[1.12] text-ink-primary">
            Why the room is allowed to disagree.
          </h2>
          <p className="mt-4 text-[16px] leading-[24px] text-ink-body">
            Every persona argues from a fixed stance and its own interests, so no single voice can
            quietly speak for the whole. The mediator never joins the debate - it reads it only once
            it is closed, and it is asked to weigh the strongest arguments rather than count heads.
            The result is a verdict you can trace back to who said what, in which round, and how far
            they moved.
          </p>
        </div>
      </section>

      <aside className="mt-16 flex flex-col items-start justify-between gap-6 rounded-2xl bg-surface-mut px-8 py-7 sm:flex-row sm:items-center">
        <div className="flex items-start gap-5 sm:items-center">
          <span className="text-ink-primary">
            <AgoraGlyph size={40} />
          </span>
          <div>
            <p className="font-serif text-[20px] leading-[1.25] text-ink-primary">
              See the method run.
            </p>
            <p className="mt-1 max-w-[640px] text-[13px] leading-[20px] text-ink-muted">
              Upload a bill and watch the four stages play out, round by round, in the chamber.
            </p>
          </div>
        </div>
        <Link
          to="/debates/new"
          className="inline-flex h-12 shrink-0 items-center justify-center rounded-full bg-accent-rust px-6 text-[14px] font-medium text-surface transition-colors hover:bg-accent-rust-hi"
        >
          Start a new debate
        </Link>
      </aside>
    </div>
  );
}
