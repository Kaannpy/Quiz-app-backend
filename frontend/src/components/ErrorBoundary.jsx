import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-red-50">
          <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-lg border border-red-200">
            <h1 className="text-2xl font-black text-red-600 mb-4">⚠️ Bir Hata Oluştu</h1>
            <p className="text-slate-600 mb-4">Beklenmeyen bir hata ile karşılaştık. Lütfen sayfayı yenileyiniz.</p>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-2xl font-bold transition-all"
            >
              Sayfayı Yenile
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
