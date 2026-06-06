import { Link, useLocation } from "react-router-dom";

const mainNav = [
  { to: "/panel", label: "Ana Sayfa", icon: "🏠", end: true },
  { to: "/quiz-olustur", label: "Quiz Oluştur", icon: "✨" },
  { to: "/pdf-quiz", label: "PDF'den Quiz", icon: "📄" },
  { to: "/history", label: "Geçmişim", icon: "📜" },
  { to: "/leaderboard", label: "Liderlik", icon: "🏆" },
  { to: "/dashboard", label: "Analizler", icon: "📊" },
  { to: "/profil", label: "Profilim", icon: "👤" },
];

const Sidebar = ({ stats = {} }) => {
  const location = useLocation();
  const userInfo = JSON.parse(localStorage.getItem("userInfo") || "null");

  const isActive = (path, end) => {
    if (end) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  return (
    <aside className="w-64 shrink-0 bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0">
      <div className="p-5 border-b border-slate-100">
        <Link to="/panel" className="flex items-center gap-2">
          <span className="text-2xl">🚀</span>
          <span className="font-black text-lg tracking-wide text-blue-600">
            KAAN<span className="text-slate-800">QUIZ</span>
          </span>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-2">
          Menü
        </p>
        {mainNav.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              isActive(item.to, item.end)
                ? "bg-blue-50 text-blue-700"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <span className="text-lg w-6 text-center">{item.icon}</span>
            {item.label}
          </Link>
        ))}

        {userInfo?.role === "admin" && (
          <>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-2 mt-6">
              Yönetim
            </p>
            <Link
              to="/admin"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                isActive("/admin")
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <span className="text-lg w-6 text-center">👑</span>
              Yönetici Paneli
            </Link>
          </>
        )}
      </nav>

      <div className="p-4 border-t border-slate-100 space-y-3">
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-slate-500">Toplam Sınav</span>
            <span className="text-xs font-black text-blue-600">
              {stats.totalExams ?? 0}
            </span>
          </div>
          <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all"
              style={{
                width: `${Math.min(100, ((stats.totalExams ?? 0) / 50) * 100)}%`,
              }}
            />
          </div>
          <p className="text-[10px] text-slate-400 mt-2">Gelişim takibi aktif</p>
        </div>

        {userInfo ? (
          <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl p-4 text-white">
            <p className="text-xs opacity-80">Hoş geldin</p>
            <p className="font-bold truncate">
              {userInfo.name?.split(" ")[0] || "Kullanıcı"}
            </p>
          </div>
        ) : (
          <Link
            to="/login"
            className="block text-center bg-blue-600 text-white text-sm font-bold py-2.5 rounded-xl hover:bg-blue-700"
          >
            Giriş Yap
          </Link>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
