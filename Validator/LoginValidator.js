const { body } = require("express-validator");

const userLoginValidator = [
  body("email")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please enter a valid email address"),

  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 8, max: 25 })
    .withMessage("Password must be between 8 and 25 characters"),
];

module.exports = userLoginValidator;
