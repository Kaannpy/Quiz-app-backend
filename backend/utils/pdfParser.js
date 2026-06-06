const { PDFParse } = require("pdf-parse");


// “Projeye PDF tabanlı quiz modülü ekledik. Kullanıcı PDF yükliyor;
//  backend pdf-parse ile metni çıkarıyor, Groq ile konulara ayırıp özetliyor,
//  MongoDB’de saklıyor. Öğrenci bir konu seçince o konunun özeti ve PDF metni
//  yapay zekaya sourceContext olarak gidiyor; mevcut quiz üretim pipeline’ı
//  (Groq, Gemini yedek) bu metne dayalı soru üretiyor. 
// Frontend’de üç adımlı bir sihirbaz var:
//  yükle → konu seç → quiz üret → çöz.”
const MAX_STORED_TEXT = 80_000;
const MIN_TEXT_LENGTH = 80;

function normalizeText(text) {
  return text
    .replace(/\0/g, "")
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function truncateText(text, maxLen = MAX_STORED_TEXT) {
  if (!text || text.length <= maxLen) return text;
  const head = Math.floor(maxLen * 0.65);
  const tail = maxLen - head - 20;
  return `${text.slice(0, head)}\n\n[...metin kisaltildi...]\n\n${text.slice(-tail)}`;
}

async function extractTextFromPdfBuffer(buffer) {
  if (!buffer || buffer.length === 0) {
    throw new Error("PDF dosyasi bos.");
  }

  const data =
    buffer instanceof Uint8Array && !Buffer.isBuffer(buffer)
      ? buffer
      : new Uint8Array(buffer);

  let parser;
  try {
    parser = new PDFParse({ data });
    const result = await parser.getText();
    const text = normalizeText(result?.text || "");

    let pageCount = 0;
    if (Array.isArray(result?.pages)) {
      pageCount = result.pages.length;
    } else if (typeof result?.total === "number") {
      pageCount = result.total;
    }

    return { text, pageCount };
  } catch (error) {
    const msg = error?.message || "PDF okunamadi";
    if (/invalid pdf/i.test(msg)) {
      throw new Error(
        "Gecersiz veya bozuk PDF. Lutfen baska bir dosya deneyin.",
      );
    }
    throw new Error(`PDF metni cikarilamadi: ${msg}`);
  } finally {
    if (parser?.destroy) {
      await parser.destroy().catch(() => {});
    }
  }
}

module.exports = {
  extractTextFromPdfBuffer,
  normalizeText,
  truncateText,
  MIN_TEXT_LENGTH,
  MAX_STORED_TEXT,
};
