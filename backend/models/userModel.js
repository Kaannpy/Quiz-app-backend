const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, required: true, default: "user" },
    status: {
      type: String,
      enum: ["active", "passive"],
      default: "active",
    },
    school: { type: String, default: "" },
    gradeClass: { type: String, default: "" },
    profilePhoto: { type: String, default: "" },
  },

  { timestamps: true },
);

// veritabanına kaydedilmeden önce şifreyi hash'lemek için pre-save middleware
userSchema.pre("save", async function () {
  if (!this.isModified("password")) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};
const User = mongoose.model("User", userSchema);
module.exports = User;
