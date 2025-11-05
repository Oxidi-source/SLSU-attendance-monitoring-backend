const { default: mongoose } = require("mongoose");
const bcrypt = require("bcryptjs");
const professorSchema = new mongoose.Schema({
  profNumber: String,
  role: String,
  firstName: String,
  lastName: String,
  username: String,
  email: String,
  contactNumber: String,

  birthday: Date,
});

// Hash password before saving user
professorSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to compare password during login
professorSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("Professor", professorSchema);
