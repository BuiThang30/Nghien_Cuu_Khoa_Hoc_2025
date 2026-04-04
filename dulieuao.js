const { db } = require("./db");

function getRandomFloat(min, max, decimals = 2) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

// Hàm tạo dữ liệu cảm biến ảo (có thêm CO2)
function generateFakeSensorData() {
  return {
    temperature: getRandomFloat(20, 35),
    humidity: getRandomFloat(40, 90),
    co2: getRandomFloat(350, 500), // đơn vị ppm
    pm1_0: getRandomFloat(5, 50),
    pm2_5: getRandomFloat(10, 30),
    pm10: getRandomFloat(5, 30),
    noise: getRandomFloat(-100, 0),
  };
}

// Tạo 10 mẫu dữ liệu giả
for (let i = 0; i < 10; i++) {
  const data = generateFakeSensorData();

  db.run(
    `INSERT INTO sensors (temperature, humidity, co2, pm1_0, pm2_5, pm10, noise)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      data.temperature,
      data.humidity,
      data.co2,
      data.pm1_0,
      data.pm2_5,
      data.pm10,
      data.noise,
    ],
    function (err) {
      if (err) console.error("Lỗi khi thêm dữ liệu:", err.message);
      else console.log(`Đã thêm dữ liệu ảo ID: ${this.lastID}`);
    }
  );
}

// Đóng DB sau 2 giây
setTimeout(() => {
  db.close();
  console.log("Đã đóng kết nối DB.");
}, 2000);
