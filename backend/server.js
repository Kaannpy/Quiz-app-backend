const cors = require("cors");
const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const Quiz = require("./models/quizModel");
const { GoogleGenerativeAI } = require("@google/generative-ai");

dotenv.config();

const requiredEnvVars = ["MONGO_URI", "JWT_SECRET"];
const missingVars = requiredEnvVars.filter((v) => !process.env[v]);
if (missingVars.length > 0) {
  console.error(`❌ Gerekli env değişkenleri eksik: ${missingVars.join(", ")}`);
  process.exit(1);
}

if (process.env.JWT_SECRET.length < 32) {
  console.warn(
    "⚠️  JWT_SECRET çok kısa, üretim için güçlü bir anahtar kullanın",
  );
}

connectDB();

const path = require("path");

const app = express();

// GOD MODE CORS - Her şeye, herkese izin ver
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Methods",
    "GET, PUT, POST, DELETE, OPTIONS, PATCH",
  );
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization",
  );
  res.header("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  next();
});
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const userRoutes = require("./routes/userRoutes");
const quizRoutes = require("./routes/quizRoutes");
const scoreRoutes = require("./routes/scoreRoutes");
const documentRoutes = require("./routes/documentRoutes");

app.use("/api/users", userRoutes);
app.use("/api/quizzes", quizRoutes);
app.use("/api/scores", scoreRoutes);
app.use("/api/documents", documentRoutes);

app.get("/api/documents/ping", (_req, res) => {
  res.json({ ok: true, message: "PDF document API aktif" });
});

// ─────────────────────────────────────────────
// YARDIMCI: uyku
// ─────────────────────────────────────────────
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ─────────────────────────────────────────────
// MODEL / KEY AYARLARI
// ─────────────────────────────────────────────
const MODEL_FALLBACK_LIST = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
];
const GEMINI_API_KEYS = [
  ...(process.env.GEMINI_API_KEYS || "")
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean),
  ...(process.env.GEMINI_API_KEY ? [process.env.GEMINI_API_KEY.trim()] : []),
];
const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
const GROQ_BASE_URL = (
  process.env.GROQ_BASE_URL || "https://api.groq.com/openai/v1"
).replace(/\/$/, "");

// ─────────────────────────────────────────────
// GEMINI RPM / COOLDOWN
// ─────────────────────────────────────────────
const MIN_REQUEST_GAP_MS = 12_500;
const GEMINI_COOLDOWN_MS = Number(
  process.env.GEMINI_COOLDOWN_MS || 10 * 60 * 1000,
);
const GEMINI_FAILURE_THRESHOLD = Number(
  process.env.GEMINI_FAILURE_THRESHOLD || 2,
);

let lastGeminiRequestAt = 0;
let generationQueue = Promise.resolve();
let geminiConsecutiveFailures = 0;
let geminiCooldownUntil = 0;

async function waitForGeminiSlot() {
  const now = Date.now();
  const waitMs = Math.max(0, MIN_REQUEST_GAP_MS - (now - lastGeminiRequestAt));
  if (waitMs > 0) {
    console.log(`RPM limiti icin ${waitMs}ms bekleniyor.`);
    await sleep(waitMs);
  }
  lastGeminiRequestAt = Date.now();
}

function enqueueGeneration(task) {
  const run = async () => {
    await waitForGeminiSlot();
    return task();
  };
  generationQueue = generationQueue.then(run, run);
  return generationQueue;
}

function isGeminiTemporarilyUnavailable(error) {
  const s = error?.status;
  return s === 429 || s === 503;
}
function isGeminiInCooldown() {
  return Date.now() < geminiCooldownUntil;
}

function registerGeminiFailure(error) {
  if (!isGeminiTemporarilyUnavailable(error)) {
    geminiConsecutiveFailures = 0;
    return;
  }
  geminiConsecutiveFailures += 1;
  if (geminiConsecutiveFailures >= GEMINI_FAILURE_THRESHOLD) {
    geminiCooldownUntil = Date.now() + GEMINI_COOLDOWN_MS;
    geminiConsecutiveFailures = 0;
    console.warn(
      `Gemini cooldown'a alindi (${Math.round(GEMINI_COOLDOWN_MS / 1000)}sn).`,
    );
  }
}
function registerGeminiSuccess() {
  geminiConsecutiveFailures = 0;
  geminiCooldownUntil = 0;
}

