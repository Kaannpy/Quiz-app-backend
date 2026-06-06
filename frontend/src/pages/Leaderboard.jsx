import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { API_BASE } from "../config/api";
import UserAvatar from "../components/UserAvatar";

const RANK_STYLES = {
  1: "bg-amber-50 border-amber-200 text-amber-700",
  2: "bg-slate-100 border-slate-200 text-slate-600",
  3: "bg-orange-50 border-orange-200 text-orange-700",
};

const RANK_MEDALS = { 1: "🥇", 2: "🥈", 3: "🥉" };

const TIER_DISPLAY = [
  { key: "zor", label: "Zor", dot: "bg-red-500" },
  { key: "orta", label: "Orta", dot: "bg-amber-500" },
  { key: "kolay", label: "Kolay", dot: "bg-emerald-500" },
];

const DifficultyMix = ({ entry }) => {
  const breakdown = entry?.difficultyBreakdown;
  if (!breakdown) return null;

  const totalQ =
    breakdown.kolay.questions +
    breakdown.orta.questions +
    breakdown.zor.questions;
  if (totalQ === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
      {TIER_DISPLAY.filter((t) => breakdown[t.key].questions > 0).map((t) => (
        <span
          key={t.key}
          className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full"
          title={`${breakdown[t.key].exams} sınav, ${breakdown[t.key].questions} soru`}
        >   
          <span className={`w-2 h-2 rounded-full ${t.dot}`}></span>
          {t.label} {breakdown[t.key].questions}
        </span>
      ))}
          

    
    </div>
  );
};

