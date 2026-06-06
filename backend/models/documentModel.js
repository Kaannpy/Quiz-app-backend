const mongoose = require("mongoose");

const topicSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    summary: { type: String, required: true },
    keyPoints: [{ type: String }],
  },
  { _id: true },
);

const documentSchema = mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    fileName: { type: String, required: true },
    fileSize: { type: Number },
    pageCount: { type: Number },
    suggestedTitle: { type: String },
    generalSummary: { type: String },
    topics: [topicSchema],
    textPreview: { type: String },
    extractedText: { type: String },
    status: {
      type: String,
      enum: ["ready", "failed"],
      default: "ready",
    },
  },
  { timestamps: true },
);

const PdfDocument = mongoose.model("PdfDocument", documentSchema);
module.exports = PdfDocument;
