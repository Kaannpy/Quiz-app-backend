import { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { API_BASE } from '../config/api';
import AuthTransitionOverlay from '../components/AuthTransitionOverlay';
import { performAuthRedirect } from '../utils/authTransition';

const ALLOWED_DOMAINS = ['gmail.com', 'hotmail.com', 'outlook.com'];

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const validateEmail = (email) => {
    const domain = email.split('@')[1]?.toLowerCase();
    return ALLOWED_DOMAINS.includes(domain);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading || isTransitioning) return;

    // E-posta domain kontrolü
    if (!validateEmail(email)) {
      setError('Sadece @gmail.com, @hotmail.com veya @outlook.com uzantılı e-postalar kabul edilir.');
      return;
    }

    // Şifre eşleşme kontrolü
    if (password !== confirmPassword) {
      setError('Şifreler eşleşmiyor. Lütfen tekrar kontrol edin.');
      return;
    }

    if (password.length < 6) {
      setError('Şifre en az 6 karakter olmalıdır.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${API_BASE}/api/users/register`, {
        name,
        email,
        password
      });

      localStorage.setItem('userInfo', JSON.stringify(response.data));
      await performAuthRedirect('/panel', () => setIsTransitioning(true));
    } catch (err) {
      setError(err.response?.data?.message || 'Kayıt sırasında bir hata oluştu.');
      setLoading(false);
    }
  };

  // E-posta domain uyarısını gerçek zamanlı göster
  const emailDomain = email.split('@')[1]?.toLowerCase();
  const showEmailWarning = email.includes('@') && emailDomain && !ALLOWED_DOMAINS.includes(emailDomain);
  const showPasswordMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="max-w-md w-full bg-white p-10 rounded-3xl shadow-lg border border-slate-100">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-black text-slate-800 mb-2">KAANQUIZ</h1>
          <p className="text-slate-500 font-medium">Akıllı öğrenme dünyasına katıl!</p>
        </div>

        {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm font-bold border border-red-100">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-slate-700 font-bold mb-2 ml-1">İsim Soyisim</label>
            <input 
              type="text" 
              className="w-full p-4 rounded-2xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all disabled:opacity-60"
              placeholder="Kaan Pey"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={loading || isTransitioning}
            />
          </div>
          <div>
            <label className="block text-slate-700 font-bold mb-2 ml-1">E-posta</label>
            <input 
              type="email" 
              className={`w-full p-4 rounded-2xl border outline-none transition-all disabled:opacity-60 ${
                showEmailWarning 
                  ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-100' 
                  : 'border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100'
              }`}
              placeholder="kaan@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading || isTransitioning}
            />
            {showEmailWarning && (
              <p className="text-red-500 text-xs font-semibold mt-2 ml-1 flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                Sadece @gmail.com, @hotmail.com veya @outlook.com kabul edilir
              </p>
            )}
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
              minLength={6}
              disabled={loading || isTransitioning}
            />
          </div>
          <div>
            <label className="block text-slate-700 font-bold mb-2 ml-1">Şifre Tekrar</label>
            <input 
              type="password" 
              className={`w-full p-4 rounded-2xl border outline-none transition-all disabled:opacity-60 ${
                showPasswordMismatch
                  ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-100'
                  : 'border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100'
              }`}
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              disabled={loading || isTransitioning}
            />
            {showPasswordMismatch && (
              <p className="text-red-500 text-xs font-semibold mt-2 ml-1 flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                Şifreler eşleşmiyor
              </p>
            )}
          </div>
          <button 
            type="submit" 
            disabled={loading || isTransitioning}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-2xl font-bold text-lg shadow-md transition-all active:scale-95 disabled:opacity-50"
          >
            {loading || isTransitioning ? "Hesap Oluşturuluyor..." : "Kayıt Ol"}
          </button>
        </form>

        <div className="mt-8 text-center text-slate-500 font-medium">
          Zaten üye misin? <Link to="/login" className="text-blue-600 hover:underline">Giriş Yap</Link>
        </div>
      </div>

      {isTransitioning && (
        <AuthTransitionOverlay
          title="Hesabınız hazırlanıyor..."
          subtitle="Panele yönlendiriliyorsunuz"
        />
      )}
    </div>
  );
};

export default Register;
