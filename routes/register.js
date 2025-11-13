const express = require("express");
const bcrypt = require("bcrypt");
const sqlite3 = require("sqlite3").verbose();

const router = express.Router();
const db = new sqlite3.Database("./database.db");

router.post("/register", async (req, res) => {
  const { first_name, last_name, username, email, password, confirm_password } = req.body;

  if (!first_name || !last_name || !username || !email || !password || !confirm_password) {
    return res.status(400).json({ success: false, error: "Vui lòng điền đầy đủ thông tin" });
  }

  if (password !== confirm_password) {
    return res.status(400).json({ success: false, error: "Mật khẩu xác nhận không khớp" });
  }

  try {
    // 🔍 Kiểm tra trùng username hoặc email
    db.get(
      "SELECT * FROM users WHERE username = ? OR email = ?",
      [username, email],
      async (err, row) => {
        if (err) {
          console.error("Lỗi truy vấn:", err);
          return res.status(500).json({ success: false, error: "Lỗi truy vấn cơ sở dữ liệu" });
        }

        if (row) {
          if (row.username === username) {
            return res.status(400).json({ success: false, error: "Tên đăng nhập đã được sử dụng" });
          }
          if (row.email === email) {
            return res.status(400).json({ success: false, error: "Email này đã được sử dụng" });
          }
        }

        // 🔐 Mã hóa mật khẩu
        const hashedPassword = await bcrypt.hash(password, 10);

        // 💾 Thêm người dùng vào SQLite
        db.run(
          `INSERT INTO users (username, password, email, first_name, last_name)
           VALUES (?, ?, ?, ?, ?)`,
          [username, hashedPassword, email, first_name, last_name],
          function (err2) {
            if (err2) {
              console.error("Lỗi thêm dữ liệu:", err2);
              return res.status(500).json({ success: false, error: "Không thể tạo tài khoản" });
            }

            res.json({ success: true, message: "Tạo tài khoản thành công ✅" });
          }
        );
      }
    );
  } catch (err) {
    console.error("Lỗi hệ thống:", err);
    res.status(500).json({ success: false, error: "Lỗi máy chủ" });
  }
});

module.exports = router;
