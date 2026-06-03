import {
  Document,
  Font,
  Page,
  StyleSheet,
  Svg,
  Line,
  Circle,
  Text,
  View,
} from "@react-pdf/renderer";
import type { ParticipantShiftDto, SynthesisDto } from "@agora/shared";
import { debateCode, formatDate } from "@/features/debates/lib/debate-code";

import PTSerifRegular from "./fonts/PTSerif-Regular.ttf?url";
import PTSerifItalic from "./fonts/PTSerif-Italic.ttf?url";
import PTSerifBold from "./fonts/PTSerif-Bold.ttf?url";
import PTSansRegular from "./fonts/PTSans-Regular.ttf?url";
import PTSansBold from "./fonts/PTSans-Bold.ttf?url";

// PT Serif / PT Sans stand in for the on-screen Tiempos / Inter targets: they
// are static TTFs with full Cyrillic + true italic, which the bundled PDF
// (Bulgarian content) requires. See .claude/design.md.
Font.register({
  family: "PtSerif",
  fonts: [
    { src: PTSerifRegular, fontWeight: 400 },
    { src: PTSerifItalic, fontWeight: 400, fontStyle: "italic" },
    { src: PTSerifBold, fontWeight: 700 },
  ],
});
Font.register({
  family: "PtSans",
  fonts: [
    { src: PTSansRegular, fontWeight: 400 },
    { src: PTSansBold, fontWeight: 700 },
  ],
});

// Tokens mirrored from .claude/design.md (react-pdf can't read CSS vars).
const C = {
  canvas: "#F2EBDD",
  surface: "#F8F2E6",
  surface2: "#E8DFCB",
  hair: "#E0D6BF",
  inkPrimary: "#1F1B16",
  inkBody: "#2E2A22",
  inkMuted: "#6B6357",
  inkLabel: "#8A8170",
  cream: "#F5EEDF",
  rust: "#B85A1E",
} as const;

const PERSONA_HEX: Record<string, string> = {
  sage: "#7B8F6A",
  rust: "#C9742F",
  mustard: "#C7A03A",
  forest: "#3F5942",
  terracotta: "#C04B3B",
  aubergine: "#6B3F5E",
  steel: "#6E7E8A",
};

