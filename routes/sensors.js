const express = require("express");
const router = express.Router();

let latestSensorData = {};

// ✅ API nhận dữ liệu từ ESP32
router.post("/data", (req, res) => {
  const { pm1, pm2_5, pm10, co2, temperature, humidity, noise } = req.body;

  // Kiểm tra dữ liệu có đầy đủ không
  if (
    pm1 === undefined ||
    pm2_5 === undefined ||
    pm10 === undefined ||
    co2 === undefined ||
    temperature === undefined ||
    humidity === undefined ||
    noise === undefined
  ) {
    return res.status(400).json({ message: "❌ Thiếu dữ liệu cảm biến!" });
  }

  latestSensorData = {
    pm1,
    pm2_5,
    pm10,
    co2,
    temperature,
    humidity,
    noise,
    timestamp: new Date().toISOString(),
  };

  console.log("📥 Nhận dữ liệu từ ESP:", latestSensorData);

  res.json({
    message: "✅ Dữ liệu đã được nhận thành công",
    data: latestSensorData,
  });
});

router.get("/", (req, res) => {
  if (Object.keys(latestSensorData).length === 0) {
    return res.json({ message: "⚠️ Chưa có dữ liệu cảm biến nào!" });
  }

  res.json({
    message: "📤 Dữ liệu sensor hiện tại",
    data: latestSensorData,
  });
});

module.exports = router;
