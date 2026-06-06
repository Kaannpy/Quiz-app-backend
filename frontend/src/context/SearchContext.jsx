import { createContext, useContext, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { API_BASE } from "../config/api";

const SearchContext = createContext(null);

export const SearchProvider = ({ children }) => {
  const [query, setQuery] = useState("");
  const [history, setHistory] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const userInfo = JSON.parse(localStorage.getItem("userInfo") || "null");
    if (!userInfo?.token) return;

    axios
      .get(`${API_BASE}/api/scores/my-scores`, {
        headers: { Authorization: `Bearer ${userInfo.token}` },
      })
      .then(({ data }) => setHistory(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const pages = [
      { type: "page", label: "Quiz Oluştur", path: "/quiz-olustur", icon: "✨" },
      { type: "page", label: "PDF'den Quiz", path: "/pdf-quiz", icon: "📄" },
      { type: "page", label: "Geçmişim", path: "/history", icon: "📜" },
      { type: "page", label: "Liderlik Tablosu", path: "/leaderboard", icon: "🏆" },
      { type: "page", label: "Analizler", path: "/dashboard", icon: "📊" },
      { type: "page", label: "Profilim", path: "/profil", icon: "👤" },
    ].filter((p) => p.label.toLowerCase().includes(q));

    const exams = history
      .filter((h) => h.category?.toLowerCase().includes(q))
      .slice(0, 6)
      .map((h) => ({
        type: "exam",
        label: h.category,
        path: "/history",
        icon: "📝",
        meta: `${h.correctAnswers}/${h.totalQuestions} doğru`,
        id: h._id,
      }));

    return [...pages, ...exams].slice(0, 8);
  }, [query, history]);

  return (
    <SearchContext.Provider
      value={{
        query,
        setQuery,
        results,
        isOpen,
        setIsOpen,
        history,
      }}
    >
      {children}
    </SearchContext.Provider>
  );
};

export const useSearch = () => {
  const ctx = useContext(SearchContext);
  if (!ctx) throw new Error("useSearch must be used within SearchProvider");
  return ctx;
};