function personaHex(token: string | null | undefined): string {
  if (!token) return PERSONA_HEX.steel;
  const key = token.toLowerCase();
  if (key in PERSONA_HEX) return PERSONA_HEX[key];
  if (/^#[0-9a-f]{3,8}$/i.test(token)) return token;
  return PERSONA_HEX.steel;
}

function initial(name: string): string {
  const t = name.trim();
  return t ? t.charAt(0).toUpperCase() : "?";
}

const styles = StyleSheet.create({
  page: {
    backgroundColor: C.canvas,
    color: C.inkBody,
    fontFamily: "PtSans",
    fontSize: 10,
    paddingTop: 48,
    paddingBottom: 56,
    paddingHorizontal: 48,
    lineHeight: 1.5,
  },
  eyebrow: {
    fontFamily: "PtSans",
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: 1.4,
    color: C.inkLabel,
  },
  // Header
  header: {
    borderBottomWidth: 1,
    borderBottomColor: C.hair,
    paddingBottom: 22,
    marginBottom: 28,
  },
  title: {
    fontFamily: "PtSerif",
    fontSize: 30,
    lineHeight: 1.1,
    color: C.inkPrimary,
    marginTop: 10,
  },
  titleEm: {
    fontFamily: "PtSerif",
    fontStyle: "italic",
    color: C.rust,
  },
  lead: {
    fontFamily: "PtSans",
    fontSize: 10.5,
    color: C.inkBody,
    marginTop: 10,
    maxWidth: 420,
  },
  concluded: { marginTop: 12 },
  // Section
  section: { marginBottom: 36 },
  sectionHeading: {
    fontFamily: "PtSerif",
    fontSize: 19,
    color: C.inkPrimary,
    marginTop: 8,
    marginBottom: 14,
  },
  // Verdict columns
  verdictRow: { flexDirection: "row", gap: 12 },
  verdictCol: {
    flex: 1,
    borderWidth: 1,
    borderColor: C.hair,
    borderRadius: 8,
    backgroundColor: C.surface,
    padding: 14,
  },
  verdictColEmph: { backgroundColor: C.surface2 },
  colTitleRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10 },
  dot: { width: 7, height: 7, borderRadius: 3.5 },
  colTitle: { fontFamily: "PtSerif", fontSize: 13, color: C.inkPrimary },
  listItem: { flexDirection: "row", gap: 8, marginBottom: 8 },
  listNum: {
    fontFamily: "PtSerif",
    fontStyle: "italic",
    fontSize: 15,
    color: C.rust,
    width: 16,
  },
  listText: { flex: 1, fontFamily: "PtSans", fontSize: 9.5, color: C.inkBody, lineHeight: 1.4 },
  // Shift rows
  shiftRow: {
    flexDirection: "row",
    gap: 14,
    borderTopWidth: 1,
    borderTopColor: C.hair,
    paddingVertical: 20,
  },
  shiftLeft: { width: 150 },
  personaRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  shiftMeta: { marginTop: 18 },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLetter: { fontFamily: "PtSerif", fontSize: 13, color: C.cream },
  personaName: { fontFamily: "PtSans", fontSize: 10.5, color: C.inkPrimary },
  personaDemo: { fontFamily: "PtSans", fontSize: 8.5, color: C.inkMuted, lineHeight: 1.35 },
  shiftPct: {
    fontFamily: "PtSerif",
    fontStyle: "italic",
    fontSize: 28,
    lineHeight: 1.1,
    color: C.inkPrimary,
    marginTop: 6,
    marginBottom: 10,
  },
  shiftLabel: { fontFamily: "PtSans", fontSize: 8, letterSpacing: 1.4, color: C.inkLabel },
  shiftRight: { flex: 1 },
  quotePair: { flexDirection: "row", gap: 14, marginTop: 8 },
  quoteCol: { flex: 1 },
  quoteBody: {
    fontFamily: "PtSerif",
    fontStyle: "italic",
    fontSize: 9.5,
    color: C.inkBody,
    lineHeight: 1.4,
    marginTop: 3,
  },
  // Judge closing
  judgeCard: {
    flexDirection: "row",
    gap: 16,
    borderWidth: 1,
    borderColor: C.hair,
    borderRadius: 8,
    backgroundColor: C.surface2,
    padding: 20,
  },
  judgeMark: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: PERSONA_HEX.aubergine,
    alignItems: "center",
    justifyContent: "center",
  },
  judgeMarkGlyph: { fontFamily: "PtSerif", fontSize: 22, color: C.cream },
  judgeQuote: {
    fontFamily: "PtSerif",
    fontStyle: "italic",
    fontSize: 15,
    color: C.inkPrimary,
    lineHeight: 1.35,
    marginTop: 6,
  },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 48,
    right: 48,
    flexDirection: "row",
    justifyContent: "space-between",
    color: C.inkLabel,
    fontSize: 8,
    letterSpacing: 1,
  },
});

