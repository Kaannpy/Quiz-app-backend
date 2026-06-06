const express = require("express");
const router = express.Router();

const {
  addScore,
  saveScore,
  getMyScores,
  getRecommendation,
  deleteScore,
  getLeaderboard,
  getAllScores,
} = require("../controllers/scoreController");
const { protect, admin } = require("../middleware/authMiddleware");
router.post("/", protect, addScore);
router.post("/save", protect, saveScore);
router.route("/my-scores").get(protect, getMyScores);
router.get("/leaderboard", protect, getLeaderboard);
router.delete("/:id", protect, deleteScore);
router.route("/all").get(protect, admin, getAllScores);
router.get("/recommendation/:category", protect, getRecommendation);
module.exports = router;