async function generateWithRetry(model, prompt, options = {}) {
  const { maxAttempts = 4, baseDelayMs = 1200 } = options;
  let lastError;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await model.generateContent(prompt);
    } catch (error) {
      lastError = error;
      const status = error?.status;
      if (!(status === 503 || status === 429) || attempt === maxAttempts)
        throw lastError;
      const delay = baseDelayMs * Math.pow(2, attempt - 1);
      console.warn(
        `Gemini gecici mesgul (${status}), ${delay}ms sonra tekrar.`,
      );
      await sleep(delay);
    }
  }
  throw lastError;
}

async function generateQuizWithModelFallback(prompt) {
  let lastError;
  if (GEMINI_API_KEYS.length === 0)
    throw new Error("Gemini API key bulunamadi.");
  for (const apiKey of GEMINI_API_KEYS) {
    const genAI = new GoogleGenerativeAI(apiKey);
    for (const modelName of MODEL_FALLBACK_LIST) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await generateWithRetry(model, prompt);
        return { result, modelName };
      } catch (error) {
        lastError = error;
        const status = error?.status;
        console.warn(
          `Gemini basarisiz (${modelName}, ${status || "unknown"}).`,
        );
        if (!([503, 429].includes(status) || status >= 500 || status === 404))
          break;
      }
    }
  }
  if (lastError) registerGeminiFailure(lastError);
  throw lastError;
}

async function generateQuizWithGroq(prompt) {
  if (!process.env.GROQ_API_KEY) throw new Error("GROQ_API_KEY bulunamadi.");
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
        {
          role: "system",
          content:
            "Sadece gecerli bir JSON dizi dondur. Markdown veya aciklama yazma.",
        },
        { role: "user", content: prompt },
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
  if (!content || typeof content !== "string")
    throw new Error("Groq cevabi bos veya gecersiz.");
  return content;
}

async function reviewQuizWithGroq(quizData, { konu, zorluk }) {
  if (
    !process.env.GROQ_API_KEY ||
    !Array.isArray(quizData) ||
    quizData.length === 0
  )
    return quizData;
  const reviewPrompt = `Asagidaki quiz sorularini kontrol et ve gerekirse DUZELT.
Kurallar:
- Her soruda tek dogru cevap olsun.
- answer alani options dizisindeki birebir metinlerden biri olsun.
- Bilgisel olarak yanlis cevabi düzelt.
- Gerekirse soruyu daha net hale getir ama soru sayisini degistirme.
- SADECE JSON dizi dondur.

Konu: ${konu}
Zorluk: ${zorluk}
Quiz JSON:
${JSON.stringify(quizData)}`;
  try {
    const reviewedText = await generateQuizWithGroq(reviewPrompt);
    const reviewedData = normalizeQuestions(extractQuizJson(reviewedText));
    return reviewedData.length > 0 ? reviewedData : quizData;
  } catch (error) {
    console.warn("Groq review atlandi:", error?.message || error);
    return quizData;
  }
}

// ─────────────────────────────────────────────
// KONU TESPİT & AKILLI PROMPT MOTORU
// ─────────────────────────────────────────────

/**
 * Konuyu analiz ederek hangi "domain"e ait olduğunu döner.
 * Dönen nesne: { domain, examType, language, subtopics, questionTypes }
 */
