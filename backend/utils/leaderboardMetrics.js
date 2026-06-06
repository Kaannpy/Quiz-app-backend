const DIFFICULTY_WEIGHTS = {
  kolay: 1,
  orta: 1.4,
  zor: 1.85,
};

/** Zorluk bonusu: ortalama ağırlık 1'in üzerindeyse performans puanı artar */
const DIFFICULTY_BONUS_PER_UNIT = 0.12;

const normalizeDifficulty = (difficulty) => {
  const key = String(difficulty || "orta")
    .toLowerCase()
    .trim();
  if (key.startsWith("kolay") || key === "easy") return "kolay";
  if (key.startsWith("zor") || key === "hard") return "zor";
  return "orta";
};

const getDifficultyWeight = (difficulty) =>
  DIFFICULTY_WEIGHTS[normalizeDifficulty(difficulty)];

const avgDifficultyLabel = (avgWeight) => {
  if (avgWeight >= 1.65) return "Zor";
  if (avgWeight >= 1.2) return "Orta";
  return "Kolay";
};

/**
 * Sınav listesinden liderlik metrikleri hesaplar.
 * @param {Array<{ correctAnswers: number, totalQuestions: number, difficulty: string }>} exams
 */
const emptyBreakdown = () => ({
  kolay: { exams: 0, questions: 0 },
  orta: { exams: 0, questions: 0 },
  zor: { exams: 0, questions: 0 },
});

const computeMetricsFromExams = (exams = []) => {
  let totalCorrect = 0;
  let totalQuestions = 0;
  let weightedCorrect = 0;
  let weightedTotal = 0;
  let difficultyWeightSum = 0;
  const difficultyBreakdown = emptyBreakdown();

  for (const exam of exams) {
    const tq = exam.totalQuestions || 0;
    const ca = exam.correctAnswers || 0;
    const tier = normalizeDifficulty(exam.difficulty);
    const w = DIFFICULTY_WEIGHTS[tier];

    totalCorrect += ca;
    totalQuestions += tq;
    weightedCorrect += ca * w;
    weightedTotal += tq * w;
    difficultyWeightSum += w * tq;
    difficultyBreakdown[tier].exams += 1;
    difficultyBreakdown[tier].questions += tq;
  }

  const examCount = exams.length;
  const successRate =
    totalQuestions > 0
      ? Math.round((totalCorrect / totalQuestions) * 100)
      : 0;

  const avgDifficultyWeight =
    totalQuestions > 0 ? difficultyWeightSum / totalQuestions : 1;

  const weightedRate =
    weightedTotal > 0
      ? Math.round((weightedCorrect / weightedTotal) * 100)
      : 0;

  const difficultyBonusFactor =
    1 + DIFFICULTY_BONUS_PER_UNIT * (avgDifficultyWeight - 1);

  const performanceScore =
    examCount > 0 ? Math.round(successRate * difficultyBonusFactor) : 0;

  const difficultyBonus = Math.max(0, performanceScore - successRate);

  const tierOrder = ["zor", "orta", "kolay"];
  const dominantTier = tierOrder.reduce((best, tier) =>
    difficultyBreakdown[tier].questions >
    difficultyBreakdown[best].questions
      ? tier
      : best,
  "kolay");

  const hardQuestionShare =
    totalQuestions > 0
      ? Math.round((difficultyBreakdown.zor.questions / totalQuestions) * 100)
      : 0;

  const isHardFocused =
    totalQuestions > 0 &&
    (dominantTier === "zor" || hardQuestionShare >= 40);

  return {
    examCount,
    totalCorrect,
    totalQuestions,
    successRate,
    weightedRate,
    avgDifficultyWeight: Math.round(avgDifficultyWeight * 100) / 100,
    avgDifficulty: avgDifficultyLabel(avgDifficultyWeight),
    performanceScore,
    difficultyBonus,
    difficultyBreakdown,
    dominantTier,
    hardQuestionShare,
    isHardFocused,
  };
};

module.exports = {
  normalizeDifficulty,
  getDifficultyWeight,
  computeMetricsFromExams,
  DIFFICULTY_WEIGHTS,
};
