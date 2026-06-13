const express = require("express");
const router = express.Router();
const {
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
} = require("../controllers/userController");
const { protect, admin } = require("../middleware/authMiddleware");
const uploadAvatar = require("../middleware/uploadAvatar");

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);
router.get("/profile", protect, getUserProfile);
router.patch("/profile", protect, updateUserProfile);
router.post("/profile/photo", protect, (req, res, next) => {
  uploadAvatar.single("photo")(req, res, (err) => {
    if (err) {
      return res.status(400).json({ message: err.message || "Dosya yüklenemedi" });
    }
    next();
  });
}, uploadProfilePhoto);
router.delete("/profile/photo", protect, removeProfilePhoto);
router.get("/", protect, admin, getAllUsers);
router.patch("/:id/status", protect, admin, updateUserStatus);
router.delete("/:id", protect, admin, deleteUser);
module.exports = router;