function analyzeSubject(konu) {
  const k = konu
    .toLowerCase()
    .replace(
      /[çğışöü]/g,
      (c) => ({ ç: "c", ğ: "g", ı: "i", ş: "s", ö: "o", ü: "u" })[c] || c,
    );

  // ── Sınav türü ──────────────────────────────
  const isTYT =
    k.includes("tyt") || (k.includes("temel") && k.includes("yetenek"));
  const isAYT =
    k.includes("ayt") || (k.includes("alan") && k.includes("yetenek"));
  const examType = isTYT ? "TYT" : isAYT ? "AYT" : null;

  // ── Dil ─────────────────────────────────────
  const isEnglish =
    k.includes("ingilizce") ||
    k.includes("english") ||
    k.includes("academic english") ||
    k.includes("ielts") ||
    k.includes("toefl") ||
    k.includes("esl");

  // ── Ana alan tespiti ────────────────────────
  const matKeywords = [
    "matematik",
    "math",
    "calculus",
    "lineer cebir",
    "analiz",
    "geometri",
    "trigonometri",
    "istatistik",
    "olasilik",
    "integral",
    "turev",
    "denklem",
    "sayi",
    "algebra",
  ];
  const physKeywords = [
    "fizik",
    "physics",
    "mekanik",
    "elektrik",
    "manyetizma",
    "optik",
    "termodinamik",
    "kuantum",
    "kuvvet",
    "hareket",
    "dalga",
    "enerji",
  ];
  const chemKeywords = [
    "kimya",
    "chemistry",
    "organik",
    "inorganik",
    "stoikiyometri",
    "periyodik",
    "asit",
    "baz",
    "mol",
    "reaksiyon",
    "cozunum",
  ];
  const bioKeywords = [
    "biyoloji",
    "biology",
    "hucre",
    "genetik",
    "evrim",
    "ekosistem",
    "anatomi",
    "fizyoloji",
    "dna",
    "rna",
    "protein",
    "mitoz",
    "mayoz",
  ];
  const histKeywords = [
    "tarih",
    "history",
    "osmanli",
    "cumhuriyet",
    "ataturk",
    "savas",
    "devrim",
    "imparatorluk",
    "cografya",
    "kultur",
  ];
  const litKeywords = [
    "edebiyat",
    "turkce",
    "dil",
    "yazin",
    "siir",
    "roman",
    "hikaye",
    "cumle",
    "paragraf",
    "anlam",
    "dilbilgisi",
  ];
  const itKeywords = [
    "it",
    "yazilim",
    "programlama",
    "python",
    "javascript",
    "java",
    "c++",
    "react",
    "nodejs",
    "sql",
    "veritabani",
    "algoritma",
    "veri yapisi",
    "aglar",
    "network",
    "siber",
    "bulut",
    "devops",
    "api",
    "backend",
    "frontend",
    "machine learning",
    "yapay zeka",
    "ai",
    "linux",
    "git",
    "docker",
    "kubernetes",
  ];
  const econKeywords = [
    "ekonomi",
    "economics",
    "finans",
    "finance",
    "borsa",
    "muhasebe",
    "mikroekonomi",
    "makroekonomi",
    "para",
    "piyasa",
    "enflasyon",
    "gsyih",
  ];
  const medKeywords = [
    "tip",
    "medicine",
    "saglik",
    "hemsire",
    "eczane",
    "ilac",
    "hastalik",
    "semptom",
    "tani",
    "tedavi",
    "patoloji",
  ];
  const psyKeywords = [
    "psikoloji",
    "psychology",
    "davranis",
    "bilis",
    "terapi",
    "psikiyatri",
    "sosyoloji",
    "sociology",
  ];
  const lawKeywords = [
    "hukuk",
    "law",
    "anayasa",
    "ceza",
    "medeni",
    "ticaret",
    "idare",
    "mahkeme",
    "yargi",
  ];

  const matches = (keywords) => keywords.some((kw) => k.includes(kw));

  let domain = "genel";
  if (matches(matKeywords)) domain = "matematik";
  else if (matches(physKeywords)) domain = "fizik";
  else if (matches(chemKeywords)) domain = "kimya";
  else if (matches(bioKeywords)) domain = "biyoloji";
  else if (matches(histKeywords)) domain = "tarih";
  else if (matches(litKeywords)) domain = "edebiyat_dil";
  else if (matches(itKeywords)) domain = "bilisim_yazilim";
  else if (matches(econKeywords)) domain = "ekonomi_finans";
  else if (matches(medKeywords)) domain = "tip_saglik";
  else if (matches(psyKeywords)) domain = "psikoloji_sosyoloji";
  else if (matches(lawKeywords)) domain = "hukuk";

  return { domain, examType, isEnglish };
}

/**
 * Domain'e göre çeşitli alt konular ve soru tipleri döner.
 * Her çağrıda FARKLI bir alt küme seçilir (rastgelelik).
 */
