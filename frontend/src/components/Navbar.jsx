import { Link } from 'react-router-dom';
import { useState } from 'react';
import AuthTransitionOverlay from './AuthTransitionOverlay';
import { performLogout } from '../utils/authTransition';

const Navbar = () => {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const userInfo = JSON.parse(localStorage.getItem('userInfo'));

  const logoutHandler = () => {
    if (isLoggingOut) return;
    performLogout(() => setIsLoggingOut(true));
  };

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          
          <Link to="/" className="flex items-center cursor-pointer">
            <span className="text-3xl mr-2">🚀</span>
            <span className="font-bold text-xl tracking-wider text-blue-600">
              KAAN<span className="text-gray-800">QUIZ</span>
            </span>
          </Link>

          <div className="flex space-x-4 items-center">
            <Link to="/" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">
              Quiz Oluştur
            </Link>
            <Link to="/pdf-quiz" className="text-emerald-600 hover:text-emerald-800 font-bold text-sm transition-colors">
              PDF Yükle
            </Link>

            {userInfo && (
              <>
                <Link to="/dashboard" className="text-blue-600 hover:text-blue-800 font-bold text-sm transition-colors flex items-center gap-1">
                  📊 Panelim
                </Link>
                <Link to="/history" className="text-slate-600 hover:text-slate-800 font-bold text-sm transition-colors flex items-center gap-1">
                  📜 Geçmişim
                </Link>
                
                {/* --- YENİ EKLENEN ADMİN BUTONU --- */}
                {userInfo.role === 'admin' && (
                  <Link to="/admin" className="text-indigo-600 hover:text-indigo-800 font-black text-sm transition-colors flex items-center gap-1 bg-indigo-50 px-3 py-1 rounded-lg ml-2">
                    👑 Yönetici Paneli
                  </Link>
                )}
                {/* ---------------------------------- */}
              </>
            )}

            {userInfo ? (
              <div className="flex items-center space-x-4 border-l pl-4 border-slate-200 ml-2">
                <span className="text-slate-700 font-semibold bg-slate-100 px-3 py-1 rounded-full text-sm">
                  👋 {userInfo?.name ? (userInfo.name.includes(' ') ? userInfo.name.split(' ')[0] : userInfo.name) : 'Kaan'}
                </span>
                <button 
                  onClick={logoutHandler}
                  disabled={isLoggingOut}
                  className="text-red-500 hover:text-red-700 font-bold text-sm transition-colors disabled:opacity-50"
                >
                  {isLoggingOut ? 'Çıkılıyor...' : 'Çıkış Yap'}
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3 ml-4 border-l pl-4 border-slate-200">
                <Link to="/login" className="text-gray-600 font-medium hover:text-blue-600">Giriş Yap</Link>
                <Link to="/register" className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-all">Kayıt Ol</Link>
              </div>
            )}
          </div>
        </div>
      </div>
      {isLoggingOut && (
        <AuthTransitionOverlay
          title="Güvenli çıkış yapılıyor..."
          subtitle="Ana sayfaya yönlendiriliyorsunuz"
        />
      )}
    </nav>
  ); 
};

export default Navbar;