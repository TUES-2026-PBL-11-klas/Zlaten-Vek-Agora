export const BILL_TEXT_EXTRACTOR = Symbol("IBillTextExtractor");

export interface IBillTextExtractor {
  extractFromPdf(buffer: Buffer): Promise<string>;
  cleanText(raw: string): string;
}
