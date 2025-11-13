const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("./database.db");

db.serialize(() => {
  // Bảng người dùng
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      role TEXT DEFAULT 'user', /* 'admin' hoặc 'user' */
      username TEXT UNIQUE,
      password TEXT,
      email TEXT,
      first_name TEXT,
      last_name TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS sensors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      temperature REAL,
      humidity REAL,
      co2 REAL,
      pm1_0 REAL,
      pm2_5 REAL,
      pm10 REAL,
      noise REAL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

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

  db.run(`
    CREATE TABLE IF NOT EXISTS traffic_images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      location_name TEXT,
      image_path TEXT,
      captured_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);


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
});

module.exports = { db };
