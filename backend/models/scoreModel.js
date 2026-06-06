const mongoose = require("mongoose");

const scoreSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },

    quiz: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Quiz",
    },

    category: {
      type: String,
      required: true,
    },
    difficulty: {
      type: String,
      required: true,
    },
    correctAnswers: {
      type: Number,
      required: true,
    },
    totalQuestions: {
      type: Number,
      required: true,
    },

    score: {
      type: Number,
      required: true,
    },
    details: [
      {
        questionText: String,
        options: [String],
        correctAnswer: String,
        userAnswer: String,
        isCorrect: Boolean,
      },
    ],
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Score", scoreSchema);
