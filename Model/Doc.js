const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema(
  {
    documentName: {
      type: String,
      required: true,
    },
    documentType: {
      type: String,
      required: true,
      enum: [
        "Mark Sheet",
        "PAN Card",
        "Passport",
        "Driver's License",
        "Voter ID Card",
        "Degree Certificates",
        "Bank Statements",
        "Income Tax Returns",
        "Insurance Policies",
        "Health Insurance Documents",
        "Birth Certificates",
        "Other",
      ],
    },
    documentUrl: {
      type: String,
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    }, // Ensure this field is marked as required

    sharedWith: [
      {
        aadhaarNumber: String,
        name: String,
        relation: String,
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Document", documentSchema);
