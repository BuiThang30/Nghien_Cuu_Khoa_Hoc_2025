const express = require("express");
const path = require("path");

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Import routes
const sensorsRoutes = require("./routes/sensors");
const pidataRoutes = require("./routes/pidata");

// Gắn route
app.use("/api/sensors", sensorsRoutes);
app.use("/api/pidata", pidataRoutes);

// Route động cho các trang HTML
app.get("/:page", (req, res) => {
  const page = req.params.page;
  const filePath = path.join(__dirname, "public", `${page}.html`);
  res.sendFile(filePath, (err) => {
    if (err) {
      res.status(404).send(" Trang không tồn tại!");
    }
  });
});

// Route mặc định -> redirect về /login
app.get("/", (req, res) => {
  res.redirect("/login");
});

// Khởi động server
app.listen(PORT, () => {
  console.log(` Server chạy tại http://localhost:${PORT}`);
});
