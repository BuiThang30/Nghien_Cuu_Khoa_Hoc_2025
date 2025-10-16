// ======================
// SEED DỮ LIỆU MẪU CHO pi_data
// ======================

const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("./database.db");

// Danh sách địa điểm (giống trong front-end)
const locations = [
  { name: "Ngã Tư Sở" },
  { name: "Ngã Tư Viện Nhi" },
  { name: "Ngã Tư Cầu Giấy" },
  { name: "Ngã Tư Kim Mã" },
  { name: "Ngã Tư Nguyễn Chí Thanh" },
  { name: "Ngã Tư Trung Kính" },
  { name: "Ngã Tư Chùa Bộc" },
];

// Hàm tạo giá trị ngẫu nhiên trong khoảng
function random(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Tạo dữ liệu mẫu
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS pi_data (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      location_name TEXT,
      count INTEGER,
      time_green TEXT,
      time_red TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const stmt = db.prepare(`
    INSERT INTO pi_data (location_name, count, time_green, time_red)
    VALUES (?, ?, ?, ?)
  `);

  locations.forEach(loc => {
    const count = random(5, 40);              // số lượng xe (ngẫu nhiên)
    const green = `${random(15, 35)}s`;       // thời gian đèn xanh
    const red = `${random(25, 50)}s`;         // thời gian đèn đỏ
    stmt.run(loc.name, count, green, red);
    console.log(`✅ Đã thêm dữ liệu cho ${loc.name}`);
  });

  stmt.finalize();
});

db.close(() => {
  console.log("\n🌱 Hoàn tất tạo dữ liệu mẫu pi_data!\n");
});
