const mongoose = require("mongoose");

const quizSchema = mongoose.Schema(
  {
    users: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    title: { type: String, required: true },

    category: { type: String, required: true },

    difficulty: {
      type: String,
      enum: ["kolay", "orta", "zor"],
      default: "orta",
    },
    sourceType: {
      type: String,
      enum: ["ai", "pdf", "manual"],
      default: "ai",
    },
    sourceDocument: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PdfDocument",
    },
    questions: [
      {
        questionText: { type: String, required: true },
        options: [{ type: String, required: true }],
        correctAnswer: { type: String, required: true },
      },
    ],
  },
  { timestamps: true },
);

const Quiz = mongoose.model("Quiz", quizSchema);
module.exports = Quiz;
