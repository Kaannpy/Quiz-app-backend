const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

const protect = async (req, res, next) => {
  let token;

  // (Standart Token gönderim şeklidir bearer token)
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];

      // Token sahte mi? Süresi geçmiş mi? Kendi gizli anahtarımızla kontrol ediyoruz.
      // Eğer token geçerliyse, içindeki şifrelenmiş veriyi (biz id koymuştuk) çözer ve 'decoded' içine atar.
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Token'ın içinden çıkan ID ile veritabanından adamı bul.
      // ".select('-password')" diyerek şifresini almaktan vazgeçiyoruz (güvenlik için).
      // Bulduğumuz kullanıcıyı "req.user" içine hapsediyoruz ki bir sonraki adımda kullanabilelim.
      req.user = await User.findById(decoded.id).select("-password");

      if (
        req.user &&
        req.user.role !== "admin" &&
        req.user.status === "passive"
      ) {
        return res.status(403).json({
          message:
            "Üyeliğiniz dondurulmuştur. Lütfen yönetici ile iletişime geçin.",
        });
      }

      next();
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.error("Token verification error:", error.message);
      }
      return res.status(401).json({ message: "Yetkisiz erişim, token başarısız" });
    }
  }

  if (!token) {
    return res.status(401).json({ message: "Yetkisiz erişim, token yok" });
  }
};

const admin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    return res.status(401).json({ message: "Bu işlem için admin yetkisi gereklidir" });
  }
};

module.exports = { protect, admin };
