import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import type { SynthesisDto } from "@agora/shared";
import { SynthesisContent } from "./SynthesisContent";

const FIXTURE: SynthesisDto = {
  debateId: "debate-001",
  title: "Affordable Housing Reform Act of 2026",
  createdAt: "2026-04-11T09:00:00.000Z",
  contradictions: [
    "Tenants treat rent caps as protection; operators treat them as expropriation.",
    "Builders want predictability; council wants flexibility to revise yearly.",
    "First-time buyers feel sidelined by both sides of the rental debate.",
  ],
  commonGround: [
    "Everyone accepts that current rental volatility is unsustainable.",
    "All sides agree new construction must continue, not stall.",
    "The chamber accepts a phased introduction over a cliff edge.",
  ],
  compromise: [
    "Apply a 4% annual cap in regulated zones with a sunset clause after three years.",
    "Exempt buildings under five units to protect small operators.",
    "Pair the cap with a tax credit to keep new construction on the table.",
  ],
  participantShifts: [
    {
      personaId: "p1",
      personaName: "Mira K.",
      personaDemographic: "Long-term tenant",
      personaColor: "sage",
      openedQuote: "tenants need predictable rents.",
      closedQuote: "a phased cap with review keeps tenants protected.",
      shiftPercent: 18,
    },
    {
      personaId: "p2",
      personaName: "Stoyan P.",
      personaDemographic: "Building operator",
      personaColor: "rust",
      openedQuote: "a cap would freeze new construction.",
      closedQuote: "with an sme carve-out i can live with a phased cap.",
      shiftPercent: 42,
    },
  ],
  closingStatement: "the chamber leaves with a workable shape, not a settled one.",
  failed: false,
};

function render(synthesis: SynthesisDto): string {
  return renderToStaticMarkup(
    <MemoryRouter>
      <SynthesisContent synthesis={synthesis} />
    </MemoryRouter>,
  );
}

describe("SynthesisContent", () => {
  it("renders all three verdict columns with their respective items", () => {
    const html = render(FIXTURE);
    expect(html).toContain("Contradictions");
    expect(html).toContain("Common ground");
    expect(html).toContain("Compromise");
    for (const item of [
      ...FIXTURE.contradictions,
      ...FIXTURE.commonGround,
      ...FIXTURE.compromise,
    ]) {
      expect(html).toContain(item);
    }
  });

  it("includes one shift row per participant with quotes and shift percent", () => {
    const html = render(FIXTURE);
    for (const shift of FIXTURE.participantShifts) {
      expect(html).toContain(shift.personaName);
      expect(html).toContain(shift.personaDemographic);
      expect(html).toContain(shift.openedQuote);
      expect(html).toContain(shift.closedQuote);
      expect(html).toContain(`${shift.shiftPercent}%`);
    }
  });

  it("surfaces the closing statement and the neutral judge eyebrow", () => {
    const html = render(FIXTURE);
    expect(html).toContain(FIXTURE.closingStatement);
    expect(html).toContain("Closing");
    expect(html).toContain("Neutral judge");
  });
});
