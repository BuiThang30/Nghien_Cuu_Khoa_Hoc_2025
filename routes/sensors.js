const express = require("express");
const router = express.Router();
const { db } = require("../db");

// --- Biến lưu dữ liệu sensor tạm thời ---
let latestSensorData = {};
let counter = 0;

// --- Nhận dữ liệu cảm biến từ ESP ---
router.post("/data", (req, res) => {
  try {
    const {
      temperature,
      humidity,
      co2,
      pm1_0,
      pm2_5,
      pm10,
      noise,
    } = req.body;

    if (
      temperature === undefined ||
      humidity === undefined ||
      co2 === undefined ||
      pm1_0 === undefined ||
      pm2_5 === undefined ||
      pm10 === undefined ||
      noise === undefined
    ) {
      return res.status(400).json({ message: "❌ Thiếu dữ liệu cảm biến!" });
    }

    latestSensorData = {
      temperature,
      humidity,
      co2,
      pm1_0,
      pm2_5,
      pm10,
      noise,
      timestamp: new Date().toISOString(),
    };

    // --- Lưu vào database ---
    db.run(
      `INSERT INTO sensors(
        temperature, humidity, co2, pm1_0, pm2_5, pm10, noise
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [temperature, humidity, co2, pm1_0, pm2_5, pm10, noise],
      function (err) {
        if (err) {
          console.error("❌ Lỗi khi lưu dữ liệu:", err.message);
          return res.status(500).json({ error: err.message });
        }

        counter++;

        if (counter % 10 === 0) {
          console.log(`Đã nhận ${counter} gói dữ liệu (in mỗi 10 lần):`);
          console.log("Dữ liệu mới nhất:", latestSensorData);
        }

        res.json({
          message: "Dữ liệu đã được nhận và lưu thành công",
          count: counter,
          id: this.lastID,
        });
      }
    );
  } catch (error) {
    console.error("JSON lỗi:", error.message);
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

// --- API trả về giá trị Min/Max ---
router.get("/minmax", (req, res) => {
  const query = `
    SELECT
      MIN(temperature) AS temp_min, MAX(temperature) AS temp_max,
      MIN(humidity) AS hum_min, MAX(humidity) AS hum_max,
      MIN(co2) AS co2_min, MAX(co2) AS co2_max,
      MIN(pm1_0) AS pm1_min, MAX(pm1_0) AS pm1_max,
      MIN(pm2_5) AS pm25_min, MAX(pm2_5) AS pm25_max,
      MIN(pm10) AS pm10_min, MAX(pm10) AS pm10_max,
      MIN(noise) AS noise_min, MAX(noise) AS noise_max
    FROM sensors
  `;

  db.get(query, [], (err, row) => {
    if (err) {
      console.error("❌ Lỗi khi truy vấn min/max:", err.message);
      return res.status(500).json({ error: err.message });
    }

    if (!row) {
      return res.json({ message: "Chưa có dữ liệu cảm biến!" });
    }

    const result = {
      temperature: { min: row.temp_min, max: row.temp_max },
      humidity: { min: row.hum_min, max: row.hum_max },
      co2: { min: row.co2_min, max: row.co2_max },
      pm1: { min: row.pm1_min, max: row.pm1_max },
      pm25: { min: row.pm25_min, max: row.pm25_max },
      pm10: { min: row.pm10_min, max: row.pm10_max },
      noise: { min: row.noise_min, max: row.noise_max },
    };

    res.json(result);
  });
});

module.exports = router;