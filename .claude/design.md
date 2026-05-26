# Agora — Design System

The foundation. Editorial, civic, calm. A reading room, not a chat app.

## Principles

1. **Editorial over UI.** Page layouts read like a quality newspaper — generous margins, serif display, numbered lists, italic emphasis. Chrome stays out of the way.
2. **Warm, not bright.** Parchment background, ink-dark text. No pure white, no pure black, no neon. Saturation only earns its keep on persona dots and accent words.
3. **The persona palette carries meaning.** Each agent has one color, used everywhere they appear (avatar, quote bar, mood chip, shift line, card border). Don't reassign.
4. **Quiet motion.** Halos pulse, accents settle in. No bouncy springs, no decorative animation.
5. **Numbers as typography.** Ordered lists use large italic serif numerals as the bullet — they're a graphic device, not just markers.

---

## Color

### Surfaces

| Token            | Value (approx) | Use                                              |
| ---------------- | -------------- | ------------------------------------------------ |
| `bg-canvas`      | `#F2EBDD`      | Page background — warm parchment                 |
| `bg-surface`     | `#F8F2E6`      | Default card                                     |
| `bg-surface-2`   | `#E8DFCB`      | Emphasized card (compromise column, judge block) |
| `bg-surface-mut` | `#EFE7D5`      | Inset / secondary card                           |
| `border-hair`    | `#E0D6BF`      | Hairline divider, card outline                   |

### Ink

| Token         | Value     | Use                                  |
| ------------- | --------- | ------------------------------------ |
| `ink-primary` | `#1F1B16` | Headings, body                       |
| `ink-body`    | `#2E2A22` | Long-form body                       |
| `ink-muted`   | `#6B6357` | Secondary text, descriptions         |
| `ink-label`   | `#8A8170` | Uppercase eyebrow labels, meta lines |

### Accent

| Token            | Value     | Use                                                |
| ---------------- | --------- | -------------------------------------------------- |
| `accent-rust`    | `#B85A1E` | Italic display emphasis, primary CTA, list numbers |
| `accent-rust-hi` | `#D26A23` | Hover / link                                       |
| `ink-button`     | `#1A1612` | Dark pill button background                        |

### Persona palette

Fixed mapping. One persona, one hue, used for avatar fill, quote-card accent bar, shift sparkline, and the matching mood-chip dot.

| Persona role            | Hue        | Hex       |
| ----------------------- | ---------- | --------- |
| Tenant / civic-aligned  | sage       | `#7B8F6A` |
| Landlord / operator     | rust       | `#C9742F` |
| Developer / builder     | mustard    | `#C7A03A` |
| Council / institutional | forest     | `#3F5942` |
| First-time buyer / new  | terracotta | `#C04B3B` |
| **Judge** (reserved)    | aubergine  | `#6B3F5E` |

Moods reuse the same palette: `calm` (sage), `confident` (mustard), `pensive` (aubergine), `anxious` (steel `#6E7E8A`), `tense` (terracotta).

`emotion-color.ts` keeps a parallel `EMOTION_HEX` map of raw hex values alongside the CSS-var map. This is intentional: `box-shadow` with alpha (e.g. `#7B8F6A66`) requires a literal hex; CSS custom properties can't carry an inline alpha suffix.

---

## Typography

Two families. No third.

- **Display serif** — a high-contrast transitional serif (target: GT Sectra, Canela, or Tiempos Headline). Used for page titles, section headings, pull quotes, and the italic emphasis words.
- **Body sans** — a humanist neo-grotesk (target: Inter, or GT America). Used for body, UI, labels.

### Scale

| Role               | Family              | Size / leading | Notes                                                                 |
| ------------------ | ------------------- | -------------- | --------------------------------------------------------------------- |
| Display XL         | serif, 400          | 72 / 78        | Hero ("Where many voices…"). Mixes upright + italic for emphasis.     |
| Display L          | serif, 400          | 56 / 62        | Page title ("Affordable Housing Reform Act of 2026")                  |
| Display M          | serif, 400          | 36 / 42        | Section heading ("How each seat shifted.")                            |
| Heading S          | serif, 400          | 24 / 30        | Card title ("Contradictions", "Common ground", "Compromise")          |
| Quote              | serif italic, 400   | 22 / 30        | Agent quotes, judge closing                                           |
| Body               | sans, 400           | 16 / 24        | Default                                                               |
| Body S             | sans, 400           | 14 / 20        | Card body, meta                                                       |
| Label              | sans, 500, 0.14em   | 12 / 16        | UPPERCASE eyebrows (`SYNTHESIS · HRA-2026-04`, `BY PARTICIPANT`)      |
| Mono ID            | sans, 500, 0.08em   | 12 / 16        | Bill IDs (`HRA-2026-04`), round markers (`R1 · R2 · R3`). UPPERCASE.  |

