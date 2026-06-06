import AiQuizForm from "../components/AiQuizForm";
import { Link } from "react-router-dom";

const QuizCreate = () => {
  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-black text-slate-800">Quiz Oluştur</h1>
          <p className="text-slate-500 mt-1 text-sm">
            Bir konu girin, AI size özel sorular oluştursun.
          </p>
        </div>
        <Link
          to="/pdf-quiz"
          className="inline-flex items-center gap-2 border border-slate-200 bg-white text-slate-700 font-bold px-4 py-2.5 rounded-xl text-sm hover:bg-slate-50"
        >
          📄 PDF&apos;den Oluştur
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-xl shrink-0">
              📝
            </div>
            <div>
              <h2 className="font-bold text-slate-800">Konu ile Quiz Oluştur</h2>
              <p className="text-sm text-slate-500 mt-0.5">
                Konu, zorluk ve soru sayısını belirleyin.
              </p>
            </div>
          </div>
          <AiQuizForm embedded />
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-3">✨ Nasıl Çalışır?</h3>
            <ol className="text-sm text-slate-600 space-y-2.5">
              {[
                "Konu başlığını yazın",
                "Zorluk ve soru sayısını seçin",
                "AI soruları üretir",
                "Sınavı çözün, skorunuz kaydedilir",
              ].map((step, i) => (
                <li key={step} className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </div>

          <div className="bg-blue-50 rounded-2xl border border-blue-100 p-5">
            <h3 className="font-bold text-blue-800 mb-2 text-sm">Adaptif Zorluk</h3>
            <p className="text-sm text-blue-700 leading-relaxed">
              Daha önce çözdüğünüz konularda sistem otomatik zorluk önerisi sunar.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-2 text-sm">AI Motoru</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Groq + Gemini yedekleme ile kesintisiz soru üretimi.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizCreate;
