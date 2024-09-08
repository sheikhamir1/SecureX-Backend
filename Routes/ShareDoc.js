const express = require("express");
const router = express.Router();
const Document = require("../Model/Doc"); // Import Document model
const User = require("../Model/User"); // Import User model
const CheckIfUserLoggedIn = require("../Middleware/Middleware");

// share the doc
router.post("/share/:documentId", CheckIfUserLoggedIn, async (req, res) => {
  const { documentId } = req.params;
  const { aadhaarNumber, name, relation } = req.body;

  console.log("req.body):", req.body);
  console.log("req.param", req.params);

  try {
    const document = await Document.findById(documentId);
    if (!document) {
      return res
        .status(404)
        .json({ success: false, message: "Document not found" });
    }

    console.log("this is document in route", document);

    document.sharedWith.push({ aadhaarNumber, name, relation });
    await document.save();

    res.status(200).json({
      success: true,
      message: "Document shared successfully",
      document,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error during document sharing",
    });
  }
});

// fetch share doc
router.get("/fetchdoc/:documentId", CheckIfUserLoggedIn, async (req, res) => {
  const { documentId } = req.params;

  // console.log("):", req.params);

  try {
    const document = await Document.findById(documentId);
    if (!document) {
      return res
        .status(404)
        .json({ success: false, message: "Document not found" });
    }

    // console.log("this is document in route", document);

    res.status(200).json({
      success: true,
      sharedWith: document.sharedWith,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error during fetching shared document info",
    });
  }
});

// delete share doc
router.delete(
  "/shareremove/:documentId",
  CheckIfUserLoggedIn,
  async (req, res) => {
    const { documentId } = req.params;
    const { aadhaarNumber } = req.body;

    try {
      const document = await Document.findById(documentId);
      if (!document) {
        return res
          .status(404)
          .json({ success: false, message: "Document not found" });
      }

      document.sharedWith = document.sharedWith.filter(
        (entry) => entry.aadhaarNumber !== aadhaarNumber
      );
      await document.save();

      res.status(200).json({
        success: true,
        message: "Document unshared successfully",
        document,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: "Server error during document unsharing",
      });
    }
  }
);

module.exports = router;
