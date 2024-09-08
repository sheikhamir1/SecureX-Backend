const { body } = require("express-validator");

const userRegisterValidator = [
  body("name")
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 6, max: 20 })
    .withMessage("Name must be between 6 and 20 characters"),

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

  body("phone")
    .notEmpty()
    .withMessage("Phone number is required")
    .isNumeric()
    .withMessage("Phone number must be numeric")
    .isLength({ min: 10, max: 15 })
    .withMessage("Phone number must be between 10 and 15 digits"),
];

module.exports = userRegisterValidator;
