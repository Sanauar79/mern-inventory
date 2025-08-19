import express from "express";
import multer from "multer";
import cloudinary from "../config/cloudinary.js";
import fs from "fs";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post("/", upload.single("image"), async (req, res) => {
  try {
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "inventory",
    });
    fs.unlinkSync(req.file.path); // delete local file after upload

    res.json({ imageUrl: result.secure_url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
