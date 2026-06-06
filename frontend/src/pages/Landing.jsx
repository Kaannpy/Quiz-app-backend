import { Link } from "react-router-dom";

const features = [
  {
    icon: "✨",
    title: "Konu ile Quiz",
    desc: "Herhangi bir konuyu yazın; yapay zeka saniyeler içinde özelleştirilmiş sorular üretsin.",
  },
  {
    icon: "📄",
    title: "PDF'den Quiz",
    desc: "Ders notunuzu yükleyin; AI konuları çıkarsın, özetlesin ve soru üretsin.",
  },
  {
    icon: "📊",
    title: "Performans Analizi",
    desc: "Konu bazlı başarı grafikleri ve gelişim trendinizi takip edin.",
  },
  {
    icon: "🎯",
    title: "Adaptif Zorluk",
    desc: "Geçmiş performansınıza göre otomatik zorluk önerisi alın.",
  },
];

const steps = [
  "Konu veya PDF yükleyin",
  "AI soruları üretsin",
  "Sınavı çözün",
  "Skorunuz kaydedilsin",
];

const Landing = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-white/10">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl">🚀</span>
            <span className="font-black text-lg tracking-wide">
              KAAN<span className="text-blue-400">QUIZ</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="text-sm font-semibold text-slate-300 hover:text-white px-4 py-2"
            >
              Giriş Yap
            </Link>
            <Link
              to="/register"
              className="text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl transition-colors"
            >
              Ücretsiz Başla
            </Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-transparent to-indigo-600/10 pointer-events-none" />
        <div className="absolute top-20 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-6xl mx-auto px-6 py-20 lg:py-28 relative">
          <div className="max-w-2xl">
            <span className="inline-block text-xs font-bold uppercase tracking-widest text-blue-400 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full mb-6">
              Yapay Zeka Destekli Öğrenme
            </span>
            <h1 className="text-4xl lg:text-5xl font-black leading-tight mb-6">
              Akıllı quizlerle
              <span className="text-blue-400"> öğrenmeyi</span> hızlandırın
            </h1>
            <p className="text-lg text-slate-400 leading-relaxed mb-8">
              KAANQUIZ ile konu yazarak veya PDF yükleyerek saniyeler içinde quiz
              oluşturun. Performansınızı analiz edin, gelişiminizi takip edin.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold px-7 py-3.5 rounded-xl shadow-lg shadow-blue-600/30 transition-all"
              >
                Hemen Başla →
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 border border-white/20 hover:border-white/40 text-white font-bold px-7 py-3.5 rounded-xl transition-all"
              >
                Giriş Yap
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-16 max-w-lg">
            {[
              { val: "AI", label: "Soru Üretimi" },
              { val: "PDF", label: "Belge Analizi" },
              { val: "Anlık", label: "Performans Takibi" },
            ].map((s) => (
              <div
                key={s.label}
                className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center"
              >
                <p className="text-xl font-black text-blue-400">{s.val}</p>
                <p className="text-xs text-slate-400 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-900 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl lg:text-3xl font-black mb-3">Neler Sunuyoruz?</h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              Eğitim kurumları ve bireysel öğrenenler için tasarlanmış kapsamlı quiz platformu.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((f) => (
              <div
                key={f.title}
                className="bg-slate-800/50 border border-white/10 rounded-2xl p-6 hover:border-blue-500/30 transition-colors"
              >
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="font-bold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-2xl lg:text-3xl font-black mb-6">Nasıl Çalışır?</h2>
              <ol className="space-y-4">
                {steps.map((step, i) => (
                  <li key={step} className="flex items-center gap-4">
                    <span className="w-8 h-8 rounded-full bg-blue-600 text-white text-sm font-black flex items-center justify-center shrink-0">
                      {i + 1}
                    </span>
                    <span className="text-slate-300 font-medium">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
            <div className="bg-gradient-to-br from-blue-600/20 to-indigo-600/10 border border-white/10 rounded-3xl p-8">
              <div className="space-y-3">
                {["Yükleme", "Analiz", "Konu Çıkarma", "Soru Üretimi", "Tamamlandı"].map(
                  (s, i) => (
                    <div
                      key={s}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold ${
                        i === 0
                          ? "bg-blue-600/30 text-blue-300 border border-blue-500/30"
                          : "bg-white/5 text-slate-500"
                      }`}
                    >
                      <span className="w-5 h-5 rounded-md bg-white/10 flex items-center justify-center text-xs">
                        {i + 1}
                      </span>
                      {s}
                    </div>
                  ),
                )}
              </div>
              <p className="text-xs text-slate-500 mt-4 text-center">
                5 adımlı AI süreci ile otomatik quiz üretimi
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-blue-600 py-16">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-2xl lg:text-3xl font-black mb-4">
            Öğrenmeye bugün başlayın
          </h2>
          <p className="text-blue-100 mb-8">
            Ücretsiz hesap oluşturun, ilk quizinizi dakikalar içinde hazırlayın.
          </p>
          <Link
            to="/register"
            className="inline-block bg-white text-blue-700 font-black px-8 py-4 rounded-xl hover:bg-blue-50 transition-colors shadow-lg"
          >
            Ücretsiz Kayıt Ol
          </Link>
        </div>
      </section>

    
      <footer className="border-t border-white/10 py-8">
        <div className="align-center items-center justify-center max-w-6xl mx-auto px-6 flex flex-col gap-4 ">
          <p className="text-sm text-slate-500">
            © 2026 KAANQUIZ 
          </p>
          
        </div>
      </footer>
    </div>
  );
};

export default Landing;
