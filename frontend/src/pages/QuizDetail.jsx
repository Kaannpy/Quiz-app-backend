import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { API_BASE } from '../config/api';

const QuizDetail = () => {
  const { id } = useParams();
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [isFinished, setIsFinished] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const response = await axios.get(`${API_BASE}/api/quizzes/${id}`);
        setQuiz(response.data); 
      } catch (error) {
        console.error("Sınav soruları gelirken hata oldu:", error);
      }
    };
    fetchQuiz();
  }, [id]);

  const handleOptionSelect = (questionId, selectedOption) => {
    if (isFinished) return;
    setAnswers({
      ...answers, 
      [questionId]: selectedOption 
    });
  };

  const handleFinishQuiz = async () => {
    let dogruSayisi = 0;
    quiz.questions.forEach((soru) => {
      if(answers[soru._id] === soru.correctAnswer) {
        dogruSayisi += 1;
      }
    });
    setScore(dogruSayisi); 
    setIsFinished(true);  

     try {
      const userInfo= JSON.parse(localStorage.getItem("userInfo"));
      if(userInfo && userInfo.token) {
        const skorPaketi={
          quizId: quiz._id,
          score: dogruSayisi,
          difficulty: quiz.difficulty||"Orta",
          category: quiz.category || quiz.title,
          correctAnswers: dogruSayisi,
          totalQuestions: quiz.questions.length
        }
        const config={
          headers:{
            Authorization: `Bearer ${userInfo.token}`,
            "Content-Type": "application/json"
          }
        }
        const response=await axios.post(`${API_BASE}/api/scores`, skorPaketi, config);
        console.log("Skor kaydedildi:", response.data);
      }
      else {
        console.warn("Kullanıcı girişi bulunamadı, skor kaydedilemedi.");
      }
      } catch (error) {
        console.error("Skor kaydedilirken hata oldu:", error);  

     }
  };

  if (!quiz) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-2xl text-slate-500 animate-pulse">Sınav Hazırlanıyor... ⏳</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="mb-8">
        <Link to="/panel" className="text-blue-600 hover:text-blue-800 font-bold mb-4 inline-block transition-colors">
          &larr; Ana Sayfaya Dön
        </Link>
        <h1 className="text-4xl font-bold text-slate-800 mt-2">{quiz.title}</h1>
      </div>

      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
        {isFinished ? (
          <div className="text-center py-12">
            <h2 className="text-5xl mb-4">🏆</h2>
            <h2 className="text-3xl font-bold text-slate-800 mb-4">Sınav Tamamlandı!</h2>
            <div className="bg-blue-50 text-blue-800 p-6 rounded-2xl inline-block mb-8 border border-blue-100">
              <p className="text-lg mb-2">Toplam Soru: <span className="font-bold">{quiz.questions.length}</span></p>
              <p className="text-lg">Doğru Sayısı: <span className="text-2xl font-black text-blue-600">{score}</span></p>
            </div>
            <div>
              <button 
                onClick={() => { setIsFinished(false); setAnswers({}); }} 
                className="text-slate-500 hover:text-slate-800 underline font-medium"
              >
                Sınavı Tekrar Çöz
              </button>
            </div>
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-bold mb-6 border-b border-slate-100 pb-4 text-slate-700">
              Sınav İçeriği ({quiz.questions?.length || 0} Soru)
            </h2>
            <div className="space-y-8">
              {quiz.questions.map((soru, index) => (
                <div key={soru._id || index} className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="font-bold text-lg text-slate-800 mb-5 flex gap-3">
                    <span className="text-blue-600">{index + 1}.</span> 
                    {soru.questionText}
                  </p>
                  <div className="grid sm:grid-cols-2 gap-3 pl-6">
                    {soru.options.map((secenek, i) => {
                      const isSelected = answers[soru._id] === secenek;
                      return (
                        <div 
                          key={i} 
                          onClick={() => handleOptionSelect(soru._id, secenek)}
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
            {quiz.questions?.length > 0 && (
              <div className="mt-10 text-center">
                <button 
                  onClick={handleFinishQuiz}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold text-lg shadow-md transition-transform transform hover:scale-105"
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

export default QuizDetail;
