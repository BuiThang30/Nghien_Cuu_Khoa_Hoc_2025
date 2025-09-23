const express = require("express");
const path = require("path");

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json()); // để nhận JSON từ ESP gửi lên
app.use(express.static(path.join(__dirname, "public")));

// Import routes
const sensorsRoutes = require("./routes/sensors");
app.use("/api/sensors", sensorsRoutes);

// Route động cho các trang html
app.get("/:page", (req, res) => {
  const page = req.params.page;
  const filePath = path.join(__dirname, "public", `${page}.html`);

  res.sendFile(filePath, (err) => {
    if (err) {
      res.status(404).send("❌ Trang không tồn tại!");
    }
  });
});

// Route mặc định -> redirect về /login
app.get("/", (req, res) => {
  res.redirect("/login");
});

// Khởi động server
app.listen(PORT, () => {
  console.log(`✅ Server chạy tại http://localhost:${PORT}`);
});
