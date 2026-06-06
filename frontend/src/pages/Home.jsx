import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { API_BASE } from "../config/api";

const difficultyLabel = (d) => {
  const k = (d || "orta").toLowerCase();
  if (k === "kolay") return "Kolay";
  if (k === "zor") return "Zor";
  return "Orta";
};

const topicVisual = (name) => {
  const key = (name || "").toLowerCase();
  const map = {
    python: { icon: "🐍", bg: "bg-blue-50", ring: "ring-blue-100", text: "text-blue-700" },
    fizik: { icon: "⚛️", bg: "bg-emerald-50", ring: "ring-emerald-100", text: "text-emerald-700" },
    matematik: { icon: "📐", bg: "bg-violet-50", ring: "ring-violet-100", text: "text-violet-700" },
    tarih: { icon: "🏛️", bg: "bg-amber-50", ring: "ring-amber-100", text: "text-amber-700" },
    biyoloji: { icon: "🧬", bg: "bg-teal-50", ring: "ring-teal-100", text: "text-teal-700" },
    türkçe: { icon: "📖", bg: "bg-rose-50", ring: "ring-rose-100", text: "text-rose-700" },
  };
  for (const [k, v] of Object.entries(map)) {
    if (key.includes(k)) return v;
  }
  const colors = [
    { icon: "📚", bg: "bg-indigo-50", ring: "ring-indigo-100", text: "text-indigo-700" },
    { icon: "🎯", bg: "bg-orange-50", ring: "ring-orange-100", text: "text-orange-700" },
    { icon: "💡", bg: "bg-cyan-50", ring: "ring-cyan-100", text: "text-cyan-700" },
  ];
  return colors[(name?.length || 0) % colors.length];
};

const relativeTime = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "Bugün";
  if (days === 1) return "Dün";
  if (days < 7) return `${days} gün önce`;
  return new Date(dateStr).toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
};

const filterByDays = (items, days) => {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return items.filter((i) => new Date(i.createdAt).getTime() >= cutoff);
};

const calcStats = (items) => {
  const totalExams = items.length;
  const totalCorrect = items.reduce((a, s) => a + (s.correctAnswers || 0), 0);
  const totalQuestions = items.reduce((a, s) => a + (s.totalQuestions || 0), 0);
  const successRate =
    totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
  const avgScore =
    totalExams > 0
      ? Math.round(
          items.reduce((a, s) => {
            const r =
              s.totalQuestions > 0
                ? (s.correctAnswers / s.totalQuestions) * 100
                : 0;
            return a + r;
          }, 0) / totalExams,
        )
      : 0;
  return { totalExams, totalQuestions, successRate, avgScore };
};

const pctChange = (current, previous) => {
  if (previous === 0) return current > 0 ? "+100%" : "—";
  const diff = Math.round(((current - previous) / previous) * 100);
  return diff >= 0 ? `+${diff}%` : `${diff}%`;
};

