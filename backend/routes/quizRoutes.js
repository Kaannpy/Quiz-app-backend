const express = require("express");
const router = express.Router();
const {
  createQuiz,
  getQuizzes,
  getQuizById,
  deleteQuestion,
  addQuestion,
} = require("../controllers/quizController");
const { protect } = require("../middleware/authMiddleware");
router.get("/", getQuizzes);

router.post("/", protect, createQuiz);
router.get("/:id", getQuizById);
router.delete("/:quizId/sorular/:soruId", protect, deleteQuestion);
router.post("/:id/sorular", protect, addQuestion);
module.exports = router;