const DOMAIN_DATA = {
  matematik: {
    subtopics: [
      "Denklem Sistemleri",
      "Fonksiyonlar ve Grafikleri",
      "Logaritma",
      "Üstel Fonksiyonlar",
      "Trigonometri",
      "Olasılık ve Kombinasyon",
      "İstatistik ve Veri Analizi",
      "Türev ve Uygulamaları",
      "İntegral ve Alan Hesabı",
      "Sayı Teorisi",
      "Modüler Aritmetik",
      "Karmaşık Sayılar",
      "Geometrik Dizi ve Seriler",
      "Koordinat Geometrisi",
      "Vektörler",
      "Matrisler ve Determinantlar",
      "Limit ve Süreklilik",
      "Diferansiyel Denklemler",
      "İkinci Dereceden Denklemler",
      "Mutlak Değer",
    ],
    questionTypes: [
      "Verilen ifadeyi hesapla",
      "Hangi ifade eşdeğerdir?",
      "Grafikten yorum yap",
      "Gerçek hayat problemi çöz",
      "İspat / Yanlışlama",
      "Eksik değeri bul",
    ],
  },
  fizik: {
    subtopics: [
      "Newton Yasaları",
      "Enerji Dönüşümleri",
      "Elektrik Devreleri",
      "Manyetik Alan",
      "Dalga Hareketi ve Ses",
      "Optik (Aynalar ve Mercekler)",
      "Termodinamik",
      "Modern Fizik (Fotoelektrik)",
      "Serbest Düşme ve Atış",
      "İvme-Hız Grafikleri",
      "Basınç ve Kaldırma Kuvveti",
      "Basit Harmonik Hareket",
      "Çembersel Hareket",
      "Korunun Yasaları",
      "Elektrostatik",
      "Nükleer Fizik",
    ],
    questionTypes: [
      "Formül uygula ve hesapla",
      "Grafik yorumla",
      "Kavramsal açıklama seç",
      "Günlük hayatta hangi fizik yasası?",
      "Hata analizi yap",
    ],
  },
  kimya: {
    subtopics: [
      "Atom Yapısı ve Periyodik Tablo",
      "Kimyasal Bağlar",
      "Mol Hesapları",
      "Asit-Baz Teorileri",
      "Denge Reaksiyonları",
      "Elektrokimya",
      "Organik Kimya Tepkimeleri",
      "Polimer ve Makromoleküller",
      "Termokimya",
      "Çözünürlük ve Çökelme",
      "Redoks Tepkimeleri",
      "Gaz Yasaları",
      "Stoikiometri",
      "Reaksiyon Hızı",
      "Koordinasyon Bileşikleri",
    ],
    questionTypes: [
      "Kimyasal denklem dengele",
      "Reaksiyon ürününü bul",
      "Kavramsal soru",
      "Mol/kütle hesabı",
      "pH / pOH hesabı",
    ],
  },
  biyoloji: {
    subtopics: [
      "Hücre Yapısı ve Organeller",
      "Mitoz ve Mayoz",
      "Genetik ve Kalıtım",
      "DNA Replikasyonu",
      "Protein Sentezi",
      "Fotosentez ve Solunum",
      "Ekosistem ve Biyom",
      "Evrim Teorisi",
      "Hormonlar ve Sinir Sistemi",
      "İmmün Sistem",
      "Bitki Fizyolojisi",
      "Canlı Sınıflandırması",
      "Sindirim ve Boşaltım",
      "Üreme Sistemleri",
      "Biyoteknoloji",
    ],
    questionTypes: [
      "Kavramsal tanım sorusu",
      "Süreç adımlarını sırala",
      "Grafik / şema yorumla",
      "Yanlış ifadeyi bul",
      "Uygulama sorusu",
    ],
  },
  tarih: {
    subtopics: [
      "Osmanlı Dönemi Siyasi Tarihi",
      "Millî Mücadele",
      "Atatürk İlkeleri",
      "Cumhuriyet Dönemi",
      "Birinci Dünya Savaşı",
      "İkinci Dünya Savaşı",
      "Fransız Devrimi",
      "Sanayi Devrimi",
      "Soğuk Savaş",
      "Orta Çağ Tarihi",
      "Antik Uygarlıklar",
      "Osmanlı Kurumları",
    ],
    questionTypes: [
      "Doğru / yanlış yargısını bul",
      "Kronolojik sıralama",
      "Neden-sonuç ilişkisi kur",
      "Belge/kaynak analizi",
    ],
  },
  edebiyat_dil: {
    subtopics: [
      "Şiir Türleri ve Ölçü",
      "Roman Türleri",
      "Edebi Akımlar",
      "Söz Sanatları",
      "Cümle Yapısı",
      "Paragraf Anlam Analizi",
      "Noktalama ve Yazım Kuralları",
      "Dil Bilgisi (Fiil Çekimleri)",
      "Metin Türleri",
      "Türk Edebiyatı Dönemleri",
    ],
    questionTypes: [
      "Şiiri yorumla",
      "Sanatı tanımla",
      "Parçaya göre cevap",
      "Dilbilgisi seçeneklerini değerlendir",
    ],
  },
  bilisim_yazilim: {
    subtopics: [
      "Algoritma ve Karmaşıklık (Big-O)",
      "Veri Yapıları (Stack, Queue, Tree, Graph)",
      "Nesne Yönelimli Programlama",
      "Fonksiyonel Programlama",
      "REST API Tasarımı",
      "SQL ve NoSQL Veritabanları",
      "Git ve Versiyon Kontrolü",
      "Docker ve Konteynerleşme",
      "Ağ Temelleri (TCP/IP, DNS, HTTP)",
      "Siber Güvenlik Temelleri",
      "Cloud Computing (AWS/GCP/Azure)",
      "Design Patterns",
      "Asenkron Programlama",
      "React/Vue Lifecycle",
      "Linux/Shell Scripting",
      "Machine Learning Temelleri",
      "Makine Öğrenmesi Algoritmaları",
      "DevOps Pipeline",
      "Microservices",
    ],
    questionTypes: [
      "Kod çıktısını bul",
      "Hata ne?",
      "Hangi veri yapısı uygundur?",
      "Kavramsal tanım",
      "En iyi pratik hangisi?",
      "Karmaşıklık analizi",
    ],
  },
  ekonomi_finans: {
    subtopics: [
      "Arz-Talep Dengesi",
      "Fiyat Esnekliği",
      "Piyasa Türleri",
      "Maliye Politikası",
      "Para Politikası",
      "Enflasyon ve Deflasyon",
      "Döviz Kurları",
      "Borsa ve Yatırım Araçları",
      "Muhasebe Temelleri",
      "Maliyet Analizi",
      "Makroekonomi Göstergeleri",
    ],
    questionTypes: [
      "Grafik yorumla",
      "Senaryo analizi",
      "Kavramsal tanım",
      "Hesaplama sorusu",
    ],
  },
  tip_saglik: {
    subtopics: [
      "Kardiyovasküler Sistem",
      "Solunum Sistemi",
      "Farmakoloji Temelleri",
      "Patoloji",
      "Mikrobiyoloji",
      "İmmünoloji",
      "Anatomi",
      "Acil Tıp Protokolleri",
      "Biyokimya",
    ],
    questionTypes: [
      "Tanı sorusu",
      "Tedavi seçimi",
      "Kavramsal açıklama",
      "Vaka analizi",
    ],
  },
  psikoloji_sosyoloji: {
    subtopics: [
      "Bilişsel Gelişim Teorileri",
      "Davranışçılık",
      "Psikanaliz",
      "Sosyal Etki",
      "Kişilik Teorileri",
      "Psikolojik Bozukluklar",
      "Sosyal Tabakalaşma",
      "Kültür ve Toplum",
    ],
    questionTypes: [
      "Teoriyi tanımla",
      "Kavram eşleştir",
      "Senaryo analizi",
      "Araştırma tasarımı",
    ],
  },
  hukuk: {
    subtopics: [
      "Anayasa Hukuku",
      "Ceza Hukuku",
      "Borçlar Hukuku",
      "Ticaret Hukuku",
      "İdare Hukuku",
      "Medeni Hukuk",
      "Avrupa İnsan Hakları",
      "Usul Hukuku",
    ],
    questionTypes: [
      "Doğru hukuki ifadeyi bul",
      "Senaryo analizi",
      "Kavramsal tanım",
      "İstisna / kural sorusu",
    ],
  },
  genel: {
    subtopics: [],
    questionTypes: [
      "Kavramsal soru",
      "Uygulama sorusu",
      "Doğru ifadeyi bul",
      "Senaryo analizi",
    ],
  },
};

