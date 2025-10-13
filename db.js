const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.db');

db.serialize(() => {
  // Bảng người dùng
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT,
      email TEXT,
      first_name TEXT,
      last_name TEXT
    )
  `);

  // Bảng dữ liệu cảm biến
  db.run(`
    CREATE TABLE IF NOT EXISTS sensors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      location_id INTEGER,
      temperature REAL,
      humidity REAL,
      pm1_0 REAL,
      pm2_5 REAL,
      pm10 REAL,
      noise REAL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Bảng đèn giao thông
  db.run(`
    CREATE TABLE IF NOT EXISTS traffic_lights (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      location_name TEXT,
      green_time INTEGER,
      yellow_time INTEGER,
      red_time INTEGER,
      last_update DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Bảng ảnh lưu lượng xe
  db.run(`
    CREATE TABLE IF NOT EXISTS traffic_images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      location_name TEXT,
      image_path TEXT,
      captured_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log("✅ Database initialized successfully.");
});

db.close();
