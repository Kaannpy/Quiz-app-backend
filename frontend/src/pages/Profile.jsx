import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { API_BASE } from "../config/api";
import { getUserInfo, setUserInfo } from "../utils/userInfo";
import UserAvatar from "../components/UserAvatar";

const Profile = () => {
  const fileRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [school, setSchool] = useState("");
  const [gradeClass, setGradeClass] = useState("");
  const [profile, setProfile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const userInfo = getUserInfo();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        if (!userInfo?.token) {
          setError("Profil için giriş yapmalısınız.");
          return;
        }

        const { data } = await axios.get(`${API_BASE}/api/users/profile`, {
          headers: { Authorization: `Bearer ${userInfo.token}` },
        });

        setProfile(data);
        setName(data.name || "");
        setEmail(data.email || "");
        setSchool(data.school || "");
        setGradeClass(data.gradeClass || "");
        setUserInfo({ ...data, token: userInfo.token });
      } catch (err) {
        setError(err.response?.data?.message || "Profil yüklenemedi.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const { data } = await axios.patch(
        `${API_BASE}/api/users/profile`,
        { name, school, gradeClass },
        {
          headers: { Authorization: `Bearer ${userInfo.token}` },
        },
      );

      const updated = setUserInfo({
        ...data,
        token: userInfo.token,
        photoVersion: Date.now(),
      });
      setProfile(updated);
      setMessage("Profil kaydedildi.");
    } catch (err) {
      setError(err.response?.data?.message || "Kayıt başarısız.");
    } finally {
      setSaving(false);
    }
  };

  const handleRemovePhoto = async () => {
    if (!profile?.profilePhoto || removing) return;
    if (!window.confirm("Profil fotoğrafını kaldırmak istediğine emin misin?")) {
      return;
    }

    setRemoving(true);
    setError("");
    setMessage("");

    try {
      const { data } = await axios.delete(`${API_BASE}/api/users/profile/photo`, {
        headers: { Authorization: `Bearer ${userInfo.token}` },
      });

      const updated = setUserInfo({
        ...data,
        token: userInfo.token,
        photoVersion: Date.now(),
      });
      setProfile(updated);
      setPreviewUrl(null);
      setMessage("Fotoğraf kaldırıldı.");
    } catch (err) {
      setError(err.response?.data?.message || "Fotoğraf kaldırılamadı.");
    } finally {
      setRemoving(false);
    }
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setError("Fotoğraf en fazla 2 MB olabilir.");
      return;
    }

    setPreviewUrl(URL.createObjectURL(file));
    setUploading(true);
    setError("");
    setMessage("");

    const formData = new FormData();
    formData.append("photo", file);

    try {
      const { data } = await axios.post(
        `${API_BASE}/api/users/profile/photo`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${userInfo.token}`,
            "Content-Type": "multipart/form-data",
          },
        },
      );

      const updated = setUserInfo({
        ...data,
        token: userInfo.token,
        photoVersion: Date.now(),
      });
      setProfile(updated);
      setMessage("Fotoğraf güncellendi.");
    } catch (err) {
      setError(err.response?.data?.message || "Fotoğraf yüklenemedi.");
      setPreviewUrl(null);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  if (loading) {
    return (
      <div className="p-10 text-center text-slate-500 text-sm">Yükleniyor...</div>
    );
  }

  if (error && !profile) {
    return (
      <div className="max-w-lg mx-auto p-10 text-center text-red-600 font-medium">
        {error}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Profilim</h1>
        <p className="text-sm text-slate-500 mt-1">
          Genel bilgilerin ve profil fotoğrafın
        </p>
      </div>

      {message && (
        <div className="mb-4 text-sm font-medium text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-4 py-3">
          {message}
        </div>
      )}
      {error && profile && (
        <div className="mb-4 text-sm font-medium text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="relative">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Önizleme"
                className="w-28 h-28 rounded-full object-cover border-2 border-slate-200"
              />
            ) : (
              <UserAvatar user={profile} size="xl" />
            )}
            {uploading && (
              <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
                <span className="text-white text-xs font-semibold">...</span>
              </div>
            )}
          </div>
          <div className="text-center sm:text-left">
            <p className="font-semibold text-slate-900">{name || "Kullanıcı"}</p>
            <p className="text-sm text-slate-500">{email}</p>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={handlePhotoChange}
            />
            <div className="flex flex-wrap gap-2 mt-3 justify-center sm:justify-start">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading || removing}
                className="text-sm font-semibold text-slate-700 border border-slate-200 px-4 py-2 rounded-lg hover:bg-slate-50 disabled:opacity-50"
              >
                {uploading ? "Yükleniyor..." : "Fotoğraf Değiştir"}
              </button>
              {(profile?.profilePhoto || previewUrl) && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  disabled={uploading || removing || !!previewUrl}
                  className="text-sm font-semibold text-red-600 border border-red-100 px-4 py-2 rounded-lg hover:bg-red-50 disabled:opacity-50"
                >
                  {removing ? "Kaldırılıyor..." : "Fotoğrafı Kaldır"}
                </button>
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-2">JPG, PNG · max 2 MB</p>
          </div>
        </div>
      </div>

      <form
        onSubmit={handleSave}
        className="bg-white border border-slate-200 rounded-xl p-6 space-y-5"
      >
        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
          Genel Bilgiler
        </h2>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
            Ad Soyad
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-200"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
            E-posta
          </label>
          <input
            type="email"
            value={email}
            disabled
            className="w-full px-4 py-2.5 border border-slate-100 rounded-lg text-sm bg-slate-50 text-slate-500 cursor-not-allowed"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Okul
            </label>
            <input
              type="text"
              value={school}
              onChange={(e) => setSchool(e.target.value)}
              placeholder="Örn. Anadolu Lisesi"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-200"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Sınıf
            </label>
            <input
              type="text"
              value={gradeClass}
              onChange={(e) => setGradeClass(e.target.value)}
              placeholder="Örn. 12-A"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-200"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full sm:w-auto bg-slate-900 text-white text-sm font-semibold px-6 py-2.5 rounded-lg hover:bg-slate-800 disabled:opacity-50"
        >
          {saving ? "Kaydediliyor..." : "Kaydet"}
        </button>
      </form>
    </div>
  );
};

export default Profile;
