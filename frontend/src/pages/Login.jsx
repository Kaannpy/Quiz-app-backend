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

  // Şifremi Unuttum state'leri
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState('');
  const [forgotError, setForgotError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("kullanılan api_base:", API_BASE);
  
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

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (forgotLoading) return;

    setForgotLoading(true);
    setForgotMessage('');
    setForgotError('');

    try {
      const response = await axios.post(`${API_BASE}/api/users/forgot-password`, {
        email: forgotEmail
      });
      setForgotMessage(response.data.message);
    } catch (err) {
      setForgotError(err.response?.data?.message || 'Bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setForgotLoading(false);
    }
  };

  const closeForgotModal = () => {
    setShowForgotModal(false);
    setForgotEmail('');
    setForgotMessage('');
    setForgotError('');
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

          {/* Şifremi Unuttum Linki */}
          <div className="text-right -mt-2">
            <button
              type="button"
              onClick={() => setShowForgotModal(true)}
              className="text-sm text-blue-600 hover:text-blue-800 hover:underline font-medium transition-colors"
            >
              Şifremi Unuttum
            </button>
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

      {/* Şifremi Unuttum Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" onClick={closeForgotModal}>
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          
          {/* Modal İçeriği */}
          <div 
            className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 border border-slate-100"
            onClick={(e) => e.stopPropagation()}
            style={{ animation: 'fadeInUp 0.3s ease-out' }}
          >
            {/* Kapatma butonu */}
            <button
              onClick={closeForgotModal}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors p-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Başlık */}
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
              <h2 className="text-xl font-black text-slate-800">Şifremi Unuttum</h2>
              <p className="text-slate-500 text-sm mt-2">E-posta adresini gir, sana sıfırlama linki gönderelim.</p>
            </div>

            {/* Başarı mesajı */}
            {forgotMessage && (
              <div className="bg-green-50 text-green-700 p-4 rounded-xl mb-5 text-sm font-bold border border-green-100 text-center flex items-center gap-2 justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                {forgotMessage}
              </div>
            )}

            {/* Hata mesajı */}
            {forgotError && (
              <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-5 text-sm font-bold border border-red-100 text-center">
                {forgotError}
              </div>
            )}

            {/* Form */}
            {!forgotMessage && (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div>
                  <label className="block text-slate-700 font-bold mb-2 ml-1">E-posta Adresi</label>
                  <input
                    type="email"
                    className="w-full p-4 rounded-2xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all disabled:opacity-60"
                    placeholder="kaan@gmail.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                    disabled={forgotLoading}
                    autoFocus
                  />
                </div>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-2xl font-bold text-lg shadow-md transition-all active:scale-95 disabled:opacity-50"
                >
                  {forgotLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                      </svg>
                      Gönderiliyor...
                    </span>
                  ) : "Sıfırlama Linki Gönder"}
                </button>
              </form>
            )}

            {/* Başarılı gönderimden sonra giriş sayfasına dön */}
            {forgotMessage && (
              <button
                onClick={closeForgotModal}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 p-4 rounded-2xl font-bold text-lg transition-all active:scale-95"
              >
                Tamam
              </button>
            )}
          </div>
        </div>
      )}

      {isTransitioning && (
        <AuthTransitionOverlay
          title="Giriş yapılıyor..."
          subtitle="Panele yönlendiriliyorsunuz"
        />
      )}

      {/* Modal animasyonu */}
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
};

export default Login;
