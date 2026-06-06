const Quiz = require("../models/quizModel");

const createQuiz = async (req, res) => {
  try {
    const { title, category, difficulty, questions } = req.body;

    const quiz = await Quiz.create({
      title,
      category,
      difficulty,
      questions,
      users: req.user._id,
    });
    res.status(201).json(quiz);
  } catch (error) {
    res
      .status(400)
      .json({ message: "Quiz oluşturulamadı", erroor: error.message });
  }
};

const getQuizzes = async (req, res) => {
  try {
    const quizzes = await Quiz.find({});
    res.json(quizzes);
  } catch (error) {
    res.status(500).json({ message: "Quizler alınamadı" });
  }
};
// id'ye göre quiz getiren fonksiyon arama yaparak params var
const getQuizById = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (quiz) {
      res.json(quiz);
    } else {
      res.status(404).json({ message: "Quiz bulunamadı" });
    }
  } catch (error) {
    res.status(500).json({ message: "Quiz alınırken hata oluştu" });
  }
};

const deleteQuestion = async (req, res) => {
  try {
    const { quizId, soruId } = req.params;
    const updateQuiz = await Quiz.findByIdAndUpdate(
      quizId,
      { $pull: { questions: { _id: soruId } } },
      { new: true },
    );

    if (updateQuiz) {
      res.json(updateQuiz);
    } else {
      res.status(404).json({ message: "Quiz bulunamadı" });
    }
  } catch (error) {
    console.log("Hata detayları:", error.message);
    res.status(500).json({ message: "Soru silinirken hata oluştu" });
  }
};

const addQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const { questionText, options, correctAnswer } = req.body;
    const newQuestion = {
      questionText,
      options,
      correctAnswer,
    };
    const updateQuiz = await Quiz.findByIdAndUpdate(
      id,
      { $push: { questions: newQuestion } },
      { new: true },
    );
    if (updateQuiz) {
      res.json(updateQuiz);
    } else {
      res.status(404).json({ message: "Soru eklencek Quiz bulunamadı" });
    }
  } catch (error) {
    res.status(500).json({ message: "Soru eklenirken hata oluştu" });
  }
};

module.exports = {
  createQuiz,
  getQuizzes,
  getQuizById,
  deleteQuestion,
  addQuestion,
};
