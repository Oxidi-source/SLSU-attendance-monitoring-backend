const User = require("../models/user");

const Admin = require("../models/admin");

const Prof = require("../models/professor");

const Staff = require("../models/staffs");

const jwt = require("jsonwebtoken");
const { default: mongoose } = require("mongoose");

exports.registerUser = async (req, res) => {
  const {
    studentNumber,
    role,
    firstName,
    lastName,
    course,
    year,
    username,
    password,
    birthday,
    email,
    contactNumber,
  } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "User already exists" });

    const user = new User({
      studentNumber,
      role,
      firstName,
      lastName,
      course,
      year,
      username,
      email,
      password,
      birthday,
      contactNumber,
    });
    await user.save();

    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// controllers/userController.js

// controllers/userController.js
exports.registerStudent = async (req, res) => {
  const {
    studentNumber,
    firstName,
    lastName,
    course,
    year,
    username,
    birthday,
    email,
    contactNumber,
  } = req.body;

  try {
    const existingUser = await User.findOne({ studentNumber });
    if (existingUser)
      return res.status(400).json({ message: "User already exists" });

    const user = new User({
      studentNumber,
      firstName,
      lastName,
      course,
      year,
      username,
      email,
      contactNumber,
      birthday,
    });

    await user.save();

    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.loginUser = async (req, res) => {
  const { studentNumber, password } = req.body;

  try {
    // Find user by email
    const user = await User.findOne({ studentNumber });
    if (!user)
      return res.status(400).json({ message: "Invalid student number" });

    // Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch)
      return res
        .status(400)
        .json({ message: "Invalid student number or password" });

    // Create JWT token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || "secretkey",
      {
        expiresIn: "1h",
      }
    );

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        firstname: user.firstName, // add this
        lastname: user.lastName, // add this
        username: user.username, // add this if you want
        studentNumber: user.studentNumber,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getCurrentUser = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1]; // Bearer <token>
    if (!token) return res.status(401).json({ message: "No token provided" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secretkey");

    const user = await User.findById(decoded.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(401).json({ message: "Invalid token" });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const { year, section } = req.query; // grab query params

    // Build filter object dynamically
    let filter = {};
    if (year) filter.year = year;
    if (section) filter.course = section;

    const users = await User.find(filter).select("-password");
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getStudent = async (req, res) => {
  const { id } = req.params;

  // Prevent CastError when id is not a valid ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid student ID" });
  }

  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "Student not found" });
    }
    res.json(user);
  } catch (err) {
    console.error("Error fetching student:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Update student info
// controllers/userController.js
exports.updateStudent = async (req, res) => {
  const { id } = req.params;
  const { firstName, lastName, year, course, email, contactNumber } = req.body;

  try {
    const student = await User.findById(id);
    if (!student) return res.status(404).json({ message: "Student not found" });

    student.firstName = firstName;
    student.lastName = lastName;
    student.year = year;
    student.course = course;
    student.email = email;
    student.contactNumber = contactNumber;

    await student.save();

    res.json(student); // return the updated student with _id
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateUserRole = async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  try {
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.role = role;
    await user.save();

    res.json({ message: "User role updated", user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.registerAdmin = async (req, res) => {
  const { firstName, lastName, username, password, email } = req.body;
  try {
    const existingUser = await Admin.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "User already exists" });

    const admin = new Admin({
      firstName,
      lastName,
      username,
      email,
      password,
    });
    await admin.save();

    res.status(201).json({ message: "Admin registered successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.loginAdmin = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find user by email
    const admin = await Admin.findOne({ email });
    if (!admin)
      return res.status(400).json({ message: "Invalid email or password" });

    // Check password
    const isMatch = await admin.matchPassword(password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid email or password" });

    // Create JWT token
    const token = jwt.sign(
      { id: admin._id },
      process.env.JWT_SECRET || "secretkey",
      {
        expiresIn: "8h",
      }
    );

    res.json({
      token,
      user: {
        id: admin._id,
        email: admin.email,
        firstname: admin.firstName, // add this
        lastname: admin.lastName, // add this
        username: admin.username, // add this if you want
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getCurrentAdmin = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1]; // Bearer <token>
    if (!token) return res.status(401).json({ message: "No token provided" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secretkey");

    const admin = await Admin.findById(decoded.id).select("-password");
    if (!admin) return res.status(404).json({ message: "Admin not found" });

    res.json(admin);
  } catch (err) {
    console.error(err);
    res.status(401).json({ message: "Invalid token" });
  }
};

exports.registerProfessor = async (req, res) => {
  const {
    profNumber,
    role,
    firstName,
    lastName,
    username,
    email,
    contactNumber,
    birthday,
  } = req.body;
  try {
    const existingUser = await Prof.findOne({ profNumber });
    if (existingUser)
      return res.status(400).json({ message: "User already exists" });

    const prof = new Prof({
      profNumber,
      role,
      firstName,
      lastName,
      username,
      birthday,
      email,
      contactNumber,
    });
    await prof.save();

    res.status(201).json({ message: "Professor registered successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.loginProfessor = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find user by email
    const prof = await Prof.findOne({ email });
    if (!prof) return res.status(400).json({ message: "Invalid email" });

    // Check password
    const isMatch = await prof.matchPassword(password);
    if (!isMatch)
      return res
        .status(400)
        .json({ message: "Email and Password does not match" });

    // Create JWT token
    const token = jwt.sign(
      { id: prof._id },
      process.env.JWT_SECRET || "secretkey",
      {
        expiresIn: "8h",
      }
    );

    res.json({
      token,
      user: {
        id: prof._id,
        email: prof.email,
        firstname: prof.firstName, // add this
        lastname: prof.lastName, // add this
        username: prof.username, // add this if you want
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
exports.getProf = async (req, res) => {
  const { id } = req.params;
  try {
    const prof = await Prof.findById(id); // ✅ use findById
    if (!prof) {
      return res.status(404).json({ message: "Prof not found" });
    }
    res.json(prof); // return the actual object
  } catch (err) {
    console.error("Error fetching staff:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getAllProf = async (req, res) => {
  try {
    const professors = await Prof.find(); // fetch all professors
    res.json(professors);
  } catch (err) {
    console.error("Error fetching professors:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateProfessor = async (req, res) => {
  const { id } = req.params;
  const { firstName, lastName, email, contactNumber } = req.body;

  try {
    const professor = await Prof.findById(id);

    if (!professor)
      return res.status(404).json({ message: "Professor not found" });

    professor.firstName = firstName;
    professor.lastName = lastName;
    professor.email = email;
    professor.contactNumber = contactNumber;

    await professor.save();

    res.json(professor); // return the updated student with _id
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

//staffs routes
exports.registerStaff = async (req, res) => {
  const {
    staffNumber,
    role,
    firstName,
    lastName,
    username,
    email,
    contactNumber,
    birthday,
  } = req.body;
  try {
    const existingUser = await Staff.findOne({ staffNumber });
    if (existingUser)
      return res.status(400).json({ message: "Staff already exists" });

    const staff = new Staff({
      staffNumber,
      role,
      firstName,
      lastName,
      username,
      birthday,
      email,
      contactNumber,
    });
    await staff.save();

    res.status(201).json({ message: "Staff registered successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.loginProfessor = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find user by email
    const prof = await Prof.findOne({ email });
    if (!prof) return res.status(400).json({ message: "Invalid email" });

    // Check password
    const isMatch = await prof.matchPassword(password);
    if (!isMatch)
      return res
        .status(400)
        .json({ message: "Email and Password does not match" });

    // Create JWT token
    const token = jwt.sign(
      { id: prof._id },
      process.env.JWT_SECRET || "secretkey",
      {
        expiresIn: "1h",
      }
    );

    res.json({
      token,
      user: {
        id: prof._id,
        email: prof.email,
        firstname: prof.firstName, // add this
        lastname: prof.lastName, // add this
        username: prof.username, // add this if you want
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getAllStaff = async (req, res) => {
  try {
    const staffs = await Staff.find(); // fetch all professors
    res.json(staffs);
  } catch (err) {
    console.error("Error fetching staffs:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getStaff = async (req, res) => {
  const { id } = req.params;
  try {
    const staff = await Staff.findById(id); // ✅ use findById
    if (!staff) {
      return res.status(404).json({ message: "Staff not found" });
    }
    res.json(staff); // return the actual object
  } catch (err) {
    console.error("Error fetching staff:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateStaff = async (req, res) => {
  const { id } = req.params;
  const { firstName, lastName, email, contactNumber } = req.body;

  try {
    const staff = await Staff.findById(id);

    if (!staff) return res.status(404).json({ message: "Staff not found" });

    staff.firstName = firstName;
    staff.lastName = lastName;
    staff.email = email;
    staff.contactNumber = contactNumber;

    await staff.save();

    res.json(staff); // return the updated student with _id
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
