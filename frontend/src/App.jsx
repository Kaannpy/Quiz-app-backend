import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ErrorBoundary from "./components/ErrorBoundary";
import AppShell from "./components/AppShell";
import RequireAuth from "./components/RequireAuth";
import PublicIndex from "./components/PublicIndex";
import Dashboard from "./pages/Dashboard";
import Home from "./pages/Home";
import QuizDetail from "./pages/QuizDetail";
import AiQuizSolve from "./pages/AiQuizSolve";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ResetPassword from "./pages/ResetPassword";
import QuizHistory from "./pages/QuizHistory";
import AdminDashboard from "./pages/AdminDashboard";
import PdfQuiz from "./pages/PdfQuiz";
import QuizCreate from "./pages/QuizCreate";
import Leaderboard from "./pages/Leaderboard";
import Profile from "./pages/Profile";

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          <Route path="/" element={<PublicIndex />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/ai-quiz-solve" element={<AiQuizSolve />} />
          <Route path="/quiz/:id" element={<QuizDetail />} />

          <Route element={<AppShell />}>
            <Route
              path="/panel"
              element={
                <RequireAuth>
                  <Home />
                </RequireAuth>
              }
            />
            <Route
              path="/quiz-olustur"
              element={
                <RequireAuth
                  title="Quiz Oluştur"
                  description="Konu ile quiz oluşturmak için giriş yapmalısınız."
                  icon="✨"
                >
                  <QuizCreate />
                </RequireAuth>
              }
            />
            <Route
              path="/pdf-quiz"
              element={
                <RequireAuth
                  title="PDF'den Quiz Oluştur"
                  description="PDF yükleyip quiz oluşturmak için giriş yapmalısınız."
                  icon="📄"
                >
                  <PdfQuiz />
                </RequireAuth>
              }
            />
            <Route
              path="/dashboard"
              element={
                <RequireAuth>
                  <Dashboard />
                </RequireAuth>
              }
            />
            <Route
              path="/leaderboard"
              element={
                <RequireAuth>
                  <Leaderboard />
                </RequireAuth>
              }
            />
            <Route
              path="/profil"
              element={
                <RequireAuth>
                  <Profile />
                </RequireAuth>
              }
            />
            <Route
              path="/history"
              element={
                <RequireAuth>
                  <QuizHistory />
                </RequireAuth>
              }
            />
            <Route
              path="/admin"
              element={
                <RequireAuth>
                  <AdminDashboard />
                </RequireAuth>
              }
            />
          </Route>
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
