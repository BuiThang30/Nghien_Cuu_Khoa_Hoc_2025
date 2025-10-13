const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("./database.db");

db.run("DELETE FROM sensors", function (err) {
  if (err) {
    console.error("❌ Lỗi khi xóa dữ liệu:", err.message);
  } else {
    console.log(`🧹 Đã xóa toàn bộ dữ liệu trong bảng sensors.`);
  }

  db.close();
});
