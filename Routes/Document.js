const express = require("express");
const router = express.Router();
const { v2: cloudinary } = require("cloudinary");
const multer = require("multer");
const Document = require("../Model/Doc"); // Import Document model
const User = require("../Model/User"); // Import User model
const { validationResult } = require("express-validator");
// const documentValidator = require("../Validations/DocumentValidator");
const CheckIfUserLoggedIn = require("../Middleware/Middleware");

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
  secure: true,
});

const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post(
  "/upload",
  CheckIfUserLoggedIn,
  upload.single("file"),
  //   documentValidator,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const userId = req.user.user.id;
    // console.log("userid in route", userId);
    // console.log("req.file", req.file);

    const { documentName, documentType } = req.body;

    try {
      // Check if the user exists
      const user = await User.findById(userId);
      if (!user) {
        return res
          .status(400)
          .json({ success: false, message: "User not found" });
      }

      //   console.log("this is user in route", user);

      // Check if file is provided
      const file = req.file;
      if (!file) {
        return res
          .status(400)
          .json({ success: false, message: "File is required" });
      }

      //   console.log("this is file in route", file);

      // Upload the file to Cloudinary
      const uploadResult = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { resource_type: "auto" },
          (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve(result);
            }
          }
        );

        uploadStream.end(file.buffer);
      });
      //   console.log("uploadResult", uploadResult);

      // Save the file information to MongoDB
      const newDocument = new Document({
        documentName,
        documentType,
        documentUrl: uploadResult.secure_url,
        sharedWith: [],
      });

      //   console.log("new document", newDocument);

      const savedDocument = await newDocument.save();

      // Update user with new document
      user.documents.push(savedDocument._id);
      await user.save();

      res.status(200).json({
        success: true,
        message: "Document uploaded successfully",
        // document: savedDocument,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: "Server error during document upload",
      });
    }
  }
);

// fectch all documents
router.get("/fetchdoc", CheckIfUserLoggedIn, async (req, res) => {
  const userId = req.user.user.id;
  try {
    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "User not found" });
    }
    const documents = await Document.find({ _id: { $in: user.documents } });
    res.status(200).json({ success: true, documents });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Update document details
router.put(
  "/updatedoc/:id",
  CheckIfUserLoggedIn,
  upload.single("file"),
  async (req, res) => {
    const { id } = req.params; // Document ID
    const userId = req.user.user.id; // User ID
    const { documentName, documentType } = req.body; // New document details

    // console.log("Request Body:", req.body);
    // console.log("Request File:", req.file);

    try {
      const user = await User.findById(userId);
      if (!user) {
        return res
          .status(400)
          .json({ success: false, message: "User not found" });
      }

      const document = await Document.findById(id);
      if (!document) {
        return res
          .status(400)
          .json({ success: false, message: "Document not found" });
      }

      // Update document fields if provided
      if (documentName) document.documentName = documentName;
      if (documentType) document.documentType = documentType;

      // Check if a new file is provided for updating
      if (req.file) {
        // Upload new file to Cloudinary
        const uploadResult = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            { resource_type: "auto" },
            (error, result) => {
              if (error) {
                reject(error);
              } else {
                resolve(result);
              }
            }
          );
          uploadStream.end(req.file.buffer);
        });

        // Update document URL with the new file URL
        document.documentUrl = uploadResult.secure_url;
      }

      // Save updated document to the database
      const updatedDocument = await document.save();

      res.status(200).json({
        success: true,
        message: "Document updated successfully",
        document: updatedDocument,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: "Server error during document update",
      });
    }
  }
);

// delete document
router.delete("/deletedoc/:id", CheckIfUserLoggedIn, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  const userId = req.user.user.id;
  const { id } = req.params;
  try {
    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "User not found" });
    }
    const deletedDocument = await Document.findByIdAndDelete(id);
    if (!deletedDocument) {
      return res
        .status(400)
        .json({ success: false, message: "Document not found" });
    }
    res.status(200).json({
      success: true,
      message: "Document deleted successfully",
      document: deletedDocument,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error during document deletion",
    });
  }
});

module.exports = router;
