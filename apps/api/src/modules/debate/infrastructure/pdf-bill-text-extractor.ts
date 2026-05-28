import { Injectable } from "@nestjs/common";
import pdfParse from "pdf-parse";
import { IBillTextExtractor } from "../domain/bill-text-extractor";
import { InvalidPdfException } from "../../../common/exceptions/invalid-pdf.exception";
import { ScannedPdfException } from "../../../common/exceptions/scanned-pdf.exception";
import { BillTooLongException } from "../../../common/exceptions/bill-too-long.exception";

const PDF_MAGIC_BYTES = "%PDF-";
const MIN_TEXT_LENGTH = 200;
const MAX_TEXT_LENGTH = 200_000;

@Injectable()
export class PdfBillTextExtractor implements IBillTextExtractor {
  async extractFromPdf(buffer: Buffer): Promise<string> {
    const header = buffer.subarray(0, 5).toString("ascii");
    if (header !== PDF_MAGIC_BYTES) {
      throw new InvalidPdfException("File is not a valid PDF");
    }

    let raw: string;
    try {
      const result = await pdfParse(buffer);
      raw = result.text;
    } catch {
      throw new InvalidPdfException("Corrupt or unreadable PDF");
    }

    const text = this.cleanText(raw);

    if (text.length < MIN_TEXT_LENGTH) {
      throw new ScannedPdfException();
    }

    if (text.length > MAX_TEXT_LENGTH) {
      throw new BillTooLongException(text.length);
    }

    return text;
  }

  cleanText(raw: string): string {
    return (
      raw
        // Strip Bulgarian page markers (e.g. "стр. 1 от 5", "стр. 3/10")
        .replace(/стр\.\s*\d+\s*(от|\/)\s*\d+/gi, "")
        // Strip standalone page numbers on their own line
        .replace(/^\s*\d+\s*$/gm, "")
        // Collapse 3+ newlines to 2
        .replace(/\n{3,}/g, "\n\n")
        // Collapse runs of spaces/tabs to single space
        .replace(/[^\S\n]{2,}/g, " ")
        .trim()
    );
  }
}
