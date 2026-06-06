import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { API_BASE } from "../config/api";
import UserAvatar from "../components/UserAvatar";

const difficultyBadge = (level) => {
  const key = (level || "orta").toLowerCase();
  if (key === "kolay") return "bg-emerald-100 text-emerald-700 border-emerald-200";
  if (key === "zor") return "bg-red-100 text-red-700 border-red-200";
  return "bg-amber-100 text-amber-700 border-amber-200";
};

const difficultyLabel = (level) => {
  const key = (level || "orta").toLowerCase();
  if (key === "kolay") return "Kolay 🟢";
  if (key === "zor") return "Zor 🔴";
  return "Orta 🟡";
};

const AdminDashboard = () => {
  const [tab, setTab] = useState("students");
  const [allScores, setAllScores] = useState([]);
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      const userInfo = JSON.parse(localStorage.getItem("userInfo"));
      if (!userInfo || userInfo.role !== "admin") {
        navigate("/panel");
        return;
      }

      const config = {
        headers: { Authorization: `Bearer ${userInfo.token}` },
      };

      const [scoresRes, usersRes] = await Promise.all([
        axios.get(`${API_BASE}/api/scores/all`, config),
        axios.get(`${API_BASE}/api/users`, config),
      ]);

      setAllScores(scoresRes.data);
      setStudents(usersRes.data.filter((u) => u.role !== "admin"));
    } catch {
      setError("Veriler çekilirken bir hata oluştu veya yetkiniz yok.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [navigate]);

  const deleteHandler = async (id) => {
    if (!window.confirm("Bu sınav kaydını kalıcı olarak silmek istediğine emin misin?")) {
      return;
    }

    try {
      const userInfo = JSON.parse(localStorage.getItem("userInfo"));
      const config = {
        headers: { Authorization: `Bearer ${userInfo.token}` },
      };
      await axios.delete(`${API_BASE}/api/scores/${id}`, config);
      setAllScores((prev) => prev.filter((s) => s._id !== id));
    } catch {
      alert("Kayıt silinirken bir hata oluştu.");
    }
  };

  const toggleStatus = async (student) => {
    const newStatus = (student.status || "active") === "active" ? "passive" : "active";
    const msg =
      newStatus === "passive"
        ? `${student.name} adlı öğrencinin üyeliğini dondurmak istiyor musunuz?`
        : `${student.name} adlı öğrenciyi tekrar aktif etmek istiyor musunuz?`;
    if (!window.confirm(msg)) return;

    try {
      const userInfo = JSON.parse(localStorage.getItem("userInfo"));
      const config = {
        headers: { Authorization: `Bearer ${userInfo.token}` },
      };
      await axios.patch(
        `${API_BASE}/api/users/${student._id}/status`,
        { status: newStatus },
        config,
      );
      setStudents((prev) =>
        prev.map((s) => (s._id === student._id ? { ...s, status: newStatus } : s)),
      );
    } catch {
      alert("Durum güncellenirken bir hata oluştu.");
    }
  };

  const deleteStudent = async (student) => {
    if (
      !window.confirm(
        `${student.name} adlı öğrenciyi ve tüm sınav kayıtlarını kalıcı olarak silmek istediğinize emin misiniz?`,
      )
    ) {
      return;
    }

    try {
      const userInfo = JSON.parse(localStorage.getItem("userInfo"));
      const config = {
        headers: { Authorization: `Bearer ${userInfo.token}` },
      };
      await axios.delete(`${API_BASE}/api/users/${student._id}`, config);
      setStudents((prev) => prev.filter((s) => s._id !== student._id));
      setAllScores((prev) => prev.filter((s) => s.user?._id !== student._id));
    } catch {
      alert("Öğrenci silinirken bir hata oluştu.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (error) {
    return <div className="text-center mt-20 text-red-600 font-bold">{error}</div>;
  }

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
          👑 Yönetici Paneli
        </h1>
        <p className="text-slate-500 mt-1">
          Öğrencileri ve sınav kayıtlarını yönet.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <p className="text-xs text-slate-400 font-bold uppercase">Öğrenci</p>
          <p className="text-2xl font-black text-blue-600">{students.length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <p className="text-xs text-slate-400 font-bold uppercase">Sınav Kaydı</p>
          <p className="text-2xl font-black text-indigo-600">{allScores.length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <p className="text-xs text-slate-400 font-bold uppercase">Aktif Öğrenci</p>
          <p className="text-2xl font-black text-emerald-600">
            {students.filter((s) => (s.status || "active") === "active").length}
          </p>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab("students")}
          className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
            tab === "students"
              ? "bg-blue-600 text-white shadow-sm"
              : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          👥 Öğrenciler
        </button>
        <button
          onClick={() => setTab("exams")}
          className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
            tab === "exams"
              ? "bg-blue-600 text-white shadow-sm"
              : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          📝 Sınav Kayıtları
        </button>
      </div>

      {tab === "students" && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                <th className="p-4 font-bold">Öğrenci</th>
                <th className="p-4 font-bold">Okul / Sınıf</th>
                <th className="p-4 font-bold text-center">Sınav</th>
                <th className="p-4 font-bold text-center">Başarı</th>
                <th className="p-4 font-bold text-center">Durum</th>
                <th className="p-4 font-bold text-right hidden lg:table-cell">Kayıt</th>
                <th className="p-4 font-bold text-center">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {students.map((student) => (
                <tr key={student._id} className="hover:bg-slate-50">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <UserAvatar user={student} size="sm" />
                      <div className="min-w-0">
                        <p className="font-bold text-slate-800 truncate">{student.name}</p>
                        <p className="text-xs text-slate-400 truncate">{student.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <p className="text-sm text-slate-700 truncate max-w-[140px]">
                      {student.school || "—"}
                    </p>
                    <p className="text-xs text-slate-400">
                      {student.gradeClass ? `Sınıf: ${student.gradeClass}` : "Sınıf belirtilmedi"}
                    </p>
                  </td>
                  <td className="p-4 text-center">
                    <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-bold">
                      {student.examCount}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-bold ${
                        student.successRate >= 75
                          ? "bg-emerald-100 text-emerald-700"
                          : student.successRate >= 50
                            ? "bg-amber-100 text-amber-700"
                            : "bg-red-100 text-red-700"
                      }`}
                    >
                      %{student.successRate}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <button
                      type="button"
                      onClick={() => toggleStatus(student)}
                      className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                        (student.status || "active") === "active"
                          ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                          : "bg-slate-200 text-slate-600 hover:bg-slate-300"
                      }`}
                    >
                      {(student.status || "active") === "active" ? "Aktif" : "Pasif"}
                    </button>
                  </td>
                  <td className="p-4 text-right text-sm text-slate-500 hidden lg:table-cell">
                    {new Date(student.createdAt).toLocaleDateString("tr-TR")}
                  </td>
                  <td className="p-4 text-center">
                    <button
                      type="button"
                      onClick={() => deleteStudent(student)}
                      className="w-9 h-9 inline-flex items-center justify-center rounded-xl border border-slate-200 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all"
                      title="Öğrenciyi sil"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {students.length === 0 && (
            <p className="text-center p-10 text-slate-400">Henüz öğrenci yok.</p>
          )}
        </div>
      )}

      {tab === "exams" && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                <th className="p-4 font-bold">Kullanıcı</th>
                <th className="p-4 font-bold">Konu & Zorluk</th>
                <th className="p-4 font-bold text-center">Başarı</th>
                <th className="p-4 font-bold text-right">Tarih</th>
                <th className="p-4 font-bold text-center">Sil</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {allScores.map((score) => {
                const successRate =
                  score.totalQuestions > 0
                    ? Math.round(
                        (score.correctAnswers / score.totalQuestions) * 100,
                      )
                    : 0;

                return (
                  <tr key={score._id} className="hover:bg-slate-50">
                    <td className="p-4">
                      <p className="font-bold text-slate-800">
                        {score.user?.name || "Bilinmiyor"}
                      </p>
                      <p className="text-xs text-slate-400">
                        {score.user?.email || "—"}
                      </p>
                    </td>
                    <td className="p-4">
                      <span className="font-bold text-indigo-600">{score.category}</span>
                      <span
                        className={`ml-2 text-xs px-2 py-1 rounded-lg font-bold border ${difficultyBadge(score.difficulty)}`}
                      >
                        {difficultyLabel(score.difficulty)}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-bold ${
                          successRate >= 75
                            ? "bg-emerald-100 text-emerald-700"
                            : successRate >= 50
                              ? "bg-amber-100 text-amber-700"
                              : "bg-red-100 text-red-700"
                        }`}
                      >
                        %{successRate}
                      </span>
                    </td>
                    <td className="p-4 text-right text-sm text-slate-500">
                      {new Date(score.createdAt).toLocaleDateString("tr-TR")}
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => deleteHandler(score._id)}
                        className="w-9 h-9 inline-flex items-center justify-center rounded-xl border border-slate-200 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all"
                        title="Sil"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {allScores.length === 0 && (
            <p className="text-center p-10 text-slate-400">Henüz sınav kaydı yok.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
