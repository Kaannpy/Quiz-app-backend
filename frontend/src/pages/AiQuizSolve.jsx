import { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { API_BASE } from '../config/api';

const AiQuizSolve = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const quizData = location.state?.questions || null;
  const quizTopic = location.state?.topic || "Yapay Zeka Sınavı";
  const scoreCategory = location.state?.fromPdf
    ? quizTopic
    : location.state?.category || quizTopic;
  const pdfSourceName = location.state?.pdfSourceName || null;
  const existingQuiz = location.state?.quiz || null;
  const quizZorluk = (location.state?.zorluk || location.state?.difficulty || "orta").toLowerCase().trim();

  const [answers, setAnswers] = useState({});
  const [isFinished, setIsFinished] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    if (!quizData) {
      navigate('/panel');
    } else {
      let saniyeBasi = 30;
      
      if (quizZorluk === "kolay") {
        saniyeBasi = 15;
      } else if (quizZorluk === "zor") {
        saniyeBasi = 60;
      }
      
      setTimeLeft(quizData.length * saniyeBasi);
    }
  }, [quizData, navigate, quizZorluk]);

  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0 || isFinished) {
      if (timeLeft === 0 && !isFinished) {
        handleFinishQuiz();
      }
      return;
    }
    const timerId = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timerId);
  }, [timeLeft, isFinished]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const handleOptionSelect = (questionIndex, selectedOption) => {
    if (isFinished) return;
    setAnswers({ ...answers, [questionIndex]: selectedOption });
  };

  const handleFinishQuiz = async () => {
    if (isFinished) return;
    
    let dogruSayisi = 0;
    
    const quizDetails = quizData.map((soru, index) => {
      const userAnswer = answers[index];
      const isCorrect = userAnswer === soru.answer;
      
      if (isCorrect) dogruSayisi += 1;

      return {
        questionText: soru.question,
        options: soru.options,
        correctAnswer: soru.answer,
        userAnswer: userAnswer || "Boş Bırakıldı",
        isCorrect: isCorrect
      };
    });

    setScore(dogruSayisi); 
    setIsFinished(true);  

    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      
      if (userInfo && userInfo.token) {
        const config = {
          headers: { 
            Authorization: `Bearer ${userInfo.token}`,
            "Content-Type": "application/json"
          }
        };

        let gercekQuizId = existingQuiz?._id;

        if (!gercekQuizId) {
          const yeniQuizPaketi = {
            title: quizTopic,
            category: scoreCategory,
            difficulty: quizZorluk,
            questions: quizData.map((soru) => ({
              questionText: soru.question,
              options: soru.options,
              correctAnswer: soru.answer,
            })),
          };
          const quizResponse = await axios.post(
            `${API_BASE}/api/quizzes`,
            yeniQuizPaketi,
            config,
          );
          gercekQuizId = quizResponse.data._id;
        }

        const skorPaketi = {
          quizId: gercekQuizId,
          category: scoreCategory,
          difficulty: quizZorluk,
          score: Math.round((dogruSayisi / quizData.length) * 100),
          correctAnswers: dogruSayisi,
          totalQuestions: quizData.length,
          details: quizDetails,
        };

        await axios.post(`${API_BASE}/api/scores`, skorPaketi, config);
      } else {
        console.warn("Skor kaydedilemedi: giriş yapılmamış.");
      }
    } catch (error) {
      console.error("Kayıt işlemi sırasında hata oluştu:", error);
    }
  };

  if (!quizData) return null; 

  const isDangerTime = timeLeft !== null && timeLeft <= 10 && timeLeft > 0;

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 relative">
      {!isFinished && (
        <div className="sticky top-20 z-40 flex justify-end mb-4 pointer-events-none">
          <div className={`px-6 py-3 rounded-2xl shadow-lg border-2 font-black text-2xl tracking-widest transition-all duration-300 pointer-events-auto flex items-center gap-2 
            ${isDangerTime ? 'bg-red-50 text-red-600 border-red-500 animate-pulse' : 'bg-white text-slate-700 border-slate-200'}`}>
            <span>⏱️</span> {timeLeft !== null ? formatTime(timeLeft) : "00:00"}
          </div>
        </div>
      )}

      <div className="mb-8">
        <Link to="/panel" className="text-blue-600 hover:text-blue-800 font-bold mb-4 inline-block transition-colors">
          &larr; Ana Sayfaya Dön
        </Link>
        <h1 className="text-4xl font-bold text-slate-800 mt-2">✨ {quizTopic}</h1>
        {pdfSourceName && (
          <p className="text-sm text-emerald-600 font-medium mt-1">
            📄 PDF: {pdfSourceName}
          </p>
        )}
        <span className="inline-block mt-2 px-3 py-1 bg-slate-100 text-slate-600 font-bold text-sm rounded-lg uppercase tracking-wider">
          Zorluk: {quizZorluk}
        </span>
      </div>

      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
        {isFinished ? (
          <div className="text-center py-12">
            <h2 className="text-5xl mb-4">🏆</h2>
            <h2 className="text-3xl font-bold text-slate-800 mb-4">Sınav Tamamlandı!</h2>
            <div className="bg-blue-50 text-blue-800 p-6 rounded-2xl inline-block mb-8 border border-blue-100">
              <p className="text-lg mb-2">Toplam Soru: <span className="font-bold">{quizData.length}</span></p>
              <p className="text-lg">Doğru Sayısı: <span className="text-2xl font-black text-blue-600">{score}</span></p>
            </div>
            <div>
              <button 
                onClick={() => navigate('/history')} 
                className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition"
              >
                Raporu ve PDF'i İncele
              </button>
            </div>
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-bold mb-6 border-b border-slate-100 pb-4 text-slate-700">
              Yapay Zeka Tarafından Üretildi ({quizData.length} Soru)
            </h2>
            <div className="space-y-8">
              {quizData.map((soru, index) => (
                <div key={index} className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="font-bold text-lg text-slate-800 mb-5 flex gap-3">
                    <span className="text-blue-600">{index + 1}.</span> 
                    {soru.question}
                  </p>
                  <div className="grid sm:grid-cols-2 gap-3 pl-6">
                    {soru.options.map((secenek, i) => {
                      const isSelected = answers[index] === secenek;
                      return (
                        <div 
                          key={i} 
                          onClick={() => handleOptionSelect(index, secenek)}
                          className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-all duration-200 ${
                            isSelected ? "bg-blue-50 border-blue-500 text-blue-800 shadow-sm" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100" 
                          }`}
                        >
                          <div className={`w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                            isSelected ? "border-blue-500 bg-blue-500" : "border-slate-300"
                          }`}>
                            {isSelected && <div className="w-2.5 h-2.5 bg-white rounded-full"></div>}
                          </div>
                          <span className={isSelected ? "font-semibold" : ""}>{secenek}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
            {quizData.length > 0 && (
              <div className="mt-10 text-center">
                <button 
                  onClick={handleFinishQuiz}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white px-10 py-4 rounded-2xl font-black text-lg shadow-xl transition-transform transform hover:-translate-y-1"
                >
                  Sınavı Bitir ve Sonucu Gör
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AiQuizSolve;
