const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
const GROQ_BASE_URL = (
  process.env.GROQ_BASE_URL || "https://api.groq.com/openai/v1"
).replace(/\/$/, "");

function truncateForAnalysis(text, maxLen = 28_000) {
  if (!text || text.length <= maxLen) return text;
  const head = Math.floor(maxLen * 0.6);
  const tail = maxLen - head - 30;
  return `${text.slice(0, head)}\n\n[...]\n\n${text.slice(-tail)}`;
}

function extractJsonObject(text) {
  const cleaned = text
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start !== -1 && end > start) {
      return JSON.parse(cleaned.slice(start, end + 1));
    }
    throw new Error("AI cevabi gecerli JSON degil.");
  }
}

async function callGroqJson(systemPrompt, userPrompt) {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY bulunamadi.");
  }

  const response = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      temperature: 0.2,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  if (!response.ok) {
    const bodyText = await response.text();
    const err = new Error(`Groq basarisiz (${response.status}): ${bodyText}`);
    err.status = response.status;
    throw err;
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content || typeof content !== "string") {
    throw new Error("Groq cevabi bos veya gecersiz.");
  }

  return extractJsonObject(content);
}

function buildFallbackAnalysis(text, fileName) {
  const paragraphs = text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter((p) => p.length > 60);

  const chunks =
    paragraphs.length >= 3
      ? paragraphs.slice(0, 6)
      : [text.slice(0, 800), text.slice(800, 1600), text.slice(1600, 2400)].filter(
          Boolean,
        );

  const topics = chunks.slice(0, 6).map((chunk, index) => {
    const title =
      chunk.split(/[.!?]/)[0]?.slice(0, 80).trim() || `Konu ${index + 1}`;
    return {
      title: title.length > 60 ? `${title.slice(0, 57)}...` : title,
      summary: chunk.slice(0, 400),
      keyPoints: chunk
        .split(/[.;]/)
        .map((s) => s.trim())
        .filter((s) => s.length > 20)
        .slice(0, 4),
    };
  });

  return {
    generalSummary: text.slice(0, 500),
    suggestedTitle: fileName?.replace(/\.pdf$/i, "") || "PDF Belgesi",
    topics:
      topics.length > 0
        ? topics
        : [
            {
              title: "Genel Icerik",
              summary: text.slice(0, 600),
              keyPoints: ["PDF metninden otomatik ozet"],
            },
          ],
  };
}

function normalizeTopics(rawTopics) {
  if (!Array.isArray(rawTopics)) return [];

  return rawTopics
    .map((topic) => {
      const title =
        typeof topic?.title === "string" ? topic.title.trim() : "";
      const summary =
        typeof topic?.summary === "string" ? topic.summary.trim() : "";
      const keyPoints = Array.isArray(topic?.keyPoints)
        ? topic.keyPoints
            .filter((p) => typeof p === "string" && p.trim())
            .map((p) => p.trim())
            .slice(0, 6)
        : [];

      if (!title || !summary) return null;
      return { title, summary, keyPoints };
    })
    .filter(Boolean)
    .slice(0, 10);
}

async function analyzePdfText(text, fileName = "belge.pdf") {
  const excerpt = truncateForAnalysis(text);

  const systemPrompt =
    "Sadece gecerli bir JSON nesnesi dondur. Markdown veya aciklama yazma.";
  const userPrompt = `Sen uzman bir egitim icerik analistisin. Asagidaki PDF metnini Turkce analiz et.

DOSYA ADI: ${fileName}

METIN:
"""
${excerpt}
"""

Asagidaki JSON formatinda yanit ver:
{
  "generalSummary": "Belgenin 2-4 cumlelik genel ozeti",
  "suggestedTitle": "Belge icin kisa baslik",
  "topics": [
    {
      "title": "Konu basligi",
      "summary": "Bu konunun 3-5 cumlelik ozeti",
      "keyPoints": ["onemli madde 1", "onemli madde 2", "onemli madde 3"]
    }
  ]
}

Kurallar:
- En az 3, en fazla 8 konu cikar
- Konular birbirinden belirgin sekilde farkli olsun
- Ozetler ogrencinin sinava hazirlanmasina yardimci olsun
- keyPoints her konuda 2-5 madde olsun`;

  try {
    const parsed = await callGroqJson(systemPrompt, userPrompt);
    const topics = normalizeTopics(parsed.topics);

    if (topics.length === 0) {
      return buildFallbackAnalysis(text, fileName);
    }

    return {
      generalSummary:
        typeof parsed.generalSummary === "string"
          ? parsed.generalSummary.trim()
          : text.slice(0, 400),
      suggestedTitle:
        typeof parsed.suggestedTitle === "string"
          ? parsed.suggestedTitle.trim()
          : fileName.replace(/\.pdf$/i, ""),
      topics,
    };
  } catch (error) {
    console.warn("PDF AI analizi basarisiz, fallback kullaniliyor:", error.message);
    return buildFallbackAnalysis(text, fileName);
  }
}

function buildTopicContext(topic, fullText) {
  const keyPointsBlock =
    topic.keyPoints?.length > 0
      ? `\nOnemli maddeler:\n- ${topic.keyPoints.join("\n- ")}`
      : "";

  const excerpt = truncateForAnalysis(fullText, 14_000);

  return `KONU: ${topic.title}
KONU OZETI: ${topic.summary}${keyPointsBlock}

KAYNAK METIN (PDF):
"""
${excerpt}
"""`;
}

module.exports = {
  analyzePdfText,
  buildTopicContext,
  truncateForAnalysis,
};