const HomeRightPanel = ({ history, stats, miniChartData }) => (
  <aside className="w-[300px] shrink-0 space-y-5 hidden xl:block">
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
      <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
        ✨ AI Özeti
      </h3>
      {miniChartData.length > 0 && (
        <div className="h-16 mb-4 -mx-1">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={miniChartData}>
              <Line
                type="monotone"
                dataKey="basari"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
      <div className="space-y-3">
        {[
          { label: "Oluşturulan Quiz", value: stats.totalExams, sub: "Bu hafta" },
          { label: "Oluşturulan Soru", value: stats.totalQuestions, sub: "Bu hafta" },
          {
            label: "Doğruluk Oranı",
            value: `%${stats.successRate}`,
            sub: stats.successChange,
            subGreen: true,
          },
          {
            label: "Ortalama Zorluk",
            value: stats.avgDifficulty,
            sub: "Bu hafta",
          },
        ].map((row) => (
          <div key={row.label} className="flex justify-between items-center text-sm">
            <span className="text-slate-500">{row.label}</span>
            <div className="text-right">
              <span className="font-bold text-slate-800">{row.value}</span>
              {row.sub && (
                <span
                  className={`block text-[10px] font-bold ${row.subGreen ? "text-emerald-600" : "text-slate-400"}`}
                >
                  {row.sub}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>

    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-slate-800">Son Aktiviteler</h3>
        <Link to="/history" className="text-xs font-bold text-blue-600 hover:underline">
          Tümünü Gör
        </Link>
      </div>
      {history.length === 0 ? (
        <p className="text-sm text-slate-400">Henüz sınav çözmedin.</p>
      ) : (
        <div className="space-y-3">
          {history.slice(0, 4).map((item) => {
            const rate =
              item.totalQuestions > 0
                ? Math.round((item.correctAnswers / item.totalQuestions) * 100)
                : 0;
            const vis = topicVisual(item.category);
            return (
              <div key={item._id} className="flex items-start gap-3">
                <div
                  className={`w-9 h-9 rounded-xl ${vis.bg} flex items-center justify-center text-sm shrink-0`}
                >
                  {vis.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-slate-800 truncate">{item.category}</p>
                  <p className="text-xs text-slate-400">
                    {item.totalQuestions} soru • {difficultyLabel(item.difficulty)} • {rate}%
                  </p>
                  <p className="text-[10px] text-slate-300 mt-0.5">
                    {relativeTime(item.createdAt)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>

    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-slate-800">Plan Kullanımı</h3>
        <span className="text-xs font-bold text-blue-600">Ücretsiz</span>
      </div>
      <div className="space-y-4">
        {[
          { label: "Quiz", current: stats.totalExams, max: 50, color: "bg-emerald-500" },
          {
            label: "Başarı Hedefi",
            current: stats.successRate,
            max: 100,
            color: "bg-blue-500",
            suffix: "%",
          },
        ].map((bar) => (
          <div key={bar.label}>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-slate-500 font-semibold">{bar.label}</span>
              <span className="font-bold text-slate-800">
                {bar.current}
                {bar.suffix || ""} / {bar.max}
                {bar.suffix || ""}
              </span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full ${bar.color} rounded-full transition-all`}
                style={{ width: `${Math.min(100, (bar.current / bar.max) * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  </aside>
);

const Home = () => {
  const [history, setHistory] = useState([]);
  const [period, setPeriod] = useState(30);
  const userInfo = JSON.parse(localStorage.getItem("userInfo") || "null");
  const firstName = userInfo?.name?.split(" ")[0] || "Kullanıcı";

  useEffect(() => {
    const fetchScores = async () => {
      if (!userInfo?.token) return;
      try {
        const { data } = await axios.get(`${API_BASE}/api/scores/my-scores`, {
          headers: { Authorization: `Bearer ${userInfo.token}` },
        });
        setHistory(Array.isArray(data) ? data : []);
      } catch {
        /* ignore */
      }
    };
    fetchScores();
  }, [userInfo?.token]);

  const filtered = useMemo(() => filterByDays(history, period), [history, period]);
  const prevFiltered = useMemo(
    () =>
      filterByDays(
        history.filter((h) => {
          const t = new Date(h.createdAt).getTime();
          const start = Date.now() - period * 2 * 24 * 60 * 60 * 1000;
          const end = Date.now() - period * 24 * 60 * 60 * 1000;
          return t >= start && t < end;
        }),
        period,
      ),
    [history, period],
  );

  const current = calcStats(filtered);
  const previous = calcStats(prevFiltered);

  const chartData = filtered
    .slice()
    .reverse()
    .map((item) => ({
      tarih: new Date(item.createdAt).toLocaleDateString("tr-TR", {
        day: "numeric",
        month: "short",
      }),
      basari:
        item.totalQuestions > 0
          ? Math.round((item.correctAnswers / item.totalQuestions) * 100)
          : 0,
    }));

  const miniChartData = chartData.slice(-6);

  const categoryCount = filtered.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + 1;
    return acc;
  }, {});
  const popularTopics = Object.entries(categoryCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const weekStats = calcStats(filterByDays(history, 7));
  const stats = {
    ...weekStats,
    avgDifficulty: "Orta",
    successChange: pctChange(weekStats.successRate, previous.successRate),
  };

  const statCards = [
    {
      label: "Oluşturulan Quiz",
      value: current.totalExams,
      change: pctChange(current.totalExams, previous.totalExams),
    },
    {
      label: "Toplam Soru",
      value: current.totalQuestions,
      change: pctChange(current.totalQuestions, previous.totalQuestions),
    },
    {
      label: "Doğruluk Oranı",
      value: `%${current.successRate}`,
      change: pctChange(current.successRate, previous.successRate),
    },
    {
      label: "Ortalama Skor",
      value: current.avgScore,
      change: pctChange(current.avgScore, previous.avgScore),
    },
  ];

  const aiSteps = ["Yükleme", "Analiz", "Konu Çıkarma", "Soru Üretimi", "Tamamlandı"];

  return (
    <div className="p-6 lg:p-8">
      <div className="flex gap-6">
        <div className="flex-1 min-w-0 space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black text-slate-800">
                Merhaba, {firstName} 👋
              </h1>
              <p className="text-slate-500 mt-1 text-sm">
                Yapay zeka ile akıllı quizler oluşturun, öğrenmeyi kolaylaştırın.
              </p>
            </div>
            <Link
              to="/quiz-olustur"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl shadow-sm transition-all text-sm"
            >
              + Yeni Quiz Oluştur
              <span className="text-blue-300 text-xs">▾</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              to="/quiz-olustur"
              className="group bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md hover:border-blue-200 transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-xl">
                    📝
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">Konu ile Quiz Oluştur</h3>
                    <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                      Bir konu girin, AI size özel sorular oluştursun.
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-5 flex justify-end">
                <span className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center group-hover:scale-110 transition-transform">
                  →
                </span>
              </div>
            </Link>

            <Link
              to="/pdf-quiz"
              className="group bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-xl">
                    📄
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">PDF&apos;den Quiz Oluştur</h3>
                    <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                      PDF dosyanızı yükleyin, AI içeriği analiz edip sorular oluştursun.
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-5 flex justify-end">
                <span className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center group-hover:scale-110 transition-transform">
                  →
                </span>
              </div>
            </Link>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-4">AI Süreci</h3>
            <div className="flex flex-wrap gap-1 mb-5 border-b border-slate-100 pb-0">
              {aiSteps.map((step, i) => (
                <span
                  key={step}
                  className={`px-4 py-2.5 text-xs font-bold rounded-t-lg border-b-2 -mb-px ${
                    i === 0
                      ? "border-blue-600 text-blue-600 bg-blue-50/50"
                      : "border-transparent text-slate-400"
                  }`}
                >
                  {i + 1}. {step}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 mb-4">
              <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center text-lg">
                📕
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-800 truncate">
                  Ders_Notu.pdf
                </p>
                <p className="text-xs text-slate-400">PDF yükleyerek başlayın</p>
              </div>
              <Link
                to="/pdf-quiz"
                className="text-xs font-bold text-blue-600 hover:underline shrink-0"
              >
                Yükle →
              </Link>
            </div>
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 mb-4">
              <p className="text-sm text-emerald-800">
                PDF modülü aktif — ders notunuzu yükleyin, yapay zeka konuları çıkarsın
                ve her konudan quiz üretsin.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/pdf-quiz"
                className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50"
              >
                PDF Yükle
              </Link>
              <Link
                to="/quiz-olustur"
                className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 flex items-center gap-1"
              >
                Soru Üretimine Başla →
              </Link>
            </div>
          </div>

          <div>
            <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
              <h3 className="font-bold text-slate-800 text-lg">Performans Özeti</h3>
              <select
                value={period}
                onChange={(e) => setPeriod(Number(e.target.value))}
                className="text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-blue-300"
              >
                <option value={7}>Son 7 Gün</option>
                <option value={30}>Son 30 Gün</option>
                <option value={90}>Son 90 Gün</option>
              </select>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              {statCards.map((card) => (
                <div
                  key={card.label}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm"
                >
                  <p className="text-xs text-slate-400 font-semibold">{card.label}</p>
                  <div className="flex items-end justify-between mt-2">
                    <p className="text-2xl font-black text-slate-800">{card.value}</p>
                    {card.change !== "—" && (
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                        {card.change}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              {chartData.length > 0 ? (
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="homeGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis
                        dataKey="tarih"
                        tick={{ fontSize: 11, fill: "#94a3b8" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        domain={[0, 100]}
                        tick={{ fontSize: 11, fill: "#94a3b8" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        formatter={(v) => [`%${v}`, "Başarı"]}
                        contentStyle={{ borderRadius: 12, border: "none", fontSize: 12 }}
                      />
                      <Area
                        type="monotone"
                        dataKey="basari"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        fill="url(#homeGrad)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-center text-slate-400 py-12 text-sm">
                  Bu dönemde henüz sınav verisi yok.
                </p>
              )}
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-800 text-lg">Popüler Konular</h3>
              <Link to="/history" className="text-sm font-bold text-blue-600 hover:underline">
                Tümünü Gör
              </Link>
            </div>
            {popularTopics.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {popularTopics.map(([name, count]) => {
                  const vis = topicVisual(name);
                  return (
                    <div
                      key={name}
                      className={`bg-white border border-slate-200 rounded-2xl p-4 shadow-sm ring-1 ${vis.ring} hover:shadow-md transition-shadow`}
                    >
                      <div
                        className={`w-10 h-10 rounded-xl ${vis.bg} flex items-center justify-center text-lg mb-3`}
                      >
                        {vis.icon}
                      </div>
                      <p className={`font-bold text-sm truncate ${vis.text}`}>{name}</p>
                      <p className="text-xs text-slate-400 mt-1">{count} quiz</p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-8 text-center">
                <p className="text-sm text-slate-400">
                  Quiz çözdükçe popüler konularınız burada görünecek.
                </p>
                <Link
                  to="/quiz-olustur"
                  className="inline-block mt-3 text-sm font-bold text-blue-600 hover:underline"
                >
                  İlk quizinizi oluşturun →
                </Link>
              </div>
            )}
          </div>
        </div>

        <HomeRightPanel history={history} stats={stats} miniChartData={miniChartData} />
      </div>
    </div>
  );
};

export default Home;
