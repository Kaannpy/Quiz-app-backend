const crypto = require("crypto");
const User = require("../models/userModel");
const Score = require("../models/scoreModel");
const generateToken = require("../utils/generateToken");
const sendEmail = require("../utils/sendEmail");

const formatUserPayload = (user, token) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  status: user.status || "active",
  school: user.school || "",
  gradeClass: user.gradeClass || "",
  profilePhoto: user.profilePhoto || "",
  ...(token ? { token } : {}),
});

const ALLOWED_EMAIL_DOMAINS = ["gmail.com", "hotmail.com", "outlook.com"];

const registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "Tüm alanları doldur" });
  }

  // E-posta domain kontrolü
  const emailDomain = email.split("@")[1]?.toLowerCase();
  if (!ALLOWED_EMAIL_DOMAINS.includes(emailDomain)) {
    return res.status(400).json({
      message:
        "Sadece @gmail.com, @hotmail.com veya @outlook.com uzantılı e-postalar kabul edilir.",
    });
  }

  try {
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res
        .status(400)
        .json({ message: "Bu email ait bir kullanıcı zaten var" });
    }

    const user = await User.create({
      name,
      email,
      password,
    });
    if (user) {
      res.status(201).json({
        ...formatUserPayload(user, generateToken(user._id)),
        message: "Kullanıcı oluşturuldu",
      });
    }
  } catch (error) {
    console.error("Kullanıcı Kayıt Hatası:", error.message);
    res.status(500).json({ message: "Server hatası" });
  }
};

const loginUser = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (user && (await user.matchPassword(password))) {
    if (user.role !== "admin" && user.status === "passive") {
      return res.status(403).json({
        message:
          "Üyeliğiniz dondurulmuştur. Lütfen yönetici ile iletişime geçin.",
      });
    }

    res.json(formatUserPayload(user, generateToken(user._id)));
  } else {
    res.status(401).json({ message: "E-posta veya şifre hatalı" });
  }
};

const getUserProfile = async (req, res) => {
  res.json(formatUserPayload(req.user));
};

const updateUserProfile = async (req, res) => {
  try {
    const { name, school, gradeClass } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "Kullanıcı bulunamadı" });
    }

    if (name !== undefined && String(name).trim()) {
      user.name = String(name).trim();
    }
    if (school !== undefined) {
      user.school = String(school).trim();
    }
    if (gradeClass !== undefined) {
      user.gradeClass = String(gradeClass).trim();
    }

    await user.save();
    res.json(formatUserPayload(user));
  } catch (error) {
    console.error("Profil güncelleme hatası:", error);
    res.status(500).json({ message: "Profil güncellenemedi" });
  }
};

const uploadProfilePhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Lütfen bir fotoğraf seçin" });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "Kullanıcı bulunamadı" });
    }

    // Multer-Cloudinary bağlantısı sayesinde resmin bulut URL'i direkt req.file.path içinde gelir
    user.profilePhoto = req.file.path;
    await user.save();

    res.json(formatUserPayload(user));
  } catch (error) {
    console.error("Fotoğraf yükleme hatası:", error);
    res.status(500).json({ message: "Fotoğraf yüklenemedi" });
  }
};

const removeProfilePhoto = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "Kullanıcı bulunamadı" });
    }

    // Sadece veritabanından bulut linkini temizliyoruz
    user.profilePhoto = "";
    await user.save();
    res.json(formatUserPayload(user));
  } catch (error) {
    console.error("Fotoğraf silme hatası:", error);
    res.status(500).json({ message: "Fotoğraf kaldırılamadı" });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });

    const scoreStats = await Score.aggregate([
      {
        $group: {
          _id: "$user",
          examCount: { $sum: 1 },
          totalCorrect: { $sum: "$correctAnswers" },
          totalQuestions: { $sum: "$totalQuestions" },
        },
      },
    ]);

    const statsMap = {};
    scoreStats.forEach((s) => {
      statsMap[s._id.toString()] = s;
    });

    const result = users.map((user) => {
      const stat = statsMap[user._id.toString()];
      const totalQuestions = stat?.totalQuestions || 0;
      const totalCorrect = stat?.totalCorrect || 0;
      const successRate =
        totalQuestions > 0
          ? Math.round((totalCorrect / totalQuestions) * 100)
          : 0;

      return {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status || "active",
        school: user.school || "",
        gradeClass: user.gradeClass || "",
        profilePhoto: user.profilePhoto || "",
        createdAt: user.createdAt,
        examCount: stat?.examCount || 0,
        successRate,
      };
    });

    res.json(result);
  } catch (error) {
    console.error("Kullanici listesi hatasi:", error);
    res.status(500).json({ message: "Kullanicilar getirilemedi" });
  }
};

const updateUserStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!["active", "passive"].includes(status)) {
      return res.status(400).json({ message: "Geçersiz durum değeri" });
    }

    const existing = await User.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ message: "Kullanıcı bulunamadı" });
    }
    if (existing.role === "admin") {
      return res
        .status(400)
        .json({ message: "Admin hesabının durumu değiştirilemez" });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true },
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "Kullanıcı bulunamadı" });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      status: user.status,
    });
  } catch (error) {
    console.error("Durum güncelleme hatası:", error);
    res.status(500).json({ message: "Durum güncellenemedi" });
  }
};

const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "Kullanıcı bulunamadı" });
    }
    if (user.role === "admin") {
      return res.status(400).json({ message: "Admin hesabı silinemez" });
    }

    await Score.deleteMany({ user: user._id });
    await user.deleteOne();

    res.json({ message: "Öğrenci silindi" });
  } catch (error) {
    console.error("Kullanıcı silme hatası:", error);
    res.status(500).json({ message: "Kullanıcı silinemedi" });
  }
};

const forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "E-posta adresi gerekli" });
  }

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res
        .status(404)
        .json({ message: "Bu e-posta adresine ait bir hesap bulunamadı" });
    }

    // Rastgele token oluştur
    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // Token'ı veritabanına kaydet (15 dakika geçerli)
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpire = Date.now() + 15 * 60 * 1000;
    await user.save();

    // Sıfırlama linkini oluştur
    const frontendUrl =
      process.env.FRONTEND_URL || process.env.VITE_API_URL || "http://localhost:5173";
    const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;

    const htmlContent = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); border-radius: 16px; padding: 40px; text-align: center; color: white;">
          <h1 style="margin: 0 0 10px 0; font-size: 28px; font-weight: 800;">KAANQUIZ</h1>
          <p style="margin: 0; opacity: 0.9; font-size: 16px;">Şifre Sıfırlama Talebi</p>
        </div>
        <div style="background: #ffffff; border-radius: 16px; padding: 32px; margin-top: 20px; border: 1px solid #e2e8f0;">
          <p style="color: #334155; font-size: 16px; line-height: 1.6;">Merhaba <strong>${user.name}</strong>,</p>
          <p style="color: #64748b; font-size: 15px; line-height: 1.6;">Şifrenizi sıfırlamak için aşağıdaki butona tıklayın. Bu link <strong>15 dakika</strong> boyunca geçerlidir.</p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${resetUrl}" style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; padding: 14px 40px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 16px; display: inline-block;">Şifremi Sıfırla</a>
          </div>
          <p style="color: #94a3b8; font-size: 13px; line-height: 1.5;">Bu talebi siz yapmadıysanız, bu e-postayı görmezden gelebilirsiniz. Şifreniz değişmeyecektir.</p>
        </div>
        <p style="text-align: center; color: #94a3b8; font-size: 12px; margin-top: 20px;">© ${new Date().getFullYear()} KaanQuiz - Akıllı Öğrenme Platformu</p>
      </div>
    `;

    await sendEmail({
      to: user.email,
      subject: "KaanQuiz - Şifre Sıfırlama",
      html: htmlContent,
    });

    res.json({ message: "Şifre sıfırlama linki e-posta adresinize gönderildi" });
  } catch (error) {
    console.error("Şifre sıfırlama hatası:", error);

    // Hata durumunda token'ları temizle
    try {
      const user = await User.findOne({ email });
      if (user) {
        user.resetPasswordToken = null;
        user.resetPasswordExpire = null;
        await user.save();
      }
    } catch (_) {}

    res.status(500).json({ message: "E-posta gönderilemedi. Lütfen daha sonra tekrar deneyin." });
  }
};

const resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ message: "Yeni şifre gerekli" });
  }

  if (password.length < 6) {
    return res
      .status(400)
      .json({ message: "Şifre en az 6 karakter olmalıdır" });
  }

  try {
    // Token'ı hash'le ve veritabanında ara
    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        message:
          "Geçersiz veya süresi dolmuş sıfırlama linki. Lütfen yeni bir link talep edin.",
      });
    }

    // Yeni şifreyi kaydet
    user.password = password;
    user.resetPasswordToken = null;
    user.resetPasswordExpire = null;
    await user.save();

    res.json({ message: "Şifreniz başarıyla güncellendi. Giriş yapabilirsiniz." });
  } catch (error) {
    console.error("Şifre güncelleme hatası:", error);
    res.status(500).json({ message: "Şifre güncellenemedi" });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  uploadProfilePhoto,
  removeProfilePhoto,
  getAllUsers,
  updateUserStatus,
  deleteUser,
  forgotPassword,
  resetPassword,
};
