const express = require("express");
const router = express.Router();
const sqlite3 = require("sqlite3").verbose();

const multer = require("multer");
const path = require("path");
const fs = require("fs");

// ================== DATABASE ==================
const db = new sqlite3.Database("./database.db");

// ================== TẠO THƯ MỤC ==================
const uploadDir = "uploads";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// ================== CẤU HÌNH MULTER ==================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const filename = Date.now() + path.extname(file.originalname);
    cb(null, filename);
  },
});

const upload = multer({ storage: storage });

// ================== API UPLOAD ==================
router.post("/", upload.single("image"), (req, res) => {
  const locationName = req.body.location_name || "Unknown";

  if (!req.file) {
    return res.status(400).json({ message: "Không có ảnh" });
  }

  const imagePath = req.file.path;

  db.run(
    `INSERT INTO traffic_images (location_name, image_path) VALUES (?, ?)`,
    [locationName, imagePath],
    function (err) {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: "Lỗi lưu DB" });
      }

      res.json({
        message: "Upload + lưu DB thành công",
        id: this.lastID,
        image_path: imagePath,
      });
    }
  );
});

// ================== GET DANH SÁCH ==================
router.get("/", (req, res) => {
  db.all(
    `SELECT * FROM traffic_images ORDER BY captured_at DESC`,
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ message: "Lỗi DB" });
      }
      res.json(rows);
    }
  );
});

module.exports = router;