/**
 * Diziden n adet rastgele benzersiz eleman seçer.
 */
function pickRandom(arr, n) {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(n, shuffled.length));
}

/**
 * Her çağrıda FARKLI bir "fingerprint" üretir — model aynı soruları tekrar üretmez.
 */
function buildDiversityHint(soruSayisi) {
  const now = new Date();
  const timeBlock = Math.floor(Date.now() / 60000); // her dakika değişir
  const suffix = Math.random().toString(36).slice(2, 8); // 6 rastgele karakter
  return `[session:${timeBlock}-${suffix}]`;
}

/**
 * Ana prompt oluşturucu — domain'e göre özelleşmiş, çeşitlilik garantili.
 */
function buildSmartPrompt({ konu, zorluk, soruSayisi, sourceContext }) {
  const { domain, examType, isEnglish } = analyzeSubject(konu);
  const domainData = DOMAIN_DATA[domain] || DOMAIN_DATA.genel;
  const diversityHint = buildDiversityHint(soruSayisi);

  // Rastgele alt konular seç (maks 5)
  const selectedSubtopics =
    domainData.subtopics.length > 0
      ? pickRandom(domainData.subtopics, Math.min(5, Math.ceil(soruSayisi / 2)))
      : [];

  // Rastgele soru tipleri seç (maks 4)
  const selectedQuestionTypes = pickRandom(domainData.questionTypes, 4);

  // Sınav modu varsa özel talimat
  let examInstruction = "";
  if (examType === "TYT") {
    examInstruction = `
Bu sorular TYT (Temel Yetenek Testi) sınav formatında olmalıdır.
- Lise müfredatı düzeyinde, 4 şıklı, net çözüm adımları olan sorular üret.
- Özellikle sık çıkan konu tiplerini kapsa.`;
  } else if (examType === "AYT") {
    examInstruction = `
Bu sorular AYT (Alan Yetenek Testi) sınav formatında olmalıdır.
- Üniversite hazırlık düzeyinde, derin analiz gerektiren sorular üret.
- ÖSYM tarzı, çok adımlı çözüm gerektiren sorulara yer ver.`;
  }

  // IT alanına özel talimat
  let itInstruction = "";
  if (domain === "bilisim_yazilim") {
    itInstruction = `
Önemli: Yazılım / IT sorularında mümkün olduğunda gerçek KOD SNIPPET'Leri veya
komut satırı örnekleri şıklara dahil et. "Aşağıdaki kodun çıktısı nedir?" veya
"Bu kod neden hata verir?" gibi pratik sorulara ağırlık ver.`;
  }

  // Akademik İngilizce
  let englishInstruction = "";
  if (isEnglish) {
    englishInstruction = `
Tüm soru ve şıkları İNGİLİZCE yaz. Akademik dil seviyesinde (B2-C1) kelime ve
yapılar kullan. Vocabulary in context, reading comprehension, grammar usage ve
academic writing conventions sorularına yer ver.`;
  }

  // Alt konu bloğu
  const subtopicBlock =
    selectedSubtopics.length > 0
      ? `\nŞu alt konulardan soru üret (hepsini kullanmak zorunda değilsin, çeşitlilik için seç): ${selectedSubtopics.join(", ")}.`
      : "";

  // Soru tipi bloğu
  const questionTypeBlock =
    selectedQuestionTypes.length > 0
      ? `\nSoru tiplerini çeşitlendir. Önerilen formatlar: ${selectedQuestionTypes.join("; ")}.`
      : "";

  const pdfSourceBlock = sourceContext
    ? `
PDF KAYNAK METNI (sorulari YALNIZCA bu metne ve konu ozetine dayandir; metinde olmayan bilgi sorma):
"""
${sourceContext.slice(0, 16000)}
"""
`
    : "";

  return `${diversityHint}
Sen bir uzman sınav hazırlayıcısısın. Aşağıdaki kriterlere KESINLIKLE uy:
${pdfSourceBlock}
KONU: ${konu}
ZORLUk SEVİYESİ: ${zorluk}
SORU SAYISI: ${soruSayisi}
${examInstruction}
${itInstruction}
${englishInstruction}
${subtopicBlock}
${questionTypeBlock}

ÇEŞİTLİLİK KURALLARI (çok önemli):
1. Her soru FARKLI bir kavramı test etsin — aynı formülü veya tanımı iki kez sorma.
2. Şıkları (options) birbirine çok benzer yapma; her şık belirgin şekilde farklı olsun.
3. Soru köklerinde çeşitli yapılar kullan: "Hangisi doğrudur?", "Aşağıdakilerden hangisi YANLIŞTIR?", "... hesaplayınız", "... yorumlayınız", "Hangi seçenek eksiktir?".
4. Doğru cevabın her seferinde farklı bir şıkta (A/B/C/D) yer almasına dikkat et.
5. Zorluk seviyesi "${zorluk}" ise bunu her soruda hissettir.

ÇIKTI KURALLARI:
- YALNIZCA aşağıdaki JSON dizisini döndür, başka hiçbir şey yazma.
- Markdown, açıklama veya kod bloğu KULLANMA.
- Her eleman: { "question": "...", "options": ["A", "B", "C", "D"], "answer": "Doğru seçeneğin tam metni" }
- "answer" değeri "options" içindeki bir elemanla BIREBIR aynı olmalı.

[
  {
    "question": "Soru metni?",
    "options": ["A şıkkı", "B şıkkı", "C şıkkı", "D şıkkı"],
    "answer": "Doğru olan şıkkın metni"
  }
]`;
}

