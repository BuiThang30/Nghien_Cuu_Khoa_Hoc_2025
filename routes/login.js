const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const sqlite3 = require("sqlite3").verbose();

// ✅ thêm dòng này
const db = new sqlite3.Database("./database.db");

router.post("/", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.json({ success: false, error: "Thiếu thông tin!" });
  }

  db.get(
    "SELECT * FROM users WHERE username = ?",
    [username],
    async (err, user) => {
      if (err) {
        return res.status(500).json({ success: false, error: err.message });
      }

      if (!user) {
        return res.json({ success: false, error: "User không tồn tại!" });
      }

      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return res.json({ success: false, error: "Sai mật khẩu!" });
      }

      // ✅ lưu session
      req.session.user = {
        id: user.id,
        username: user.username,
        role: user.role,
      };

      res.json({ success: true });
    }
  );
});

module.exports = router;