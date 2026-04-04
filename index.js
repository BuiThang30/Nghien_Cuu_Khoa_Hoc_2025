const express = require("express");
const path = require("path");
const session = require("express-session");

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Thêm session
app.use(
  session({
    secret: "secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false },
  })
);

// Static
app.use(express.static(path.join(__dirname, "public")));

// Import routes
const sensorsRoutes = require("./routes/sensors");
const pidataRoutes = require("./routes/pidata");
const mailRoutes = require("./routes/mail");
const loginRoutes = require("./routes/login");
const registerRoutes = require("./routes/register");

// Gắn route API
app.use("/api/sensors", sensorsRoutes);
app.use("/api/pidata", pidataRoutes);
app.use("/api/login", loginRoutes);
app.use("/api/mail", mailRoutes);
app.use("/api/register", registerRoutes);

app.post("/api/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).send("Logout lỗi");
    }
    res.sendStatus(200);
  });
});

//Route động HTML (đã chặn home)
app.get("/:page", (req, res) => {
  const page = req.params.page;

  // Chặn trang home
  if (page === "home") {
    if (!req.session.user) {
      return res.redirect("/login");
    }
  }

  const filePath = path.join(__dirname, "public", `${page}.html`);
  res.sendFile(filePath, (err) => {
    if (err) {
      res.status(404).send("Trang không tồn tại!");
    }
  });
});

// Route mặc định
app.get("/", (req, res) => {
  res.redirect("/login");
});

// Start server
app.listen(PORT, () => {
  console.log(`Server chạy tại http://localhost:${PORT}`);
});