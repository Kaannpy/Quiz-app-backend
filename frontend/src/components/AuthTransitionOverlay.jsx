const AuthTransitionOverlay = ({ title, subtitle }) => (
  <div className="fixed inset-0 z-[200] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-300">
    <div className="bg-white rounded-2xl px-10 py-8 text-center shadow-2xl border border-slate-100 max-w-sm mx-4">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600 mx-auto" />
      <p className="font-bold text-slate-800 mt-5">{title}</p>
      <p className="text-sm text-slate-500 mt-2">{subtitle}</p>
    </div>
  </div>
);

export default AuthTransitionOverlay;