Italic of the display serif is the **only** way to emphasize a word inside a heading, and it always takes `accent-rust`. Don't bold display type.

---

## Layout & spacing

- 8px base grid. Spacing scale: `4, 8, 12, 16, 24, 32, 48, 64, 96`.
- Page max content width: **1240px**. Hero / synthesis lead column: **640–720px** for reading.
- Section vertical rhythm: **96px** between major sections, **48px** between heading and content, **24px** inside cards.
- Generous left/right page padding — at least **48px** on desktop. The page should feel like a printed spread.

### Cards

- Radius **16px**. Hairline border `border-hair`, no shadow by default.
- Emphasized card (e.g. the *Compromise* column, judge closing block): swap fill to `bg-surface-2`, keep radius and border.
- Internal padding **32px**; **24px** on dense lists.

### Top bar

- Height **72px**, hairline bottom border, no shadow.
- Logo (mark + wordmark) left. Nav center. Version pill + avatar right.
- Active nav item: dark pill (`ink-button` fill, cream text). Inactive: plain `ink-body`. No underlines.

---

## Components

### Buttons

| Variant   | Shape          | Fill            | Text          | Use                                         |
| --------- | -------------- | --------------- | ------------- | ------------------------------------------- |
| Primary   | full pill, 999 | `ink-button`    | `#F5EEDF`     | Dominant CTA ("Export", "Back to dashboard")|
| Accent    | full pill      | `accent-rust`   | `#F8F2E6`     | The single highest-intent CTA per page ("Start a new debate") |
| Ghost     | full pill      | `bg-surface`    | `ink-primary` | Secondary ("Browse examples", "Re-run…")    |
| Link      | text + arrow   | none            | `accent-rust` | Inline ("Read full text →")                 |

Height **48px**, horizontal padding **24px**. Don't introduce square buttons.

### Persona avatar

- Circle, persona hue fill, single uppercase serif letter centered.
- **Active** in stage view: soft outer glow in the same hue, ~32px blur, 40% opacity. Stationary — no rotation, no orbit.
- Sizes: **40px** (lists, chips), **56px** (avatar in quote card), **80px** (stage view).

### Quote card (agent reply)

- Surface card with a **3px vertical accent bar** on the left edge in the speaker's persona hue.
- Header row: avatar + name + role on left; `ROUND N` + `FEELING · <mood>` (uppercase label) on right.
- Body: serif italic quote, large left/right curly quotes (`"…"`).

### Mood chip / legend dot

- 8px filled circle in mood hue, followed by UPPERCASE label.
- Used in the stage-view legend and the per-message feeling marker.

### Numbered list (editorial)

- Numerals rendered in display serif italic, `accent-rust`, hung in a left gutter (~32px wide). Item text starts at the gutter edge.
- Used for Contradictions, Common ground, Compromise, and bill clauses (`§1`, `§2` use the same gutter treatment with the section sign).

### Stage view (debate room centerpiece)

- Square card, light radial wash from center outward.
- Personas arranged on an implicit circle; document mark at center with bill ID below.
- Round indicator (`ROUND 2 OF 3`) sits inside the circle, monospaced label.
- Mood legend pinned bottom-center inside the card.

### Stepper (debate flow)

- Vertical list. Each step: number-or-check glyph in a circle + title (serif) + one-line description (`ink-muted`).
- Current step: surrounded by a soft `bg-surface` pill the full width of the stepper.
- Completed step: filled sage circle with check.

### Shift visualization (synthesis)

- Three-stop sparkline R1 → R2 → R3 in persona hue. Open circle = starting position, filled = closed position.
- Right-rail percentage shown in display serif italic + small `SHIFT` label underneath.

---

## Iconography

- Stroke icons only, 1.5px, rounded caps. Library target: Lucide.
- Inline arrows in copy use the typographic `→` `←` glyphs, not icon components.
- The `§` (section sign) is a first-class typographic element — used as bill-clause prefix and judge avatar mark.

---

## Voice (copy that shapes the UI)

- Civic, considered, lowercase headings end with a period.
  - ✓ "How each seat shifted."
  - ✓ "The chamber, in retrospect."
- Status words are calm: *Active, Synthesized, Drafts.* No "Live", no "🔴".
- Empty / meta lines use a leading dot bullet + sentence case: "· Your last upload was 3 days ago".

---

## Don'ts

- No drop shadows on cards. Depth comes from surface tone, not blur.
- No gradients except the soft radial wash inside the stage view.
- No emoji in UI copy.
- Don't reassign persona colors per debate — the role-to-hue mapping is global.
- Don't bold display serif. Use italic + `accent-rust` for emphasis.
- Don't use the accent-rust pill button more than once per screen.
