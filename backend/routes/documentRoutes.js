const express = require("express");
const multer = require("multer");
const { protect } = require("../middleware/authMiddleware");
const {
  uploadAndAnalyze,
  getMyDocuments,
  getDocumentById,
  getTopicContext,
} = require("../controllers/documentController");

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 12 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Sadece PDF dosyalari kabul edilir."));
    }
  },
});

router.post(
  "/upload",
  protect,
  (req, res, next) => {
    upload.single("pdf")(req, res, (err) => {
      if (err) {
        return res.status(400).json({
          message: err.message || "Dosya yuklenemedi.",
        });
      }
      next();
    });
  },
  uploadAndAnalyze,
);

router.get("/", protect, getMyDocuments);
router.get("/:id", protect, getDocumentById);
router.get("/:id/topics/:topicId/context", protect, getTopicContext);

module.exports = router;
