// controllers/attendanceController.js
const Attendance = require("../models/attendance");
const User = require("../models/user"); // Optional: only if you want to check if the user exists

const Student = require("../models/user");
const Professor = require("../models/professor");
const Staff = require("../models/staffs");

const Schedule = require("../models/schedule");

const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");
dayjs.extend(utc);
dayjs.extend(timezone);

exports.recordAttendance = async (req, res) => {
  const { identifier, role } = req.body;

  // Always use PH timezone (start from UTC)
  const now = dayjs.utc().tz("Asia/Manila");
  const date = now.format("YYYY-MM-DD");
  const currentTime = now.format("HH:mm");
  console.log("DEBUG NOW:", now.format()); // full timestamp with timezone
  console.log("DEBUG CURRENT TIME:", currentTime);

  try {
    let user;

    if (role === "student") {
      user = await Student.findOne({ studentNumber: identifier });
    } else if (role === "professor") {
      user = await Professor.findOne({ profNumber: identifier });
    } else if (role === "staff") {
      user = await Staff.findOne({ staffNumber: identifier });
    }

    if (!user) return res.status(404).json({ message: "User not found" });

    let record = await Attendance.findOne({ userId: user._id, role, date });

    // default status
    let status = "On Time";

    // get schedule if student
    let schedule = null;
    if (role === "student") {
      schedule = await Schedule.findOne({
        course: user.course,
        yearLevel: user.year,
      });
    }

    if (role === "student" && schedule && currentTime > schedule.endTime) {
      return res
        .status(400)
        .json({ message: "Class already ended. Cannot scan attendance." });
    }

    // TIME IN
    // TIME IN
    if (!record) {
      if (role === "student" && schedule) {
        const today = date; // already YYYY-MM-DD from now
        const start = dayjs(`${today}T${schedule.startTime}`); // e.g., 2025-11-20T07:00
        const actual = dayjs(`${today}T${currentTime}`); // e.g., 2025-11-20T09:53

        const diffMinutes = actual.diff(start, "minute");

        if (diffMinutes >= 15) {
          status = "Cutting"; // 15+ mins late
        } else if (diffMinutes > 0) {
          status = "Late"; // <15 mins late
        }
      }

      record = new Attendance({
        userId: user._id,
        role,
        date,
        timeIn: currentTime,
        status,
      });

      await record.save();
      return res.status(201).json({ message: `${role} time-in`, record });
    }

    // TIME OUT
    // TIME OUT
    if (!record.timeOut) {
      record.timeOut = currentTime;

      if (role === "student" && schedule) {
        const start = dayjs(schedule.startTime, "HH:mm");
        const end = dayjs(schedule.endTime, "HH:mm");

        const timeIn = dayjs(record.timeIn, "HH:mm");
        const timeOut = dayjs(currentTime, "HH:mm");

        const diffIn = timeIn.diff(start, "minute");
        const leftEarly = timeOut.isBefore(end);

        const late0to14 = diffIn > 0 && diffIn < 15;
        const late15plus = diffIn >= 15;

        // 15+ mins late
        if (late15plus) {
          record.status = leftEarly ? "Late & Cutting" : "Cutting";
        }
        // 1–14 mins late
        else if (late0to14) {
          record.status = leftEarly ? "Late & Cutting" : "Late";
        }
        // On time
        else {
          record.status = leftEarly ? "Cutting" : "On Time";
        }
      }

      await record.save();
      return res.status(200).json({ message: `${role} time-out`, record });
    }

    res.status(409).json({ message: "Attendance already completed" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

//this was being used in the dashboard to get summary of attendance
exports.getAttendanceSummary = async (req, res) => {
  try {
    const { year, section, role } = req.query; // role: student | professor | staff

    if (!role || !["student", "professor", "staff"].includes(role)) {
      return res
        .status(400)
        .json({ message: "Role is required: student, professor, staff" });
    }

    let totalUsers = 0;
    if (role === "student") {
      totalUsers = await User.countDocuments({
        ...(year && { year }),
        ...(section && { course: section }),
      });
    } else if (role === "professor") {
      totalUsers = await Professor.countDocuments();
    } else if (role === "staff") {
      totalUsers = await Staff.countDocuments();
    }

    let UserModel;
    let populateFields = "";

    // Determine which model to use
    if (role === "student") {
      UserModel = require("../models/user"); // Adjust path
      populateFields = "firstName lastName year course";
    } else if (role === "professor") {
      UserModel = "../models/professor";
      populateFields = "firstName lastName email contactNumber";
    } else if (role === "staff") {
      UserModel = require("../models/staffs");
      populateFields = "firstName lastName email contactNumber";
    }

    // Fetch all attendance records for the given role
    const modelMap = {
      student: "User",
      professor: "Professor",
      staff: "Staffs",
    };

    const records = await Attendance.find({ role }).populate({
      path: "userId",
      model: modelMap[role],
      select: populateFields,
    });

    const userMap = {};
    const uniqueDates = new Set();
    const today = new Date().toISOString().split("T")[0];
    let totalPresentToday = 0;

    records.forEach((record) => {
      const user = record.userId;
      if (!user) return;

      // Filter for students by year/section
      if (role === "student") {
        if (
          (year && user.year !== year) ||
          (section && user.course !== section)
        ) {
          return;
        }
      }

      const recordDate = new Date(record.date).toISOString().split("T")[0];
      uniqueDates.add(recordDate);

      // Count today's presence
      if (recordDate === today) totalPresentToday += 1;

      if (!userMap[user._id]) {
        userMap[user._id] = {
          name: user.firstName + " " + user.lastName,
          year: user.year || "-",
          section: user.course || "-",
          present: 0,
          attendanceRecords: [],
        };

        // For professors/staff, no year/section
        if (role !== "student") {
          delete userMap[user._id].year;
          delete userMap[user._id].section;
        }
      }

      userMap[user._id].present += 1;
      userMap[user._id].attendanceRecords.push({
        date: record.date,
        timeIn: record.timeIn || "N/A",
        timeOut: record.timeOut || "N/A",
      });
    });

    const totalDays = uniqueDates.size;

    const summary = Object.values(userMap).map((user) => {
      const absent = totalDays - user.present;
      const rate =
        totalDays === 0
          ? "0%"
          : ((user.present / totalDays) * 100).toFixed(1) + "%";
      return { ...user, absent, rate };
    });

    let absentToday = 0;
    if (totalDays > 0) {
      absentToday = totalUsers - totalPresentToday;
    }

    res.json({
      summary,
      totalDays,
      totalUsers,
      totalPresentToday,
      absentToday,
    });
  } catch (error) {
    console.error("Error in getAttendanceSummary:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// In attendanceController.js
exports.getTodayPresent = async (req, res) => {
  const today = new Date().toISOString().split("T")[0];
  console.log("Looking for records with date:", today);

  try {
    const { year, section, role } = req.query; // role: student | professor | staff

    if (!role || !["student", "professor", "staff"].includes(role)) {
      return res.status(400).json({
        message: "Role is required: student, professor, or staff",
      });
    }

    // 🧩 Map each role to its model + fields to populate
    const modelMap = {
      student: {
        model: "User", // Your User model handles students
        fields: "firstName lastName year course",
      },
      professor: {
        model: "Professor",
        fields: "firstName lastName email contactNumber",
      },
      staff: {
        model: "Staffs",
        fields: "firstName lastName email contactNumber",
      },
    };

    const { model, fields } = modelMap[role];

    // 🕐 Find attendance for today with correct model reference
    const presentRecords = await Attendance.find({
      date: today,
      role: role, // ensure role matches
    }).populate({
      path: "userId",
      model, // dynamic ref
      select: fields,
    });

    console.log(`Found ${presentRecords.length} records for role: ${role}`);

    // 🧠 Filter (for students only)
    const filtered = presentRecords.filter((record) => {
      if (!record.userId) {
        console.warn("⚠️ Missing userId for record:", record._id);
        return false;
      }

      if (role === "student") {
        const user = record.userId;
        const matchesYear = year ? user.year === year : true;
        const matchesSection = section ? user.course === section : true;
        return matchesYear && matchesSection;
      }

      return true; // for professor/staff, no extra filter
    });

    // 🧾 Format output
    const formatted = filtered.map((record) => {
      const user = record.userId;
      const base = {
        timeIn: record.timeIn || "N/A",
        timeOut: record.timeOut || "N/A",
        user: {
          firstName: user.firstName || "",
          lastName: user.lastName || "",
        },
      };

      if (role === "student") {
        base.user.year = user.year || "";
        base.user.course = user.course || "";
      } else {
        base.user.email = user.email || "";
        base.user.contactNumber = user.contactNumber || "";
      }

      return base;
    });

    res.json({
      date: today,
      role,
      totalPresent: formatted.length,
      records: formatted,
    });
  } catch (error) {
    console.error("❌ Error in getTodayPresent:", error);
    res.status(500).json({ message: "Error fetching present records" });
  }
};

//used to fetcch attendance no matter what users are
exports.getUserAttendance = async (req, res) => {
  try {
    const { id } = req.params; // MongoDB _id
    const { role, date } = req.query;

    if (!role || !["student", "professor", "staff"].includes(role)) {
      return res
        .status(400)
        .json({ message: "Valid role is required: student, professor, staff" });
    }

    const query = { userId: id, role };

    // If filtering by a single date
    if (date) {
      // Assuming your `date` field in Mongo is stored as "YYYY-MM-DD"
      query.date = date;
    }

    const records = await Attendance.find(query).sort({ date: -1 });

    if (!records.length) {
      return res.status(404).json({ message: "No attendance records found" });
    }

    res.json(records);
  } catch (error) {
    console.error("Error fetching user attendance:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getDailyAttendanceSummary = async (req, res) => {
  try {
    const { role, year, section, startDate, endDate } = req.query;

    const modelMap = {
      student: "User",
      professor: "Professor",
      staff: "Staffs",
    };

    const query = { role };

    // Date range filtering
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = startDate;
      if (endDate) query.date.$lte = endDate;
    }

    const records = await Attendance.find(query).populate({
      path: "userId",
      model: modelMap[role],
    });

    // --- 🧮 Count totals only when valid filters exist ---
    let totalUsers = 0;
    let filterApplied = false;

    if (role === "student") {
      const User = require("../models/user");
      const userQuery = {};

      if (year && year !== "All") {
        userQuery.year = year;
        filterApplied = true;
      }
      if (section && section !== "All") {
        userQuery.course = section;
        filterApplied = true;
      }

      // 🟢 Only count users if filters are applied (year & section)
      if (filterApplied) {
        totalUsers = await User.countDocuments(userQuery);
      } else {
        console.warn(
          "⚠️ Skipping absent count — student query missing year/section filters."
        );
      }
    } else if (role === "professor") {
      const Professor = require("../models/professor");
      totalUsers = await Professor.countDocuments();
    } else if (role === "staff") {
      const Staff = require("../models/staffs");
      totalUsers = await Staff.countDocuments();
    }

    // --- 🧾 Aggregate by date & status ---
    const dailyMap = {};

    records.forEach((record) => {
      if (!record.userId) return;

      const user = record.userId;

      // 🔹 Filter student by section/year before counting
      if (role === "student") {
        if (
          (year && year !== "All" && user.year !== year) ||
          (section && section !== "All" && user.course !== section)
        ) {
          return; // Skip if not in selected section/year
        }
      }

      const dateKey = new Date(record.date).toISOString().split("T")[0];

      if (!dailyMap[dateKey]) {
        dailyMap[dateKey] = {
          onTime: 0,
          lateOnly: 0,
          cuttingOnly: 0,
          lateAndCutting: 0,
          absent: 0,
        };
      }

      switch (record.status) {
        case "On Time":
          dailyMap[dateKey].onTime += 1;
          break;
        case "Late":
          dailyMap[dateKey].lateOnly += 1;
          break;
        case "Cutting":
          dailyMap[dateKey].cuttingOnly += 1;
          break;
        case "Late & Cutting":
          dailyMap[dateKey].lateAndCutting += 1;
          break;
        default:
          break;
      }
    });

    // --- 📅 Final Summary Build ---
    const dailySummary = Object.keys(dailyMap)
      .sort()
      .map((date) => {
        const counts = dailyMap[date];
        const totalPresent =
          counts.onTime +
          counts.lateOnly +
          counts.cuttingOnly +
          counts.lateAndCutting;

        // 🟡 Only compute absents if totalUsers known (filters applied)
        const absent = totalUsers > 0 ? totalUsers - totalPresent : "N/A";

        return {
          date,
          onTime: counts.onTime,
          lateOnly: counts.lateOnly,
          cuttingOnly: counts.cuttingOnly,
          lateAndCutting: counts.lateAndCutting,
          present: totalPresent,
          absent,
        };
      });

    res.json(dailySummary);
  } catch (error) {
    console.error("❌ Error in getDailyAttendanceSummary:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getAttendanceByDate = async (req, res) => {
  try {
    const { date, role, year, section } = req.query;

    if (!date || !role) {
      return res.status(400).json({
        message:
          "Date and role are required (e.g. ?date=YYYY-MM-DD&role=student)",
      });
    }

    const modelMap = {
      student: { model: "User", fields: "firstName lastName year course" },
      professor: {
        model: "Professor",
        fields: "firstName lastName email contactNumber",
      },
      staff: {
        model: "Staffs",
        fields: "firstName lastName email contactNumber",
      },
    };

    if (!modelMap[role]) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const { model, fields } = modelMap[role];

    // 🔍 Get attendance for the specified date and role
    const records = await Attendance.find({ date, role }).populate({
      path: "userId",
      model,
      select: fields,
    });

    // 🎯 Filter only for specific year & section if student
    const filtered = records.filter((record) => {
      if (!record.userId) return false;
      if (role === "student") {
        const user = record.userId;
        const matchesYear = year ? user.year === year : true;
        const matchesSection = section ? user.course === section : true;
        return matchesYear && matchesSection;
      }
      return true;
    });

    // 🧾 Format the response neatly
    const formatted = filtered.map((record, index) => {
      const user = record.userId;
      return {
        no: index + 1,
        name: `${user.firstName} ${user.lastName}`,
        ...(role === "student"
          ? {
              year: user.year || "-",
              course: user.course || "-",
            }
          : {
              email: user.email || "-",
              contactNumber: user.contactNumber || "-",
            }),
        timeIn: record.timeIn || "N/A",
        timeOut: record.timeOut || "N/A",
        status: record.status || "N/A",
      };
    });

    res.json({
      date,
      role,
      totalPresent: formatted.length,
      records: formatted,
    });
  } catch (error) {
    console.error("❌ Error in getAttendanceByDate:", error);
    res.status(500).json({ message: "Server error" });
  }
};