// ─────────────────────────────────────────────
// JSON PARSE YARDIMCILARI
// ─────────────────────────────────────────────
function extractQuizJson(text) {
  const cleanedText = text
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();
  try {
    return JSON.parse(cleanedText);
  } catch (_) {
    const start = cleanedText.indexOf("[");
    const end = cleanedText.lastIndexOf("]");
    if (start !== -1 && end !== -1 && end > start) {
      return JSON.parse(cleanedText.slice(start, end + 1));
    }
    throw new Error("AI cevabi gecerli JSON degil.");
  }
}

function normalizeQuestions(rawQuestions) {
  if (!Array.isArray(rawQuestions)) return [];
  return rawQuestions
    .map((item) => {
      const question =
        typeof item?.question === "string" && item.question.trim()
          ? item.question.trim()
          : null;
      const options = Array.isArray(item?.options)
        ? item.options
            .filter((o) => typeof o === "string" && o.trim())
            .map((o) => o.trim())
        : [];
      const answer =
        typeof item?.answer === "string" && item.answer.trim()
          ? item.answer.trim()
          : null;
      if (!question || options.length < 2) return null;
      const safeOptions = options.slice(0, 4);
      const safeAnswer =
        answer && safeOptions.includes(answer) ? answer : safeOptions[0];
      return { question, options: safeOptions, answer: safeAnswer };
    })
    .filter(Boolean);
}

