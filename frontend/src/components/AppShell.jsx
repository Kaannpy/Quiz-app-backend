import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import axios from "axios";
import { API_BASE } from "../config/api";
import { SearchProvider } from "../context/SearchContext";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";

const AppShell = () => {
  const [totalExams, setTotalExams] = useState(0);

  useEffect(() => {
    const userInfo = JSON.parse(localStorage.getItem("userInfo") || "null");
    if (!userInfo?.token) return;

    axios
      .get(`${API_BASE}/api/scores/my-scores`, {
        headers: { Authorization: `Bearer ${userInfo.token}` },
      })
      .then(({ data }) => setTotalExams(Array.isArray(data) ? data.length : 0))
      .catch(() => {});
  }, []);

  return (
    <SearchProvider>
      <div className="flex min-h-screen bg-[#f4f6f9]">
        <Sidebar stats={{ totalExams }} />
        <div className="flex-1 flex flex-col min-w-0">
          <TopBar />
          <main className="flex-1 overflow-y-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SearchProvider>
  );
};

export default AppShell;
