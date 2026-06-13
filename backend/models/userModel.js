const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const ALLOWED_EMAIL_DOMAINS = ["gmail.com", "hotmail.com", "outlook.com"];

const userSchema = mongoose.Schema(
  {
    name: { type: String, required: true },
    email: {
      type: String,
      required: true,
      unique: true,
      validate: {
        validator: function (v) {
          const domain = v.split("@")[1]?.toLowerCase();
          return ALLOWED_EMAIL_DOMAINS.includes(domain);
        },
        message:
          "Sadece @gmail.com, @hotmail.com veya @outlook.com uzantılı e-postalar kabul edilir.",
      },
    },
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
    resetPasswordToken: { type: String, default: null },
    resetPasswordExpire: { type: Date, default: null },
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