function buildLocalFallbackQuiz({ konu, zorluk, soruSayisi }) {
  const total = Math.max(1, Math.min(15, Number(soruSayisi) || 5));
  return Array.from({ length: total }, (_, i) => {
    const opts = [
      `${konu} - Secenek A`,
      `${konu} - Secenek B`,
      `${konu} - Secenek C`,
      `${konu} - Secenek D`,
    ];
    return {
      question: `${i + 1}. ${konu} konusunda (${zorluk}) temel bir kontrol sorusu hangisidir?`,
      options: opts,
      answer: opts[0],
    };
  });
}

function isDailyQuotaExceeded(error) {
  if (error?.status !== 429) return false;
  const combined =
    `${error?.statusText || ""} ${error?.message || ""} ${JSON.stringify(error?.errorDetails || "")}`.toLowerCase();
  return (
    combined.includes("quota") ||
    combined.includes("resource_exhausted") ||
    combined.includes("daily")
  );
}

// ─────────────────────────────────────────────
// ANA ENDPOINT
// ─────────────────────────────────────────────
app.post("/api/generate-quiz", async (req, res) => {
  try {
    const { konu, zorluk, soruSayisi, sourceContext, category, documentId } =
      req.body;
    const parsedSoruSayisi = Number(soruSayisi);

    if (
      !konu ||
      !zorluk ||
      !Number.isInteger(parsedSoruSayisi) ||
      parsedSoruSayisi < 1
    ) {
      return res.status(400).json({
        error: "Gecersiz istek: konu, zorluk ve soruSayisi zorunludur.",
      });
    }

    // ── Akıllı prompt oluştur ─────────────────
    const prompt = buildSmartPrompt({
      konu,
      zorluk,
      soruSayisi: parsedSoruSayisi,
      sourceContext: typeof sourceContext === "string" ? sourceContext : "",
    });

    let quizData = [];
    let usedModel = "local-fallback";
    let groqError = null;

    // ── 1. Groq dene ──────────────────────────
    try {
      const groqText = await generateQuizWithGroq(prompt);
      quizData = normalizeQuestions(extractQuizJson(groqText));
      quizData = await reviewQuizWithGroq(quizData, { konu, zorluk });
      usedModel = GROQ_MODEL;
    } catch (error) {
      groqError = error;
      console.error("Groq basarisiz, Gemini denenecek:", error);
    }

    // ── 2. Gemini dene ────────────────────────
    if (quizData.length === 0) {
      let geminiError = null;
      if (isGeminiInCooldown()) {
        const kalanSn = Math.ceil((geminiCooldownUntil - Date.now()) / 1000);
        console.warn(`Gemini cooldown aktif (${kalanSn}sn).`);
      } else {
        try {
          const { result, modelName } = await enqueueGeneration(() =>
            generateQuizWithModelFallback(prompt),
          );
          quizData = normalizeQuestions(
            extractQuizJson(result.response.text()),
          );
          usedModel = modelName;
          registerGeminiSuccess();
        } catch (error) {
          geminiError = error;
          console.error("Gemini de basarisiz:", error);
        }
      }
      if (quizData.length === 0 && isDailyQuotaExceeded(geminiError)) {
        return res.status(429).json({
          error: "Gunluk token kotasi bitti. Lutfen yarin tekrar deneyin.",
        });
      }
    }

    // ── 3. Yerel fallback ─────────────────────
    if (quizData.length === 0) {
      console.error(
        "Tum AI secimleri basarisiz, yerel fallback devreye girdi.",
      );
      quizData = buildLocalFallbackQuiz({
        konu,
        zorluk,
        soruSayisi: parsedSoruSayisi,
      });
      usedModel = "local-fallback";
    }

    // ── Zorluk normalize ──────────────────────
    const difficultyMap = { kolay: "kolay", orta: "orta", zor: "zor" };
    const mappedDifficulty =
      difficultyMap[zorluk.toLocaleLowerCase("tr-TR")] || "orta";

    // ── Kaydet ────────────────────────────────
    const quizCategory = sourceContext
      ? konu
      : typeof category === "string" && category.trim()
        ? category.trim()
        : "Yapay Zeka";

    const createdQuiz = await Quiz.create({
      title: konu,
      category: quizCategory,
      difficulty: mappedDifficulty,
      sourceType: sourceContext ? "pdf" : "ai",
      sourceDocument: documentId || undefined,
      questions: quizData.map((q) => ({
        questionText: q.question,
        options: q.options,
        correctAnswer: q.answer,
      })),
    });

    console.log(`Quiz "${konu}" icin ${usedModel} ile olusturuldu.`);
    res.status(200).json({ questions: quizData, quiz: createdQuiz });
  } catch (error) {
    console.error("Quiz uretirken hata:", error);
    const status = error?.status;
    res.status(status === 503 || status === 429 ? 503 : 500).json({
      error:
        status === 503 || status === 429
          ? "Yapay zeka su anda yogun. Biraz bekleyip tekrar deneyin."
          : status === 404
            ? "Yapay zeka modeli bulunamadi."
            : "Soru uretilemedi, lutfen tekrar deneyin.",
    });
  }
});

// ─────────────────────────────────────────────
// SUNUCU
// ─────────────────────────────────────────────
app.get("/", (_req, res) => res.send("Ana sayfa"));

app.listen(5000, () => {
  console.log("Server 5000 portunda calisiyor");
  console.log(
    "API: /api/users | /api/quizzes | /api/scores | /api/documents (PDF) | /api/generate-quiz",
  );
});
