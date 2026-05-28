import { InvalidPdfException } from "../../../../common/exceptions/invalid-pdf.exception";
import { ScannedPdfException } from "../../../../common/exceptions/scanned-pdf.exception";
import { BillTooLongException } from "../../../../common/exceptions/bill-too-long.exception";
import { PdfBillTextExtractor } from "../pdf-bill-text-extractor";

import pdfParse from "pdf-parse";

jest.mock("pdf-parse", () => ({
  __esModule: true,
  default: jest.fn(),
}));

const mockPdfParse = pdfParse as unknown as jest.Mock;

describe("PdfBillTextExtractor", () => {
  let extractor: PdfBillTextExtractor;

  beforeEach(() => {
    extractor = new PdfBillTextExtractor();
    mockPdfParse.mockReset();
  });

  describe("cleanText", () => {
    it("strips Bulgarian page markers", () => {
      const input = "Some text стр. 1 от 5 more text";
      expect(extractor.cleanText(input)).toBe("Some text more text");
    });

    it("strips page markers with slash format", () => {
      const input = "Text стр. 3/10 end";
      expect(extractor.cleanText(input)).toBe("Text end");
    });

    it("strips standalone page numbers on their own lines", () => {
      const input = "First paragraph\n  42  \nSecond paragraph";
      expect(extractor.cleanText(input)).toBe("First paragraph\n\nSecond paragraph");
    });

    it("collapses excessive newlines to two", () => {
      const input = "Para one\n\n\n\n\nPara two";
      expect(extractor.cleanText(input)).toBe("Para one\n\nPara two");
    });

    it("collapses runs of spaces to single space", () => {
      const input = "word    word\t\t  word";
      expect(extractor.cleanText(input)).toBe("word word word");
    });

    it("trims leading and trailing whitespace", () => {
      expect(extractor.cleanText("  hello  ")).toBe("hello");
    });

    it("returns empty string for empty input", () => {
      expect(extractor.cleanText("")).toBe("");
    });
  });

  describe("extractFromPdf", () => {
    it("throws InvalidPdfException when buffer does not start with %PDF-", async () => {
      const buffer = Buffer.from("not a pdf file content");
      await expect(extractor.extractFromPdf(buffer)).rejects.toBeInstanceOf(InvalidPdfException);
    });

    it("throws InvalidPdfException when pdf-parse throws", async () => {
      const buffer = Buffer.from("%PDF-1.4 corrupt data");
      mockPdfParse.mockRejectedValueOnce(new Error("parse error"));

      await expect(extractor.extractFromPdf(buffer)).rejects.toBeInstanceOf(InvalidPdfException);
    });

    it("throws ScannedPdfException when extracted text is too short", async () => {
      const buffer = Buffer.from("%PDF-1.4 valid header");
      mockPdfParse.mockResolvedValueOnce({ text: "short" });

      await expect(extractor.extractFromPdf(buffer)).rejects.toBeInstanceOf(ScannedPdfException);
    });

    it("throws BillTooLongException when text exceeds 200k chars", async () => {
      const buffer = Buffer.from("%PDF-1.4 valid header");
      mockPdfParse.mockResolvedValueOnce({ text: "a".repeat(200_001) });

      await expect(extractor.extractFromPdf(buffer)).rejects.toBeInstanceOf(BillTooLongException);
    });

    it("returns cleaned text for a valid PDF", async () => {
      const buffer = Buffer.from("%PDF-1.4 valid header");
      const billContent =
        "Законопроект за изменение\n\n\n\nстр. 1 от 3\n\nЧлен 1. " + "а".repeat(250);
      mockPdfParse.mockResolvedValueOnce({ text: billContent });

      const result = await extractor.extractFromPdf(buffer);

      expect(result).not.toContain("стр. 1 от 3");
      expect(result).toContain("Законопроект за изменение");
      expect(result.length).toBeGreaterThanOrEqual(200);
    });
  });
});
