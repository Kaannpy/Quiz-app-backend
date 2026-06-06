import { Link } from "react-router-dom";

const RequireAuth = ({
  children,
  title = "Giriş Gerekli",
  description = "Bu özelliği kullanmak için giriş yapmalısınız.",
  icon = "🔒",
}) => {
  const userInfo = JSON.parse(localStorage.getItem("userInfo") || "null");

  if (!userInfo?.token) {
    return (
      <div className="p-6 lg:p-8 max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center shadow-sm">
          <div className="text-5xl mb-4">{icon}</div>
          <h1 className="text-2xl font-black text-slate-800 mb-3">{title}</h1>
          <p className="text-slate-600 mb-6">{description}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/login"
              className="inline-block bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700"
            >
              Giriş Yap
            </Link>
            <Link
              to="/register"
              className="inline-block border border-slate-200 text-slate-700 px-8 py-3 rounded-xl font-bold hover:bg-slate-50"
            >
              Kayıt Ol
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return children;
};

export default RequireAuth;
