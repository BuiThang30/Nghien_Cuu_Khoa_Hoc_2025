const express = require("express");
const router = express.Router();
const { db } = require("../db");

// --- Biến lưu dữ liệu sensor tạm thời ---
let latestSensorData = {};

// --- API nhận dữ liệu cảm biến từ ESP ---
router.post("/data", (req, res) => {
  try {
    const {
      location_id = null,
      temperature,
      humidity,
      pm1_0,
      pm2_5,
      pm10,
      noise,
    } = req.body;

    if (
      temperature === undefined ||
      humidity === undefined ||
      pm1_0 === undefined ||
      pm2_5 === undefined ||
      pm10 === undefined ||
      noise === undefined
    ) {
      return res.status(400).json({ message: "❌ Thiếu dữ liệu cảm biến!" });
    }

    // Cập nhật dữ liệu mới nhất
    latestSensorData = {
      location_id,
      temperature,
      humidity,
      pm1_0,
      pm2_5,
      pm10,
      noise,
      timestamp: new Date().toISOString(),
    };

    console.log("📥 Nhận dữ liệu cảm biến:", latestSensorData);

    // --- Lưu vào CSDL ---
    db.run(
      `INSERT INTO sensors(
        location_id, temperature, humidity, pm1_0, pm2_5, pm10, noise
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [location_id, temperature, humidity, pm1_0, pm2_5, pm10, noise],
      function (err) {
        if (err) {
          console.error("❌ Lỗi khi lưu dữ liệu:", err.message);
          return res.status(500).json({ error: err.message });
        }
        console.log(`✅ Đã lưu bản ghi ID: ${this.lastID}`);
        res.json({
          message: "✅ Dữ liệu đã được nhận và lưu thành công",
          id: this.lastID,
          data: latestSensorData,
        });
      }
    );
  } catch (error) {
    console.error("❌ JSON lỗi:", error.message);
    res.status(400).json({ error: "Invalid JSON format" });
  }
});

// --- API trả về bản ghi mới nhất ---
router.get("/latest", (req, res) => {
  db.get(
    "SELECT * FROM sensors ORDER BY timestamp DESC LIMIT 1",
    [],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(row || { message: "Chưa có dữ liệu cảm biến nào!" });
    }
  );
});

// --- API trả về lịch sử 10 bản ghi gần nhất ---
router.get("/history", (req, res) => {
  db.all(
    `SELECT * FROM (SELECT * FROM sensors ORDER BY timestamp DESC LIMIT 10) sub 
     ORDER BY timestamp ASC`,
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

module.exports = router;