const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [currentUserRank, setCurrentUserRank] = useState(null);
  const [currentUserStats, setCurrentUserStats] = useState(null);
  const [totalStudents, setTotalStudents] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");

  const userInfo = JSON.parse(localStorage.getItem("userInfo") || "null");
  const currentUser =
    leaderboard.find((e) => e.isCurrentUser) || currentUserStats;

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        if (!userInfo?.token) {
          setFetchError("Liderlik tablosunu görmek için giriş yapmalısınız.");
          return;
        }

        const { data } = await axios.get(`${API_BASE}/api/scores/leaderboard`, {
          headers: { Authorization: `Bearer ${userInfo.token}` },
        });

        setLeaderboard(data.leaderboard || []);
        setCurrentUserRank(data.currentUserRank ?? null);
        setCurrentUserStats(data.currentUserStats ?? null);
        setTotalStudents(data.totalStudents ?? 0);
      } catch (err) {
        setFetchError(
          err.response?.data?.message ||
            "Liderlik tablosu yüklenemedi. Backend çalışıyor mu kontrol edin.",
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  const topThree = leaderboard.slice(0, 3);

  if (isLoading) {
    return (
      <div className="p-10 text-center text-slate-500 font-medium animate-pulse">
        Sıralama yükleniyor...
      </div>
    );
  }

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

  return (
    <div className="max-w-5xl mx-auto p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-black text-slate-800 flex items-center gap-3">
            🏆 Liderlik Tablosu
          </h2>
          <p className="text-slate-500 mt-1 font-medium">
            Performans puanı: başarı oranı + zorluk bonusu (Zor quizler daha değerli)
          </p>
        </div>
        <Link
          to="/panel"
          className="bg-white px-6 py-2 rounded-xl font-bold shadow-sm border hover:bg-slate-50 transition text-center"
        >
          Quiz Çöz +
        </Link>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-2xl px-5 py-4 mb-8 text-sm text-slate-700 space-y-2">
        <p className="font-bold text-blue-800">Nasıl sıralanıyorsun?</p>
        <p>
          Her soru, bulunduğu quizin zorluğuna göre <strong>çarpanla</strong> sayılır:
          Kolay <strong>×1</strong> · Orta <strong>×1,4</strong> · Zor <strong>×1,85</strong>.
          Zor quizdeki doğru cevaplar daha fazla performans puanı getirir.
        </p>
        <p>
          Aynı başarı yüzdesinde olsan bile daha çok <strong>zor soru</strong> çözen (
          <span className="inline-flex items-center gap-0.5 font-bold text-orange-700">
            🔥 Daha çok zor soru
          </span>
          ) üst sıralarda yer alır; listede kaç zor/orta/kolay soru çözdüğün görünür.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <p className="text-slate-400 text-sm font-bold uppercase mb-1">
            Toplam Öğrenci
          </p>
          <p className="text-4xl font-black text-blue-600">{totalStudents}</p>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <p className="text-slate-400 text-sm font-bold uppercase mb-1">
            Senin Sıran
          </p>
          <p className="text-4xl font-black text-indigo-600">
            {currentUserRank ? `#${currentUserRank}` : "—"}
          </p>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <p className="text-slate-400 text-sm font-bold uppercase mb-1">
            Performans Puanın
          </p>
          <p className="text-4xl font-black text-violet-600">
            {currentUser?.performanceScore ?? 0}
          </p>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <p className="text-slate-400 text-sm font-bold uppercase mb-1">
            Başarı Oranın
          </p>
          <p className="text-4xl font-black text-emerald-500">
            %{currentUser?.successRate ?? 0}
          </p>
        </div>
      </div>

      {currentUser?.difficultyBreakdown && (
        <div className="bg-white rounded-2xl border border-slate-100 px-5 py-4 mb-8">
          <p className="text-xs font-bold text-slate-500 uppercase mb-2">
            Senin soru dağılımın
          </p>
          <DifficultyMix entry={currentUser} />
        </div>
      )}

      {topThree.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[1, 0, 2].map((idx) => {
            const entry = topThree[idx];
            if (!entry) return null;
            const isFirst = entry.rank === 1;
            return (
              <div
                key={entry._id}
                className={`bg-white rounded-3xl border shadow-sm p-6 text-center ${
                  entry.isCurrentUser
                    ? "ring-2 ring-blue-400 border-blue-200"
                    : "border-slate-100"
                } ${isFirst ? "sm:-mt-2 sm:mb-2" : ""}`}
              >
                <span className="text-4xl block mb-2">
                  {RANK_MEDALS[entry.rank] || `#${entry.rank}`}
                </span>
                <div className="mx-auto mb-3 ring-2 ring-white shadow-sm rounded-full">
                  <UserAvatar user={entry} size="lg" className="!rounded-full" />
                </div>
                <p className="font-black text-slate-800 truncate">{entry.name}</p>
                {entry.isCurrentUser && (
                  <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wide">
                    Sen
                  </span>
                )}
                <p className="text-3xl font-black text-violet-600 mt-2">
                  {entry.performanceScore}
                  <span className="text-sm text-slate-400 font-bold ml-1">puan</span>
                </p>
                <p className="text-sm text-emerald-600 font-bold mt-1">
                  %{entry.successRate} başarı
                </p>
                <p className="text-xs text-slate-400 mt-2 font-medium">
                  {entry.examCount} sınav · {entry.totalCorrect}/{entry.totalQuestions}{" "}
                  doğru
                </p>
                <div className="mt-3 flex justify-center">
                  <DifficultyMix entry={entry} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <h3 className="font-black text-slate-800">Tüm Öğrenciler</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Sıralama: performans puanı → ağırlıklı başarı → ham başarı → sınav sayısı
          </p>
        </div>

        {leaderboard.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            Henüz listede öğrenci yok.
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {leaderboard.map((entry) => (
              <li
                key={entry._id}
                className={`flex items-center gap-4 px-6 py-4 transition-colors ${
                  entry.isCurrentUser
                    ? "bg-blue-50/80 border-l-4 border-l-blue-500"
                    : "hover:bg-slate-50/50"
                }`}
              >
                <span
                  className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${
                    RANK_STYLES[entry.rank] ||
                    "bg-slate-50 text-slate-600 border border-slate-100"
                  }`}
                >
                  {entry.rank <= 3 ? RANK_MEDALS[entry.rank] : entry.rank}
                </span>

                <UserAvatar
                  user={entry}
                  size="md"
                  className={
                    entry.isCurrentUser ? "ring-2 ring-blue-400" : ""
                  }
                />

                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-800 truncate">
                    {entry.name}
                    {entry.isCurrentUser && (
                      <span className="ml-2 text-xs font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                        Sen
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-slate-400 font-medium">
                    {entry.examCount > 0
                      ? `${entry.examCount} sınav · ${entry.totalCorrect}/${entry.totalQuestions} doğru`
                      : "Henüz sınav çözmedi"}
                  </p>
                  <DifficultyMix entry={entry} />
                </div>

                <div className="text-right shrink-0">
                  <p className="text-xl font-black text-violet-600">
                    {entry.performanceScore}
                  </p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">
                    performans
                  </p>
                  {entry.examCount > 0 && (
                    <p className="text-[10px] text-emerald-600 font-bold mt-0.5">
                      %{entry.successRate}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="text-center text-xs text-slate-400 mt-6 font-medium">
        Zor quiz çözerek aynı başarı oranında bile sıralamanda yükselir. Pasif ve
        yönetici hesapları listede görünmez.
      </p>
    </div>
  );
};

export default Leaderboard;
