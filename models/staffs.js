const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const staffsSchema = new mongoose.Schema({
  staffNumber: String,
  role: String,
  firstName: String,
  lastName: String,
  username: String,
  birthday: Date,
  email: String,
  contactNumber: String,
});

// Hash password before saving user
staffsSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to compare password during login
staffsSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("Staffs", staffsSchema);
