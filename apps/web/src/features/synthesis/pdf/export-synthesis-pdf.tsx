import { pdf } from "@react-pdf/renderer";
import type { SynthesisDto } from "@agora/shared";
import { debateCode } from "@/features/debates/lib/debate-code";
import { SynthesisDocument } from "./SynthesisDocument";

/**
 * Renders the synthesis to a real PDF (vector text, controlled pagination) and
 * triggers a download. Replaces the old window.print() approach, which leaked
 * browser chrome and split cards across pages.
 */
export async function exportSynthesisPdf(synthesis: SynthesisDto): Promise<void> {
  const blob = await pdf(<SynthesisDocument synthesis={synthesis} />).toBlob();
  const code = debateCode(synthesis.title, synthesis.createdAt, synthesis.debateId);
  const url = URL.createObjectURL(blob);
  try {
    const link = document.createElement("a");
    link.href = url;
    link.download = `agora-synthesis-${code}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  } finally {
    URL.revokeObjectURL(url);
  }
}
