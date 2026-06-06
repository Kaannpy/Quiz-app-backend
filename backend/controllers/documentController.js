const PdfDocument = require("../models/documentModel");
const {
  extractTextFromPdfBuffer,
  truncateText,
  MIN_TEXT_LENGTH,
} = require("../utils/pdfParser");
const {
  analyzePdfText,
  buildTopicContext,
} = require("../services/documentAiService");

const uploadAndAnalyze = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Lutfen bir PDF dosyasi yukleyin." });
    }

    const { text, pageCount } = await extractTextFromPdfBuffer(req.file.buffer);

    if (!text || text.length < MIN_TEXT_LENGTH) {
      return res.status(400).json({
        message:
          "PDF'den yeterli metin okunamadi. Taranmis (gorsel) PDF'ler desteklenmiyor; metin iceren PDF yukleyin.",
      });
    }

    const analysis = await analyzePdfText(text, req.file.originalname);
    const storedText = truncateText(text);

    const document = await PdfDocument.create({
      user: req.user._id,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      pageCount,
      suggestedTitle: analysis.suggestedTitle,
      generalSummary: analysis.generalSummary,
      topics: analysis.topics,
      textPreview: text.slice(0, 400),
      extractedText: storedText,
      status: "ready",
    });

    res.status(201).json({
      message: "PDF basariyla analiz edildi.",
      document: {
        _id: document._id,
        fileName: document.fileName,
        fileSize: document.fileSize,
        pageCount: document.pageCount,
        suggestedTitle: document.suggestedTitle,
        generalSummary: document.generalSummary,
        topics: document.topics,
        textPreview: document.textPreview,
        createdAt: document.createdAt,
      },
    });
  } catch (error) {
    console.error("PDF analiz hatasi:", error);
    const isPdfReadError =
      error.message?.includes("PDF") ||
      error.message?.includes("pdf") ||
      /invalid pdf/i.test(error.message || "");

    res.status(isPdfReadError ? 400 : 500).json({
      message: error.message || "PDF analiz edilirken hata olustu.",
      error: error.message,
    });
  }
};

const getMyDocuments = async (req, res) => {
  try {
    const documents = await PdfDocument.find({ user: req.user._id })
      .select("-extractedText")
      .sort({ createdAt: -1 })
      .limit(30);

    res.json(documents);
  } catch (error) {
    res.status(500).json({ message: "Belgeler getirilemedi." });
  }
};

const getDocumentById = async (req, res) => {
  try {
    const document = await PdfDocument.findOne({
      _id: req.params.id,
      user: req.user._id,
    }).select("-extractedText");

    if (!document) {
      return res.status(404).json({ message: "Belge bulunamadi." });
    }

    res.json(document);
  } catch (error) {
    res.status(500).json({ message: "Belge getirilemedi." });
  }
};

const getTopicContext = async (req, res) => {
  try {
    const { topicId } = req.params;
    const document = await PdfDocument.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!document) {
      return res.status(404).json({ message: "Belge bulunamadi." });
    }

    const topic = document.topics.id(topicId);
    if (!topic) {
      return res.status(404).json({ message: "Konu bulunamadi." });
    }

    const sourceContext = buildTopicContext(topic, document.extractedText || "");

    res.json({
      topic: {
        _id: topic._id,
        title: topic.title,
        summary: topic.summary,
        keyPoints: topic.keyPoints,
      },
      sourceContext,
      suggestedTitle: document.suggestedTitle,
    });
  } catch (error) {
    res.status(500).json({ message: "Konu baglami olusturulamadi." });
  }
};

module.exports = {
  uploadAndAnalyze,
  getMyDocuments,
  getDocumentById,
  getTopicContext,
};
