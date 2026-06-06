import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API_BASE } from "../config/api";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { generateCertificatePDF } from "../utils/generateCertificate";

const QuizHistory = () => {
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  const navigate = useNavigate();

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      if (!userInfo) {
        setError("Lütfen önce giriş yapın.");
        setIsLoading(false);
        return;
      }
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      
      const { data } = await axios.get(`${API_BASE}/api/scores/my-scores`, config);
      setHistory(data);
    } catch (err) {
      console.error("Geçmiş çekilemedi:", err);
      setError("Sınav geçmişi yüklenirken bir sorun oluştu.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const deleteHandler = async (id) => {
    if (window.confirm("Bu sınav kaydını kalıcı olarak silmek istediğine emin misin?")) {
      try {
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
        
        await axios.delete(`${API_BASE}/api/scores/${id}`, config);
        fetchHistory(); 
      } catch (err) {
        console.error("Silme hatası:", err);
        alert("Kayıt silinirken bir hata oluştu.");
      }
    }
  };

  const closeModal = () => setSelectedQuiz(null);

 const generatePDF = async () => {
    if (!selectedQuiz || pdfLoading) return;

    setPdfLoading(true);
    try {
      const userInfo = JSON.parse(localStorage.getItem("userInfo"));
      const userName = userInfo?.name || "Aday";
      const successRate = Math.round(
        (selectedQuiz.correctAnswers / selectedQuiz.totalQuestions) * 100,
      );

      await generateCertificatePDF({
        userName,
        category: selectedQuiz.category,
        difficulty: selectedQuiz.difficulty,
        date: new Date(selectedQuiz.createdAt).toLocaleDateString("tr-TR"),
        successRate,
      });
    } catch (err) {
      console.error("PDF oluşturma hatası:", err);
      alert("Sertifika oluşturulurken bir hata oluştu.");
    } finally {
      setPdfLoading(false);
    }
  };

  const chartData = history.slice().reverse().map((item) => {
    const dateObj = new Date(item.createdAt);
    const dateStr = dateObj.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' });
    const timeStr = dateObj.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

    return {
      tarih: `${dateStr} - ${timeStr}`,
      basari: item.totalQuestions > 0 ? Math.round((item.correctAnswers / item.totalQuestions) * 100) : 0,
      kategori: item.category
    };
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6 lg:p-8">
      <div className="mb-8 border-b pb-4 flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-slate-800 flex items-center gap-2">
            📜 Sınav Geçmişim
          </h2>
          <p className="text-slate-500 mt-1 font-medium">Çözdüğün tüm sınavları ve gelişim trendini buradan inceleyebilirsin.</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-2xl mb-6 border border-red-100 font-bold">
          {error}
        </div>
      )}

      {history.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200">
          <p className="text-slate-400 text-lg font-medium">Henüz bir sınav çözmemişsin.</p>
          <button 
            onClick={() => navigate('/panel')}
            className="mt-4 px-8 py-3 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition"
          >
            Hemen Başla 🚀
          </button>
        </div>
      ) : (
        <>
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 mb-10 h-72">
            <h3 className="text-sm font-bold text-slate-400 uppercase mb-4 tracking-wider">Zamana Bağlı Başarı Trendi (%)</h3>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorBasari" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="tarih" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  itemStyle={{ color: '#3b82f6', fontWeight: 'black' }}
                  formatter={(value) => [`%${value}`, 'Başarı Oranı']} 
                />
                <Area type="monotone" dataKey="basari" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorBasari)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-4">
            {history.map((scoreItem) => {
              const successRate = Math.round((scoreItem.correctAnswers / scoreItem.totalQuestions) * 100);
              
              return (
                <div 
                  key={scoreItem._id} 
                  className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center justify-between hover:border-blue-100 transition-all group gap-4"
                >
                  <div className="flex items-center gap-6">
                    <div className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center font-black ${successRate >= 50 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                      <span className="text-lg">%{successRate}</span>
                      <span className="text-[10px] uppercase tracking-tighter">Başarı</span>
                    </div>

                    <div>
                      <h3 className="text-xl font-black text-slate-800">{scoreItem.category}</h3>
                      <div className="flex items-center gap-3 mt-1 text-sm text-slate-400 font-bold uppercase tracking-wide flex-wrap">
                        {scoreItem.category?.startsWith("PDF:") && (
                          <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-md normal-case">
                            PDF
                          </span>
                        )}
                        <span>{new Date(scoreItem.createdAt).toLocaleDateString('tr-TR')} • {scoreItem.difficulty}</span>
                        <span>•</span>
                        <span>{scoreItem.correctAnswers} / {scoreItem.totalQuestions} DOĞRU</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                      <button 
                        onClick={() => setSelectedQuiz(scoreItem)}
                        className="px-5 py-3 bg-slate-50 text-slate-600 font-bold rounded-2xl border border-slate-200 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-all text-sm"
                      >
                        İncele
                      </button>
                
                      <button 
                        onClick={() => deleteHandler(scoreItem._id)}
                        className="w-11 h-11 bg-slate-50 text-slate-400 font-bold rounded-2xl border border-slate-200 hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-all flex items-center justify-center"
                        title="Bu sınavı sil"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {selectedQuiz && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex justify-center items-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
            
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-white z-10">
              <div>
                <h3 className="text-2xl font-black text-slate-800 capitalize">{selectedQuiz.category}</h3>
                <p className="text-slate-500 font-bold text-sm uppercase mt-1">Sınav Analiz Raporu</p>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={generatePDF}
                  disabled={pdfLoading}
                  className="px-4 py-2 bg-blue-50 text-blue-600 font-bold rounded-xl border border-blue-100 hover:bg-blue-600 hover:text-white transition-all flex items-center gap-2 disabled:opacity-50"
                  title="Sonuçları PDF Olarak İndir"
                >
                  <span>📄</span> {pdfLoading ? "Oluşturuluyor..." : "PDF İndir"}
                </button>
                <button 
                  onClick={closeModal}
                  className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-500 hover:bg-red-100 hover:text-red-600 transition-all"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-8 overflow-y-auto space-y-8 bg-slate-50/50">
              
              {!selectedQuiz.details || selectedQuiz.details.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
                  <span className="text-5xl mb-4 block">📜</span>
                  <h4 className="text-xl font-black text-slate-800 mb-2">Detaylar Mevcut Değil</h4>
                  <p className="text-slate-500 font-medium max-w-sm mx-auto">
                    Bu sınav kaydı, hata analiz sistemi devreye alınmadan önce oluşturulmuş. Bu nedenle soru-cevap detaylarını göremiyoruz.
                  </p>
                </div>
              ) : (
                selectedQuiz.details.map((soru, index) => (
                  <div key={index} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-start gap-4 mb-6">
                      <p className="font-black text-slate-800 text-lg leading-snug">
                        <span className="text-blue-600 mr-2">#0{index + 1}</span> 
                        {soru.questionText}
                      </p>
                    </div>

                    <div className="grid gap-3">
                      {soru.options.map((secenek, i) => {
                        const isCorrect = secenek === soru.correctAnswer;
                        const isUser = secenek === soru.userAnswer;
                        
                        let style = "bg-slate-50 border-slate-100 text-slate-500";
                        if (isCorrect) style = "bg-emerald-50 border-emerald-500 text-emerald-800 font-bold ring-2 ring-emerald-100";
                        else if (isUser && !soru.isCorrect) style = "bg-red-50 border-red-500 text-red-800 font-bold";

                        return (
                          <div key={i} className={`p-4 rounded-2xl border-2 flex items-center justify-between ${style}`}>
                            <span>{secenek}</span>
                            {isCorrect && <span className="text-xl">✅</span>}
                            {isUser && !soru.isCorrect && <span className="text-xl">❌</span>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizHistory;