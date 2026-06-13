import { API_BASE } from "../config/api";

const sizeMap = {
  sm: "w-9 h-9 text-sm",
  md: "w-12 h-12 text-base",
  lg: "w-24 h-24 text-2xl",
  xl: "w-28 h-28 text-3xl",
};

const UserAvatar = ({ user, size = "sm", className = "" }) => {
  const name = user?.name || "K";
  const initial = name.trim()[0]?.toUpperCase() || "K";
  const photo = user?.profilePhoto;
  const src = photo
    ? photo.startsWith("http") ? photo : `${API_BASE}${photo}`
    : null;
  const sizeClass = sizeMap[size] || sizeMap.sm;

  if (src) {
    return (
      <img
        src={`${src}?t=${user?.photoVersion || ""}`}
        alt={name}
        className={`rounded-full object-cover shrink-0 bg-slate-100 ${sizeClass} ${className}`}
      />
    );
  }

  return (
    <div
      className={`rounded-full bg-slate-800 text-white flex items-center justify-center font-semibold shrink-0 ${sizeClass} ${className}`}
    >
      {initial}
    </div>
  );
};

export default UserAvatar;
