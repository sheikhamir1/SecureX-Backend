const express = require("express");
const router = express.Router();
const User = require("../Model/User"); // Adjust the path as needed
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const { validationResult } = require("express-validator");
const userRegisterValidator = require("../Validator/RegisterValidator");
const userLoginValidator = require("../Validator/LoginValidator");
const JWT_SECRET_KEY = process.env.JWT_ACCESS_TOKEN;

// Setup Nodemailer transport
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASS,
  },
});

// Register a new user
router.post("/register", userRegisterValidator, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { aadhaarNumber, name, email, password, phone } = req.body;

  try {
    // Check if the user already exists
    let user = await User.findOne({ aadhaarNumber });
    if (user) {
      return res
        .status(400)
        .json({ success: false, message: "User already exists" });
    }

    user = await User.findOne({ email });
    if (user) {
      return res
        .status(400)
        .json({ success: false, message: "Email already in use" });
    }

    if (!aadhaarNumber || !name || !email || !password || !phone) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create a new user
    user = new User({
      aadhaarNumber,
      name,
      email,
      password: hashedPassword,
      phone,
    });

    // Save the user to the database
    await user.save();

    // Send verification email
    const token = crypto.randomBytes(20).toString("hex").toLowerCase();
    user.emailVerificationToken = token;
    user.emailVerificationExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    const verificationURL = `http://localhost:5173/verifyemail/${token}`;
    const mailOptions = {
      from: process.env.EMAIL,
      to: user.email,
      subject: "Verify Your Email Address",
      html: `<h1>Hi ${user.name},</h1>
             <p>Thank you for registering!</p>
             <p>Please verify your email address by clicking the link below:</p>
             <a href=${verificationURL}>${verificationURL}</a>
             <p>If you did not create an account, please ignore this email.</p>
             <p>Best regards,<br>Your Team</p>`,
    };

    transporter.sendMail(mailOptions, async (err, info) => {
      if (err) {
        console.log("Error sending email: " + err);
        return res.status(500).json({
          success: false,
          message: "Error sending verification email",
        });
      } else {
        console.log("Email sent: " + info.response);
        await user.save();
        return res.status(200).json({
          success: true,
          message: "Registration successful. Please verify your email.",
        });
      }
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Server error during registration" });
  }
});

// Email verification route
router.get("/verifyemail/:token", async (req, res) => {
  const { token } = req.params;

  try {
    const user = await User.findOne({
      emailVerificationToken: token.trim().toLowerCase(),
      emailVerificationExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Verification token is invalid or has expired.",
      });
    }

    // Mark the user as verified
    user.isVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;

    await user.save();

    res.status(200).json({
      success: true,
      message: "Email has been verified. You can now log in.",
    });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during email verification",
    });
  }
});

// User login route
router.post("/login", userLoginValidator, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "User not found" });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message: "Email not verified. Please verify to log in.",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid credentials" });
    }

    const payload = {
      user: {
        id: user._id,
        // aadhaarNumber: user.aadhaarNumber,
      },
    };

    const token = jwt.sign(payload, JWT_SECRET_KEY, { expiresIn: "1h" });

    res.status(200).json({
      success: true,
      token,
      message: "User logged in successfully",
      user: user._id,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Server error during login" });
  }
});

module.exports = router;
