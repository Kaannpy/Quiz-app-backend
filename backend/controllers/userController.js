const fs = require("fs");
const path = require("path");
const User = require("../models/userModel");
const Score = require("../models/scoreModel");
const generateToken = require("../utils/generateToken");

const deleteAvatarFile = (profilePhotoPath) => {
  if (!profilePhotoPath) return;
  const filename = path.basename(profilePhotoPath);
  const fullPath = path.join(__dirname, "../uploads/avatars", filename);
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
  }
};

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
const registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "Tüm alanları doldur" });
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

    deleteAvatarFile(user.profilePhoto);
    user.profilePhoto = `/uploads/avatars/${req.file.filename}`;
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

    deleteAvatarFile(user.profilePhoto);
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
      return res.status(400).json({ message: "Admin hesabının durumu değiştirilemez" });
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

    deleteAvatarFile(user.profilePhoto);
    await Score.deleteMany({ user: user._id });
    await user.deleteOne();

    res.json({ message: "Öğrenci silindi" });
  } catch (error) {
    console.error("Kullanıcı silme hatası:", error);
    res.status(500).json({ message: "Kullanıcı silinemedi" });
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
};
