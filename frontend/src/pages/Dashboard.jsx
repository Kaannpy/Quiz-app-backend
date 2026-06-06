import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import { API_BASE } from "../config/api";

const Dashboard = () => {
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const userInfo = JSON.parse(localStorage.getItem("userInfo") || "null");
        if (!userInfo?.token) {
          setFetchError("Paneli görmek için giriş yapmalısınız.");
          return;
        }

        const config = {
          headers: { Authorization: `Bearer ${userInfo.token}` },
        };
        const { data } = await axios.get(
          `${API_BASE}/api/scores/my-scores`,
          config,
        );
        setHistory(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        setFetchError(
          err.response?.data?.message ||
            "Skorlar yüklenemedi. Backend çalışıyor mu kontrol edin.",
        );
      } finally {
        setIsLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const totalCorrect = history.reduce(
    (acc, curr) => acc + (curr.correctAnswers || 0),
    0,
  );
  const totalQs = history.reduce(
    (acc, curr) => acc + (curr.totalQuestions || 0),
    0,
  );
  const generalAvg =
    totalQs > 0 ? Math.round((totalCorrect / totalQs) * 100) : 0;

  const categoryStats = history.reduce((acc, curr) => {
    const key = (curr.category || "Belirtilmemiş").trim();
    if (!key) return acc;
    if (!acc[key])
      acc[key] = {
        name: key,
        totalCorrect: 0,
        totalQs: 0,
        count: 0,
      };
    acc[key].totalCorrect += curr.correctAnswers || 0;
    acc[key].totalQs += curr.totalQuestions || 0;
    acc[key].count += 1;
    return acc;
  }, {});

  const barData = Object.values(categoryStats)
    .map((cat) => ({
      name: cat.name,
      success:
        cat.totalQs > 0
          ? Math.round((cat.totalCorrect / cat.totalQs) * 100)
          : 0,
      count: cat.count,
    }))
    .sort((a, b) => b.count - a.count);

  const COLORS = [
    "#3b82f6",
    "#10b981",
    "#6366f1",
    "#f59e0b",
    "#ec4899",
    "#8b5cf6",
  ];

  if (isLoading) return <div className="p-10 text-center">Yükleniyor...</div>;

  if (fetchError) {
    return (
      <div className="max-w-xl mx-auto p-10 text-center">
        <p className="text-red-600 font-bold mb-4">{fetchError}</p>
        <Link
          to="/login"
          className="inline-block bg-blue-600 text-white px-6 py-3 rounded-xl font-bold"
        >
          Giriş Yap
        </Link>
      </div>
    );
  }

  const isEmpty = history.length === 0;

  return (
    <div className="max-w-6xl mx-auto p-6 lg:p-8">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-black text-slate-800 flex items-center gap-3">
          📊 Gelişim Paneli
        </h2>
        <Link
          to="/panel"
          className="bg-white px-6 py-2 rounded-xl font-bold shadow-sm border hover:bg-slate-50 transition"
        >
          Yeni Sınav +
        </Link>
      </div>

      {isEmpty && (
        <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center mb-8">
          <p className="text-5xl mb-4">📭</p>
          <h3 className="text-xl font-bold text-slate-800 mb-2">
            Henüz sınav geçmişin yok
          </h3>
          <p className="text-slate-600 mb-6">
            Bir quiz çözüp &quot;Sınavı Bitir&quot; dediğinde skorların burada
            görünür. Giriş yapılı olmalısın.
          </p>
          <Link
            to="/panel"
            className="inline-block bg-blue-600 text-white px-8 py-3 rounded-xl font-bold"
          >
            İlk Sınavına Başla
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
          <p className="text-slate-400 text-sm font-bold uppercase mb-1">
            Toplam Sınav
          </p>
          <p className="text-4xl font-black text-blue-600">{history.length}</p>
        </div>
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
          <p className="text-slate-400 text-sm font-bold uppercase mb-1">
            Genel Başarı Oranı
          </p>
          <p className="text-4xl font-black text-emerald-500">%{generalAvg}</p>
        </div>
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
          <p className="text-slate-400 text-sm font-bold uppercase mb-1">
            Doğru Cevap Sayısı
          </p>
          <p className="text-4xl font-black text-slate-800">
            {totalCorrect}{" "}
            <span className="text-slate-300 text-2xl">/ {totalQs}</span>
          </p>
        </div>
      </div>

      {!isEmpty && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 min-h-96">
              <h3 className="text-center font-bold text-slate-700 mb-4">
                Konu Bazlı Başarı (%)
              </h3>
              <div className="overflow-x-auto">
                <div style={{ minWidth: Math.max(320, barData.length * 90), height: 320 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData} margin={{ bottom: 60, left: 0, right: 8, top: 8 }}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#f1f5f9"
                      />
                      <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        interval={0}
                        angle={-35}
                        textAnchor="end"
                        height={70}
                        tick={{ fontSize: 11, fill: "#64748b" }}
                      />
                      <YAxis domain={[0, 100]} axisLine={false} tickLine={false} />
                      <Tooltip
                        cursor={{ fill: "#f8fafc" }}
                        formatter={(value) => [`%${value}`, "Başarı"]}
                        labelFormatter={(label) => `Konu: ${label}`}
                      />
                      <Bar dataKey="success" radius={[10, 10, 0, 0]}>
                        {barData.map((entry, index) => (
                          <Cell
                            key={entry.name}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 h-96 flex flex-col items-center">
              <h3 className="font-bold text-slate-700 mb-6">
                Çalışma Yoğunluğu
              </h3>
              <ResponsiveContainer width="100%" height="80%">
                <PieChart>
                  <Pie
                    data={barData}
                    dataKey="success"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                  >
                    {barData.map((entry, index) => (
                      <Cell
                        key={index}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <h3 className="text-2xl font-black text-slate-800 mb-6">
            Yapay Zeka Analizleri
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.values(categoryStats).map((cat, i) => {
              const avg =
                cat.totalQs > 0
                  ? Math.round((cat.totalCorrect / cat.totalQs) * 100)
                  : 0;
              return (
                <div
                  key={i}
                  className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm"
                >
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-xl font-black text-slate-800">
                      {cat.name}
                    </h4>
                    <span className="text-xl font-black text-slate-800">
                      %{avg}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-3 rounded-full mb-6 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-1000 ${avg >= 75 ? "bg-emerald-500" : avg >= 50 ? "bg-orange-500" : "bg-red-500"}`}
                      style={{ width: `${avg}%` }}
                    ></div>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <p className="text-slate-700 font-medium">
                      {avg >= 75
                        ? "Harika gidiyorsun, bu konuda ustalamışsın! 🏆"
                        : avg >= 50
                          ? "İyisin ama biraz daha pratik fena olmaz. 📚"
                          : "Bu konuda eksiklerin var, konu tekrarı yapmalısın. ⚠️"}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-2 uppercase font-bold tracking-wider">
                      {cat.count} sınavdan gelen verilerle hesaplandı.
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};
export default Dashboard;
