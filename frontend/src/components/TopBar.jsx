import { useRef, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSearch } from "../context/SearchContext";
import AuthTransitionOverlay from "./AuthTransitionOverlay";
import UserAvatar from "./UserAvatar";
import { performLogout } from "../utils/authTransition";
import { getUserInfo } from "../utils/userInfo";

const TopBar = () => {
  const navigate = useNavigate();
  const searchRef = useRef(null);
  const inputRef = useRef(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [userInfo, setUserInfoState] = useState(() => getUserInfo());
  const { query, setQuery, results, isOpen, setIsOpen } = useSearch();

  useEffect(() => {
    const sync = () => setUserInfoState(getUserInfo());
    window.addEventListener("userInfoUpdated", sync);
    return () => window.removeEventListener("userInfoUpdated", sync);
  }, []);

  const logoutHandler = () => {
    if (isLoggingOut) return;
    performLogout(() => setIsLoggingOut(true));
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setIsOpen]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [setIsOpen]);

  const handleSelect = (item) => {
    setQuery("");
    setIsOpen(false);
    navigate(item.path);
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center gap-3 flex-1 max-w-xl" ref={searchRef}>
        <div className="relative w-full">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">
            🔍
          </span>
          <input
            ref={inputRef}
            type="text"
            placeholder="Ara..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            className="w-full pl-10 pr-16 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-bold text-slate-400 bg-white border border-slate-200 rounded-md">
            ⌘ K
          </kbd>

          {isOpen && query.trim() && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden">
              {results.length === 0 ? (
                <p className="px-4 py-3 text-sm text-slate-400">Sonuç bulunamadı</p>
              ) : (
                results.map((item, i) => (
                  <button
                    key={`${item.type}-${item.id || item.path}-${i}`}
                    type="button"
                    onClick={() => handleSelect(item)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0"
                  >
                    <span className="text-lg">{item.icon}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-800 truncate">{item.label}</p>
                      {item.meta && (
                        <p className="text-xs text-slate-400">{item.meta}</p>
                      )}
                    </div>
                    <span className="text-xs text-slate-300">→</span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        {!userInfo ? (
          <>
            <Link
              to="/login"
              className="text-sm font-semibold text-slate-600 hover:text-blue-600"
            >
              Giriş Yap
            </Link>
            <Link
              to="/register"
              className="text-sm font-bold bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700"
            >
              Kayıt Ol
            </Link>
          </>
        ) : (
          <>
            <button
              type="button"
              className="relative w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-100"
              title="Bildirimler"
            >
              🔔
            </button>
            <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
              <Link
                to="/profil"
                className="flex items-center gap-3 hover:opacity-90 transition-opacity"
                title="Profilim"
              >
                <UserAvatar user={userInfo} size="sm" />
                <div className="hidden sm:block">
                  <p className="text-sm font-bold text-slate-800 leading-tight">
                    {userInfo.name?.split(" ")[0] || "Kullanıcı"}
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium uppercase">
                    {userInfo.role === "admin" ? "Yönetici" : "Öğrenci"}
                  </p>
                </div>
              </Link>
              <button
                onClick={logoutHandler}
                disabled={isLoggingOut}
                className="text-xs font-bold text-red-500 hover:text-red-700 ml-1 disabled:opacity-50"
              >
                {isLoggingOut ? "Çıkılıyor..." : "Çıkış"}
              </button>
            </div>
          </>
        )}
      </div>
      {isLoggingOut && (
        <AuthTransitionOverlay
          title="Güvenli çıkış yapılıyor..."
          subtitle="Ana sayfaya yönlendiriliyorsunuz"
        />
      )}
    </header>
  );
};

export default TopBar;
