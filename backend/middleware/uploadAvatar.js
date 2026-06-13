const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");

// Cloudinary bağlantı ayarları
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Depolama motoru olarak Cloudinary'yi ayarlıyoruz
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "kaanquiz_avatars", // Cloudinary'de fotoğrafların birikeceği klasörün adı
    allowed_formats: ["jpg", "jpeg", "png", "webp"], // Sadece resim formatlarına izin ver
    transformation: [{ width: 500, height: 500, crop: "limit" }], // Yüklenen resmi otomatik optimize et
  },
});

const uploadAvatar = multer({ storage: storage });

module.exports = uploadAvatar;
