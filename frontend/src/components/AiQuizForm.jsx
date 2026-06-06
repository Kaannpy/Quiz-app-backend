import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API_BASE } from "../config/api"; 

const AiQuizForm = ({ onQuizCreated, embedded = false }) => {
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState("Orta"); 
  const [questionCount, setQuestionCount] = useState(5);
  const [isLoading, setIsLoading] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [recommendationMsg, setRecommendationMsg] = useState("");

  const navigate = useNavigate();

  const highlightDifficulty = (text) => {
    if (!text) return text;
    const parts = text.split(/(zor|kolay|orta)/i);
    
    return parts.map((part, index) => {
      if (/^(zor|kolay|orta)$/i.test(part)) {
        return (
          <span 
            key={index} 
            className="font-black text-indigo-800 bg-indigo-100 px-2 py-0.5 mx-0.5 rounded-md uppercase tracking-wide border border-indigo-200 shadow-sm inline-block"
          >
            {part}
          </span>
        );
      }
      return part;
    });
  };

  const handleDifficultySuggestion = async (categoryName) => {
    if (!categoryName || categoryName.length < 3) return;

    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      
      const { data } = await axios.get(
        `${API_BASE}/api/scores/recommendation/${categoryName}`, 
        config
      );

      const formattedDiff = data.recommendedDifficulty.charAt(0).toUpperCase() + data.recommendedDifficulty.slice(1);
      setDifficulty(formattedDiff); 
      setRecommendationMsg(data.message); 

    } catch (err) {
      console.error("Öneri alınırken hata oluştu", err);
    }
  };

  const handleGenerateQuiz = async (e) => {
    e.preventDefault();
    if (isLoading) return;
    setErrorText("");

    if (!topic.trim()) {
      alert("Lütfen bir konu seçin.");
      return;
    }

    setIsLoading(true);

    const siparisDetayi = {
      konu: topic,
      zorluk: difficulty,
      soruSayisi: questionCount
    };

    try {
      const response = await axios.post(`${API_BASE}/api/generate-quiz`, siparisDetayi);
      const tazeSorular = response.data?.questions || response.data;
      const olusanQuiz = response.data?.quiz;

      if (olusanQuiz && onQuizCreated) {
        onQuizCreated(olusanQuiz);
      }

      navigate('/ai-quiz-solve', { 
        state: { 
          questions: tazeSorular, 
          topic: topic,
          difficulty: difficulty,
          quiz: olusanQuiz,
          category: topic,
        } 
      });

    } catch (error) {
      setErrorText("Yapay zeka şu an meşgul, lütfen tekrar deneyin.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={
        embedded
          ? "bg-white p-6 lg:p-8 rounded-2xl border border-slate-200 shadow-sm"
          : "max-w-2xl mx-auto bg-white p-8 rounded-3xl shadow-lg border border-slate-100"
      }
    >
      {!embedded && (
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600">
            ✨ Yapay Zeka ile Quiz Üret
          </h2>
          <p className="text-slate-500 mt-2">Hangi konuda kendini test etmek istersin?</p>
        </div>
      )}

      <form onSubmit={handleGenerateQuiz} className="space-y-6">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Konu Başlığı</label>
          <input
            type="text"
            placeholder="Örn: Matematik, Python, Tarih..."
            className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onBlur={() => handleDifficultySuggestion(topic)}
          />
          
          {recommendationMsg && (
            <div className="mt-4 relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4 border border-indigo-100 shadow-sm transition-all duration-500 animate-in fade-in slide-in-from-top-2">
              
              <div className="absolute -right-4 -top-4 w-16 h-16 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-60 animate-pulse"></div>
              <div className="absolute -left-4 -bottom-4 w-16 h-16 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl opacity-60 animate-pulse" style={{ animationDelay: '1s' }}></div>

              <div className="relative flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center shadow-md shadow-purple-200 mt-0.5">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                  </svg>
                </div>
                
                <div>
                  <h4 className="text-sm font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-700 to-indigo-700 mb-0.5">
                    Adaptif Zorluk Önerisi
                  </h4>
                  <p className="text-sm text-slate-600 leading-relaxed font-medium">
                    {highlightDifficulty(recommendationMsg)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Zorluk Seviyesi</label>
            <select
              className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
            >
              <option value="Kolay">Kolay 🟢</option>
              <option value="Orta">Orta 🟡</option>
              <option value="Zor">Zor 🔴</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Soru Sayısı</label>
            <input
              type="number"
              min="1"
              max="15"
              className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
              value={questionCount}
              onChange={(e) => setQuestionCount(e.target.value)}
            />
          </div>
        </div>

        {errorText && (
          <div className="p-4 bg-red-50 text-red-600 rounded-xl font-medium border border-red-100">
            {errorText}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className={`w-full py-4 rounded-xl font-bold text-lg text-white shadow-sm transition-all duration-300 ${
            isLoading
              ? "bg-slate-400"
              : "bg-blue-600 hover:bg-blue-700 hover:shadow-md"
          }`}
        >
          {isLoading ? "Hazırlanıyor..." : "✨ Quiz Üret"}
        </button>
      </form>
    </div>
  );
}

export default AiQuizForm;