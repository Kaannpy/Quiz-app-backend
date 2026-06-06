import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { API_BASE } from "../config/api";

const STEPS = [
  "Yükleme",
  "Analiz",
  "Konu Çıkarma",
  "Soru Üretimi",
  "Tamamlandı",
];

const PdfQuiz = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [step, setStep] = useState(0);
  const [file, setFile] = useState(null);
  const [document, setDocument] = useState(null);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [sourceContext, setSourceContext] = useState("");
  const [difficulty, setDifficulty] = useState("Orta");
  const [questionCount, setQuestionCount] = useState(5);
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [loadingContext, setLoadingContext] = useState(false);
  const [error, setError] = useState("");
  const [quizPayload, setQuizPayload] = useState(null);

  const userInfo = JSON.parse(localStorage.getItem("userInfo") || "null");

  const getAuthConfig = () => ({
    headers: { Authorization: `Bearer ${userInfo.token}` },
  });

  const handleFileSelect = (selected) => {
    if (!selected) return;
    if (selected.type !== "application/pdf") {
      setError("Lütfen sadece PDF dosyası seçin.");
      return;
    }
    if (selected.size > 12 * 1024 * 1024) {
      setError("Dosya boyutu en fazla 12 MB olabilir.");
      return;
    }
    setFile(selected);
    setError("");
    setStep(0);
  };

  const handleUpload = async () => {
    if (!userInfo?.token) {
      setError("PDF yüklemek için giriş yapmalısınız.");
      return;
    }
    if (!file) {
      setError("Lütfen bir PDF seçin.");
      return;
    }

    setUploading(true);
    setError("");
    setStep(1);

    try {
      const formData = new FormData();
      formData.append("pdf", file);

      const { data } = await axios.post(
        `${API_BASE}/api/documents/upload`,
        formData,
        getAuthConfig(),
      );

      setDocument(data.document);
      setStep(2);
    } catch (err) {
      const serverMsg =
        err.response?.data?.message || err.response?.data?.error;
      if (err.response?.status === 401) {
        setError("Oturumunuz sonlanmış. Lütfen tekrar giriş yapın.");
      } else if (!err.response) {
        setError(
          "Sunucuya bağlanılamadı. Backend'in (port 5000) çalıştığından emin olun.",
        );
      } else {
        setError(serverMsg || "PDF analiz edilirken bir hata oluştu.");
      }
      setStep(0);
    } finally {
      setUploading(false);
    }
  };

  const handleTopicSelect = async (topic) => {
    setSelectedTopic(topic);
    setLoadingContext(true);
    setError("");

    try {
      const { data } = await axios.get(
        `${API_BASE}/api/documents/${document._id}/topics/${topic._id}/context`,
        getAuthConfig(),
      );
      setSourceContext(data.sourceContext);
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.message || "Konu detayı alınamadı.");
    } finally {
      setLoadingContext(false);
    }
  };

  const handleGenerateQuiz = async () => {
    if (!selectedTopic || !sourceContext) return;

    setGenerating(true);
    setError("");

    try {
      const payload = {
        konu: selectedTopic.title,
        zorluk: difficulty,
        soruSayisi: Number(questionCount),
        sourceContext,
        category: selectedTopic.title,
        documentId: document._id,
      };

      const { data } = await axios.post(`${API_BASE}/api/generate-quiz`, payload);
      const questions = data?.questions || data;

      setQuizPayload({
        questions,
        topic: selectedTopic.title,
        difficulty,
        quiz: data?.quiz,
        category: selectedTopic.title,
        pdfSourceName: document.suggestedTitle || document.fileName,
      });
      setStep(4);

      setTimeout(() => {
        navigate("/ai-quiz-solve", {
          state: {
            questions,
            topic: selectedTopic.title,
            difficulty,
            quiz: data?.quiz,
            category: selectedTopic.title,
            pdfSourceName: document.suggestedTitle || document.fileName,
            fromPdf: true,
          },
        });
      }, 1500);
    } catch (err) {
      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Quiz üretilirken hata oluştu.",
      );
    } finally {
      setGenerating(false);
    }
  };

  const resetWizard = () => {
    setStep(0);
    setFile(null);
    setDocument(null);
    setSelectedTopic(null);
    setSourceContext("");
    setQuizPayload(null);
    setError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-black text-slate-800">PDF&apos;den Quiz Oluştur</h1>
          <p className="text-slate-500 mt-1 text-sm">
            PDF dosyanızı yükleyin, AI içeriği analiz edip sorular oluştursun.
          </p>
        </div>
        <Link
          to="/quiz-olustur"
          className="inline-flex items-center gap-2 border border-slate-200 bg-white text-slate-700 font-bold px-4 py-2.5 rounded-xl text-sm hover:bg-slate-50"
        >
          ✨ Konu ile Oluştur
        </Link>
      </div>

      <div className="flex flex-wrap gap-1 mb-6 border-b border-slate-100">
        {STEPS.map((label, index) => (
          <div
            key={label}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 text-xs sm:text-sm font-bold rounded-t-lg border-b-2 -mb-px transition-all ${
              step === index
                ? "border-blue-600 text-blue-600 bg-blue-50/50"
                : step > index
                  ? "border-transparent text-emerald-600"
                  : "border-transparent text-slate-400"
            }`}
          >
            <span
              className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] ${
                step > index
                  ? "bg-emerald-500 text-white"
                  : step === index
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100"
              }`}
            >
              {step > index ? "✓" : index + 1}
            </span>
            {label}
          </div>
        ))}
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 font-medium">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {step === 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 lg:p-8 shadow-sm">
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  handleFileSelect(e.dataTransfer.files[0]);
                }}
                className="border-2 border-dashed border-slate-200 rounded-2xl p-10 text-center cursor-pointer hover:border-blue-300 hover:bg-blue-50/30 transition-all"
              >
                <div className="text-5xl mb-4">📎</div>
                <p className="text-lg font-bold text-slate-700 mb-2">
                  PDF dosyanızı sürükleyin veya tıklayın
                </p>
                <p className="text-sm text-slate-500">
                  Maksimum 12 MB · Metin içeren PDF (taranmış belgeler desteklenmez)
                </p>
                {file && (
                  <p className="mt-4 text-blue-700 font-semibold bg-blue-50 inline-block px-4 py-2 rounded-lg">
                    Seçildi: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(e) => handleFileSelect(e.target.files[0])}
              />

              <button
                onClick={handleUpload}
                disabled={!file || uploading}
                className={`w-full mt-6 py-4 rounded-xl font-bold text-lg text-white transition-all ${
                  uploading || !file
                    ? "bg-slate-400"
                    : "bg-blue-600 hover:bg-blue-700 shadow-sm"
                }`}
              >
                Yüklemeye Başla →
              </button>
            </div>
          )}

          {step === 1 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-10 shadow-sm text-center">
              <div className="animate-spin rounded-full h-14 w-14 border-t-2 border-b-2 border-blue-500 mx-auto mb-6" />
              <h2 className="text-xl font-bold text-slate-800 mb-2">PDF Analiz Ediliyor</h2>
              <p className="text-slate-500 text-sm">
                Yapay zeka belgenizi okuyor, konuları ve özeti çıkarıyor...
              </p>
              {file && (
                <p className="mt-4 text-sm text-blue-600 font-medium">{file.name}</p>
              )}
            </div>
          )}

          {step === 2 && document && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 lg:p-8 shadow-sm">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">
                    {document.suggestedTitle || document.fileName}
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">
                    {document.pageCount ? `${document.pageCount} sayfa · ` : ""}
                    {document.topics?.length || 0} konu bulundu
                  </p>
                </div>
                <button
                  onClick={resetWizard}
                  className="text-sm text-slate-500 hover:text-blue-600 font-bold"
                >
                  Yeni PDF
                </button>
              </div>

              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 mb-6">
                <p className="text-sm text-emerald-800 font-medium">
                  ✓ Analiz tamamlandı — bir konu seçin, otomatik olarak soru üretimine geçilecek.
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 mb-6">
                <h3 className="font-bold text-blue-800 mb-2">Genel Özet</h3>
                <p className="text-slate-700 leading-relaxed text-sm">
                  {document.generalSummary}
                </p>
              </div>

              <h3 className="font-bold text-slate-800 mb-4">Konu Seçin</h3>

              <div className="grid gap-3">
                {document.topics?.map((topic) => (
                  <button
                    key={topic._id}
                    onClick={() => handleTopicSelect(topic)}
                    disabled={loadingContext}
                    className={`text-left p-4 rounded-xl border transition-all hover:shadow-sm ${
                      selectedTopic?._id === topic._id
                        ? "border-blue-400 bg-blue-50"
                        : "border-slate-200 bg-slate-50 hover:border-blue-200"
                    }`}
                  >
                    <h4 className="font-bold text-slate-800 mb-1">{topic.title}</h4>
                    <p className="text-slate-600 text-sm line-clamp-2 mb-2">
                      {topic.summary}
                    </p>
                    <span className="inline-block text-blue-600 font-bold text-sm">
                      {loadingContext && selectedTopic?._id === topic._id
                        ? "Hazırlanıyor..."
                        : "Seç ve devam et →"}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && selectedTopic && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 lg:p-8 shadow-sm">
              <button
                onClick={() => setStep(2)}
                className="text-blue-600 font-bold mb-4 hover:underline text-sm"
              >
                ← Konu listesine dön
              </button>

              <h2 className="text-xl font-bold text-slate-800 mb-2">
                {selectedTopic.title}
              </h2>
              <p className="text-slate-600 mb-6 text-sm">{selectedTopic.summary}</p>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Zorluk Seviyesi
                  </label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-400 outline-none"
                  >
                    <option value="Kolay">Kolay 🟢</option>
                    <option value="Orta">Orta 🟡</option>
                    <option value="Zor">Zor 🔴</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Soru Sayısı
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={15}
                    value={questionCount}
                    onChange={(e) => setQuestionCount(e.target.value)}
                    className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-400 outline-none"
                  />
                </div>
              </div>

              <button
                onClick={handleGenerateQuiz}
                disabled={generating}
                className={`w-full py-4 rounded-xl font-bold text-lg text-white ${
                  generating ? "bg-slate-400" : "bg-blue-600 hover:bg-blue-700 shadow-sm"
                }`}
              >
                {generating ? "Sorular üretiliyor..." : "Quiz Üret →"}
              </button>
            </div>
          )}

          {step === 4 && (
            <div className="bg-white rounded-2xl border border-emerald-200 p-10 shadow-sm text-center">
              <div className="text-5xl mb-4">✅</div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Tamamlandı!</h2>
              <p className="text-slate-600 mb-2">
                {quizPayload?.topic} konusundan quiz hazır.
              </p>
              <p className="text-sm text-blue-600 font-medium animate-pulse">
                Sınava yönlendiriliyorsunuz...
              </p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-3">📄 AI Süreci</h3>
            <ol className="text-sm text-slate-600 space-y-2">
              {STEPS.map((s, i) => (
                <li
                  key={s}
                  className={`flex items-center gap-2 ${
                    step >= i ? "text-slate-800 font-medium" : "text-slate-400"
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full text-[10px] flex items-center justify-center ${
                      step > i
                        ? "bg-emerald-500 text-white"
                        : step === i
                          ? "bg-blue-600 text-white"
                          : "bg-slate-100"
                    }`}
                  >
                    {step > i ? "✓" : i + 1}
                  </span>
                  {s}
                </li>
              ))}
            </ol>
          </div>

          {document && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-bold text-slate-800 mb-2 text-sm">Yüklenen Belge</h3>
              <p className="text-sm text-slate-600 font-medium truncate">
                {document.suggestedTitle || document.fileName}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {document.topics?.length || 0} konu tespit edildi
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PdfQuiz;
