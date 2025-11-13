const express = require("express");
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");
require("dotenv").config();

const router = express.Router();
const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("./database.db");

// 🧠 Hàm tạo mật khẩu ngẫu nhiên
function generateRandomPassword(length = 10) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@!#$%";
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

// 🔑 API Quên mật khẩu
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, error: "Vui lòng nhập email" });
  }

  try {
    // 🔍 Kiểm tra email trong database
    db.get("SELECT * FROM users WHERE email = ?", [email], async (err, user) => {
      if (err) {
        console.error("Lỗi truy vấn:", err);
        return res.status(500).json({ success: false, error: "Lỗi truy vấn CSDL" });
      }

      if (!user) {
        return res.status(404).json({ success: false, error: "Không tìm thấy tài khoản" });
      }

      // 🔐 Tạo mật khẩu mới + mã hóa
      const newPassword = generateRandomPassword(10);
      const hashed = await bcrypt.hash(newPassword, 10);

      // 💾 Cập nhật vào SQLite
      db.run("UPDATE users SET password = ? WHERE email = ?", [hashed, email], async (err2) => {
        if (err2) {
          console.error("Lỗi cập nhật:", err2);
          return res.status(500).json({ success: false, error: "Không cập nhật được mật khẩu" });
        }

        // 📧 Gửi email mật khẩu mới
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: process.env.MAIL_USER,
            pass: process.env.MAIL_PASS,
          },
        });

        try {
          await transporter.sendMail({
            from: `"Hỗ trợ Website" <${process.env.MAIL_USER}>`,
            to: email,
            subject: "Khôi phục mật khẩu",
            html: `
              <h2>Yêu cầu khôi phục mật khẩu</h2>
              <p>Xin chào ${user.first_name || user.username},</p>
              <p>Bạn vừa yêu cầu đặt lại mật khẩu. Đây là mật khẩu mới của bạn:</p>
              <div style="background:#f7f7f7;padding:10px;border-radius:6px;font-size:16px;">
                <b>${newPassword}</b>
              </div>
              <p>Vui lòng đăng nhập và thay đổi lại mật khẩu sau khi vào hệ thống.</p>
              <p>Trân trọng,<br>Đội ngũ Website</p>
            `,
          });

          res.json({ success: true, message: "Đã gửi mật khẩu mới qua email ✅" });
        } catch (mailErr) {
          console.error("Mail error:", mailErr);
          res.status(500).json({ success: false, error: "Không gửi được email" });
        }
      });
    });
  } catch (err) {
    console.error("Lỗi hệ thống:", err);
    res.status(500).json({ success: false, error: "Lỗi máy chủ" });
  }
});

module.exports = router;
