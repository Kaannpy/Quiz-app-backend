const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    if (process.env.NODE_ENV !== 'production') {
      console.log("✓ MongoDB bağlandı");
    }
  } catch (error) {
    console.error("✗ MongoDB bağlantı hatası:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