function VerdictColumn({
  label,
  hex,
  items,
  emphasized,
}: {
  label: string;
  hex: string;
  items: string[];
  emphasized?: boolean;
}) {
  return (
    <View style={[styles.verdictCol, emphasized ? styles.verdictColEmph : {}]}>
      <View style={styles.colTitleRow}>
        <View style={[styles.dot, { backgroundColor: hex }]} />
        <Text style={styles.colTitle}>{label}</Text>
      </View>
      {items.map((item, i) => (
        <View key={i} style={styles.listItem}>
          <Text style={styles.listNum}>{i + 1}</Text>
          <Text style={styles.listText}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

function Sparkline({ hex, shiftPercent }: { hex: string; shiftPercent: number }) {
  const start = 4;
  const end = 96;
  const fullTravelAt = 50;
  const progress = Math.min(Math.max(shiftPercent, 0), fullTravelAt) / fullTravelAt;
  const headX = start + (end - start) * progress;
  return (
    <Svg width={100} height={16} viewBox="0 0 100 16">
      <Line x1={start} y1={8} x2={end} y2={8} stroke={C.hair} strokeWidth={1} />
      <Line x1={start} y1={8} x2={headX} y2={8} stroke={hex} strokeWidth={2} />
      <Circle cx={start} cy={8} r={3.5} fill={C.surface} stroke={hex} strokeWidth={1.5} />
      <Circle cx={headX} cy={8} r={4.5} fill={hex} />
    </Svg>
  );
}

function ShiftRow({ shift }: { shift: ParticipantShiftDto }) {
  const hex = personaHex(shift.personaColor);
  return (
    <View style={styles.shiftRow} wrap={false}>
      <View style={styles.shiftLeft}>
        <View style={styles.personaRow}>
          <View style={[styles.avatar, { backgroundColor: hex }]}>
            <Text style={styles.avatarLetter}>{initial(shift.personaName)}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.personaName}>{shift.personaName}</Text>
            <Text style={styles.personaDemo}>{shift.personaDemographic}</Text>
          </View>
        </View>
        <View style={styles.shiftMeta}>
          <Text style={styles.shiftLabel}>SHIFT</Text>
          <Text style={styles.shiftPct}>{shift.shiftPercent}%</Text>
          <Sparkline hex={hex} shiftPercent={shift.shiftPercent} />
        </View>
      </View>
      <View style={styles.shiftRight}>
        <View style={styles.quotePair}>
          <View style={styles.quoteCol}>
            <Text style={styles.eyebrow}>OPENED R1</Text>
            <Text style={styles.quoteBody}>{`“${shift.openedQuote}”`}</Text>
          </View>
          <View style={styles.quoteCol}>
            <Text style={styles.eyebrow}>CLOSED R3</Text>
            <Text style={styles.quoteBody}>{`“${shift.closedQuote}”`}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

export function SynthesisDocument({ synthesis }: { synthesis: SynthesisDto }) {
  const code = debateCode(synthesis.title, synthesis.createdAt, synthesis.debateId);
  const concluded = formatDate(synthesis.createdAt);

  return (
    <Document title={`Agora Synthesis ${code}`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>{`SYNTHESIS · ${code}`}</Text>
          <Text style={styles.title}>
            Where the table arrived, <Text style={styles.titleEm}>together.</Text>
          </Text>
          <Text style={styles.lead}>
            Three rounds in, the chamber settles. The neutral judge reads the transcript end to end
            and lays out the fault lines, the agreements, and the shape of a workable compromise -
            without taking a side.
          </Text>
          <Text
            style={[styles.eyebrow, styles.concluded]}
          >{`CONCLUDED ${concluded.toUpperCase()}`}</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.verdictRow}>
            <VerdictColumn
              label="Contradictions"
              hex={PERSONA_HEX.terracotta}
              items={synthesis.contradictions}
            />
            <VerdictColumn
              label="Common ground"
              hex={PERSONA_HEX.sage}
              items={synthesis.commonGround}
            />
            <VerdictColumn
              label="Compromise"
              hex={PERSONA_HEX.mustard}
              items={synthesis.compromise}
              emphasized
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.eyebrow}>BY PARTICIPANT</Text>
          <Text style={styles.sectionHeading}>How each seat shifted.</Text>
          {synthesis.participantShifts.length === 0 ? (
            <Text style={{ fontSize: 10, color: C.inkMuted, marginTop: 8 }}>
              · No participant movement was recorded in this debate.
            </Text>
          ) : (
            <View style={{ marginTop: 4 }}>
              {synthesis.participantShifts.map((shift) => (
                <ShiftRow key={shift.personaId} shift={shift} />
              ))}
            </View>
          )}
        </View>

        <View style={styles.judgeCard} wrap={false}>
          <View style={styles.judgeMark}>
            <Text style={styles.judgeMarkGlyph}>{"§"}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.eyebrow}>CLOSING · NEUTRAL JUDGE</Text>
            <Text style={styles.judgeQuote}>{`“${synthesis.closingStatement}”`}</Text>
          </View>
        </View>

        <View style={styles.footer} fixed>
          <Text>{`AGORA · ${code}`}</Text>
          <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
