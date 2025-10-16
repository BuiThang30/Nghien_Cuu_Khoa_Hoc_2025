const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const router = express.Router();

// === Kết nối SQLite ===
const dbPath = path.join(__dirname, "../database.db");
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error("❌ Lỗi kết nối DB:", err.message);
  else console.log("✅ Đã kết nối database:", dbPath);
});

// === Đảm bảo bảng tồn tại ===
db.run(`
  CREATE TABLE IF NOT EXISTS pi_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    count INTEGER,
    time_green TEXT,
    time_red TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// === API nhận dữ liệu từ ESP ===
router.post("/data", (req, res) => {
  const { count, time_green, time_red } = req.body;

  if (count === undefined || !time_green || !time_red) {
    return res.status(400).json({ message: "Thiếu dữ liệu hoặc sai định dạng!" });
  }

  const query = `
    INSERT INTO pi_data (count, time_green, time_red)
    VALUES (?, ?, ?)
  `;

  db.run(query, [count, time_green, time_red], function (err) {
    if (err) {
      console.error("❌ Lỗi lưu dữ liệu:", err.message);
      return res.status(500).json({ message: "Lỗi khi lưu dữ liệu!" });
    }

    console.log(`📥 ESP gửi -> count=${count}, green=${time_green}, red=${time_red}`);
    res.json({ message: "✅ Lưu dữ liệu thành công!", id: this.lastID });
  });
});

// === API xem toàn bộ dữ liệu ===
router.get("/select", (req, res) => {
  db.all("SELECT * FROM pi_data ORDER BY id DESC", [], (err, rows) => {
    if (err) return res.status(500).json({ message: "Lỗi truy vấn dữ liệu!" });
    res.json(rows);
  });
});

// === API lấy bản ghi mới nhất ===
router.get("/latest", (req, res) => {
  db.all(`
    SELECT location_name, count, time_green, time_red
    FROM pi_data
    WHERE id IN (SELECT MAX(id) FROM pi_data GROUP BY location_name)
  `, (err, rows) => {
    if (err) res.status(500).json({ error: err.message });
    else res.json(rows);
  });
});

module.exports = router;
