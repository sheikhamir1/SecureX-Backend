const express = require("express");
const router = express.Router();
const User = require("../Model/User"); // Import User model
const { body, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const CheckIfUserLoggedIn = require("../Middleware/Middleware");

// Route to get the profile of the logged-in user
router.get("/fetchprofile", CheckIfUserLoggedIn, async (req, res) => {
  try {
    const userId = req.user.user.id; // Extract user ID from the token
    const user = await User.findById(userId).select(
      "-password -documents -createdAt -updatedAt -__v"
    );

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    res.status(200).json({ success: true, user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Route to update the profile of the logged-in user
router.put(
  "/updateprofile",
  CheckIfUserLoggedIn,
  [
    body("name").optional().not().isEmpty().withMessage("Name cannot be empty"),
    body("email").optional().isEmail().withMessage("Invalid email format"),
    body("phone")
      .optional()
      .isMobilePhone()
      .withMessage("Invalid phone number"),
    body("password")
      .optional()
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters long"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const userId = req.user.user.id; // Extract user ID from the token
      const { aadhaarNumber, name, email, phone } = req.body;

      let updatedFields = {};
      if (aadhaarNumber) updatedFields.aadhaarNumber = aadhaarNumber;
      if (name) updatedFields.name = name;
      if (email) updatedFields.email = email;
      if (phone) updatedFields.phone = phone;

      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $set: updatedFields },
        { new: true, runValidators: true }
      );

      if (!updatedUser) {
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }

      res.status(200).json({
        success: true,
        message: "Profile updated successfully",
        // user: updatedUser,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

module.exports = router;
