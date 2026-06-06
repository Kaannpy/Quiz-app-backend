const Score = require("../models/scoreModel");
const User = require("../models/userModel");
const { computeMetricsFromExams } = require("../utils/leaderboardMetrics");

const addScore = async (req, res) => {
  try {
    const {
      quizId,
      score,
      difficulty,
      category,
      correctAnswers,
      totalQuestions,
      details,
    } = req.body;

    if (!quizId || !category || !difficulty || score === undefined) {
      return res
        .status(400)
        .json({ message: "Lutfen skor kaydi icin gerekli bilgileri saglayin" });
    }

    const userId = req.user._id;
    const newScore = await Score.create({
      user: userId,
      quiz: quizId,
      category,
      difficulty,
      correctAnswers,
      totalQuestions,
      score,
      details,
    });

    res.status(201).json({
      message: "Skor basariyla kaydedildi",
      data: newScore,
    });
  } catch (error) {
    console.log("Skor Hatasi:", error.message);
    res.status(500).json({
      message: "Skor kaydedilirken hata olustu",
      error: error.message,
    });
  }
};

const saveScore = async (req, res) => {
  return addScore(req, res);
};

const getMyScores = async (req, res) => {
  try {
    const scores = await Score.find({ user: req.user._id }).sort({
      createdAt: -1,
    });

    res.json(scores);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Skorlar getirilemedi", error: error.message });
  }
};

const getRecommendation = async (req, res) => {
  try {
    const { category } = req.params;

    const scores = await Score.find({
      user: req.user._id,
      category: new RegExp(category, "i"),
    })
      .sort({ createdAt: -1 })
      .limit(3);

    if (scores.length === 0) {
      return res.json({
        recommendedDifficulty: "Kolay",
        message: "Bu konuya ilk kez başlıyorsun, kolay seviyeden başlayalım.",
      });
    }

    let totalCorrect = 0;
    let totalQs = 0;

    scores.forEach((s) => {
      totalCorrect += s.correctAnswers || 0;
      totalQs += s.totalQuestions || 0;
    });

    const avg = totalQs > 0 ? Math.round((totalCorrect / totalQs) * 100) : 0;

    console.log(
      `[AI Analiz] Kategori: ${category}, Sınav: ${scores.length}, Başarı Oranı: %${avg}`,
    );

    let difficulty = "orta";
    let feedback = "İyi bir temelin var, orta seviyeden devam edebilirsin.";

    if (avg >= 75) {
      difficulty = "Zor";
      feedback =
        "Bu konuda ustalaşmışsın! Artık zor seviyede kendini denemelisin. 🔥";
    } else if (avg < 50) {
      difficulty = "Kolay";
      feedback =
        "Zorlandığın noktalar olmuş. Temeli güçlendirmek için kolay seviyeyi öneririm. 📚";
    } else {
      difficulty = "Orta";
    }

    res.json({ recommendedDifficulty: difficulty, message: feedback });
  } catch (error) {
    console.error("Öneri Hatası:", error);
    res.status(500).json({ message: "Analiz sırasında bir hata oluştu." });
  }
};

const deleteScore = async (req, res) => {
  try {
    const score = await Score.findById(req.params.id);

    if (!score) {
      return res.status(404).json({ message: "Sınav kaydı bulunamadı" });
    }
    if (score.user.toString() !== req.user._id.toString()) {
      const isAdmin = req.user.role === "admin";
      if (!isAdmin) {
        return res.status(403).json({ message: "Bu kaydı silmeye yetkiniz yok" });
      }
    }
    await score.deleteOne();
    res
      .status(200)
      .json({ id: req.params.id, message: "Sınav kaydı başarıyla silindi" });
  } catch (error) {
    console.error("Sınav kaydı silme hatası:", error);
    res.status(500).json({ message: "Sınav kaydı silinirken bir hata oluştu" });
  }
};

const getLeaderboard = async (req, res) => {
  try {
    const students = await User.find({
      role: { $ne: "admin" },
      status: { $ne: "passive" },
    }).select("_id name profilePhoto");

    const studentIds = students.map((u) => u._id);

    const scoreByUser = await Score.aggregate([
      { $match: { user: { $in: studentIds } } },
      {
        $group: {
          _id: "$user",
          exams: {
            $push: {
              correctAnswers: "$correctAnswers",
              totalQuestions: "$totalQuestions",
              difficulty: "$difficulty",
            },
          },
        },
      },
    ]);

    const examsMap = {};
    scoreByUser.forEach((row) => {
      examsMap[row._id.toString()] = row.exams;
    });

    const currentUserId = req.user._id.toString();

    const buildEntry = (user, isCurrentUser) => {
      const exams = examsMap[user._id.toString()] || [];
      const metrics = computeMetricsFromExams(exams);
      return {
        _id: user._id,
        name: user.name,
        profilePhoto: user.profilePhoto || "",
        isCurrentUser,
        ...metrics,
      };
    };

    const entries = students.map((user) =>
      buildEntry(user, user._id.toString() === currentUserId),
    );

    entries.sort((a, b) => {
      if (b.performanceScore !== a.performanceScore) {
        return b.performanceScore - a.performanceScore;
      }
      if (b.weightedRate !== a.weightedRate) {
        return b.weightedRate - a.weightedRate;
      }
      if (b.successRate !== a.successRate) {
        return b.successRate - a.successRate;
      }
      if (b.examCount !== a.examCount) return b.examCount - a.examCount;
      return a.name.localeCompare(b.name, "tr");
    });

    const leaderboard = entries.map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));

    const currentEntry = leaderboard.find((e) => e.isCurrentUser);

    let currentUserStats = null;
    if (currentEntry) {
      currentUserStats = {
        rank: currentEntry.rank,
        successRate: currentEntry.successRate,
        performanceScore: currentEntry.performanceScore,
        weightedRate: currentEntry.weightedRate,
        difficultyBonus: currentEntry.difficultyBonus,
        difficultyBreakdown: currentEntry.difficultyBreakdown,
        isHardFocused: currentEntry.isHardFocused,
        hardQuestionShare: currentEntry.hardQuestionShare,
        examCount: currentEntry.examCount,
        totalCorrect: currentEntry.totalCorrect,
        totalQuestions: currentEntry.totalQuestions,
      };
    } else if (req.user.role !== "admin") {
      const metrics = computeMetricsFromExams(
        examsMap[currentUserId] || [],
      );
      currentUserStats = { rank: null, ...metrics };
    }

    res.json({
      leaderboard,
      currentUserRank: currentUserStats?.rank ?? null,
      currentUserStats,
      totalStudents: leaderboard.length,
    });
  } catch (error) {
    console.error("Liderlik tablosu hatasi:", error);
    res.status(500).json({
      message: "Liderlik tablosu getirilemedi",
      error: error.message,
    });
  }
};

const getAllScores = async (req, res) => {
  try {
    const scores = await Score.find({})
      .populate("user", "name email")
      .sort({ createdAt: -1 });
    res.json(scores);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Tüm skorlar getirilemedi", error: error.message });
  }
};

module.exports = {
  addScore,
  saveScore,
  getMyScores,
  getRecommendation,
  deleteScore,
  getLeaderboard,
  getAllScores,
};
