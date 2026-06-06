import { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { API_BASE } from '../config/api';
import AuthTransitionOverlay from '../components/AuthTransitionOverlay';
import { performAuthRedirect } from '../utils/authTransition';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading || isTransitioning) return;
    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${API_BASE}/api/users/login`, {
        email,
        password
      });

      localStorage.setItem('userInfo', JSON.stringify(response.data));
      await performAuthRedirect('/panel', () => setIsTransitioning(true));
    } catch (err) {
      const msg = err.response?.data?.message;
      if (err.response?.status === 403) {
        setError(msg || 'Üyeliğiniz dondurulmuştur. Lütfen yönetici ile iletişime geçin.');
      } else {
        setError(msg || 'Giriş yapılamadı. Şifreni kontrol et!');
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="max-w-md w-full bg-white p-10 rounded-3xl shadow-lg border border-slate-100">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-black text-slate-800 mb-2">KAANQUIZ</h1>
          <p className="text-slate-500 font-medium">Tekrar hoş geldin!</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm font-bold border border-red-100 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-slate-700 font-bold mb-2 ml-1">E-posta</label>
            <input 
              type="email" 
              className="w-full p-4 rounded-2xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all disabled:opacity-60"
              placeholder="kaan@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading || isTransitioning}
            />
          </div>
          <div>
            <label className="block text-slate-700 font-bold mb-2 ml-1">Şifre</label>
            <input 
              type="password" 
              className="w-full p-4 rounded-2xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all disabled:opacity-60"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading || isTransitioning}
            />
          </div>
          <button 
            type="submit" 
            disabled={loading || isTransitioning}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-2xl font-bold text-lg shadow-md transition-all active:scale-95 disabled:opacity-50"
          >
            {loading || isTransitioning ? "Giriş Yapılıyor..." : "Giriş Yap"}
          </button>
        </form>

        <div className="mt-8 text-center text-slate-500 font-medium">
          Hesabın yok mu? <Link to="/register" className="text-blue-600 hover:underline">Hemen Kayıt Ol</Link>
        </div>
      </div>

      {isTransitioning && (
        <AuthTransitionOverlay
          title="Giriş yapılıyor..."
          subtitle="Panele yönlendiriliyorsunuz"
        />
      )}
    </div>
  );
};

export default Login;
