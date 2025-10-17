// =========================
// LOGIN / REGISTER
// =========================
function login() {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();

  if (username === "" || password === "") {
    alert("Vui lòng nhập đầy đủ thông tin!");
  } else {
    window.location.href = "/home";
  }
}

function register() {
  window.location.href = "/register";
}

// =========================
// NAV TOGGLE
// =========================

  const menuToggle = document.getElementById("mobile-menu");
  const navContainer = document.getElementById("nav-container");
  const navLinks = navContainer.querySelectorAll("a");

  menuToggle.addEventListener("click", () => {
    navContainer.classList.toggle("active");
  });

  navLinks.forEach(link => {
    link.addEventListener("click", () => {
      navContainer.classList.remove("active");
    });
  });

// =========================
// BẢN ĐỒ GIAO THÔNG (Leaflet)
// =========================

// ===== Danh sách các ngã tư =====
const locations = [
  { name: "Ngã Tư Sở", lat: 21.003160, lng: 105.820216 },
  { name: "Ngã Tư Viện Nhi", lat: 21.026209, lng: 105.810259 },
  { name: "Ngã Tư Cầu Giấy", lat: 21.030024, lng: 105.801724 },
  { name: "Ngã Tư Kim Mã", lat: 21.030298, lng: 105.812933 },
  { name: "Ngã Tư Nguyễn Chí Thanh", lat: 21.019907, lng: 105.808252 },
  { name: "Ngã Tư Trung Kính", lat: 21.014273, lng: 105.795668 },
  { name: "Ngã Tư Chùa Bộc", lat: 21.009353, lng: 105.824337 },
];

// ===== Khởi tạo bản đồ =====
const defaultLocation = locations[0];
const map = L.map("map", {
  minZoom: 10,
  maxZoom: 19,
}).setView([defaultLocation.lat, defaultLocation.lng], 18);

L.tileLayer("https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: "© OpenStreetMap contributors | HOT layer",
}).addTo(map);

const markers = {};
let infoBox = null;
let currentLocation = defaultLocation;
let currentData = [];

// ===== Lấy dữ liệu từ API =====
async function getPiData() {
  try {
    const res = await fetch("/api/pidata/latest");
    if (!res.ok) throw new Error("Không thể lấy dữ liệu Pi");
    return await res.json();
  } catch (err) {
    console.error("Lỗi tải dữ liệu Pi:", err);
    return [];
  }
}

// ===== Tạo hoặc cập nhật infoBox =====
function createInfoBox(loc, d) {
  // Xóa box cũ nếu có
  if (infoBox) map.getPanes().overlayPane.removeChild(infoBox);

  infoBox = document.createElement("div");
  infoBox.className = "info-box";
  infoBox.innerHTML = `
    <b>${loc.name}</b><br>
    Count: ${d.count}<br>
    Green: ${d.time_green} <span class="dot green"></span><br>
    Red: ${d.time_red} <span class="dot red"></span>
  `;

  const pos = map.latLngToLayerPoint([loc.lat, loc.lng]);
  infoBox.style.left = `${pos.x + 25}px`;
  infoBox.style.top = `${pos.y - 40}px`;
  map.getPanes().overlayPane.appendChild(infoBox);

  // Giữ vị trí khi map di chuyển
  map.on("move", () => {
    const newPos = map.latLngToLayerPoint([loc.lat, loc.lng]);
    infoBox.style.left = `${newPos.x + 25}px`;
    infoBox.style.top = `${newPos.y - 40}px`;
  });
}

// ===== Khởi tạo marker =====
async function attachMarkers() {
  const piData = await getPiData();
  currentData = piData;

  locations.forEach((loc) => {
    const marker = L.marker([loc.lat, loc.lng])
      .addTo(map)
      .bindPopup(`<b>${loc.name}</b>`, {
        autoClose: false,
        closeOnClick: false,
      })
      .openPopup(); // Mở popup mặc định cho tất cả

    markers[loc.name] = marker;

    // Khi click vào marker → đổi infoBox sang vị trí đó
    marker.on("click", () => {
      currentLocation = loc;
      map.flyTo([loc.lat, loc.lng], 18);
      marker.openPopup();

      const d = piData.find((item) => item.location_name === loc.name);
      if (d) createInfoBox(loc, d);
    });
  });

  // Hiển thị infoBox mặc định ban đầu
  const defData = piData.find((d) => d.location_name === defaultLocation.name);
  if (defData) createInfoBox(defaultLocation, defData);
}

// ===== Cập nhật infoBox liên tục =====
async function autoUpdate() {
  if (!currentLocation) return;
  const newData = await getPiData();

  const d = newData.find(
    (item) => item.location_name === currentLocation.name
  );
  if (d) {
    currentData = newData;
    createInfoBox(currentLocation, d);
  }
}

// ===== Khởi tạo =====
attachMarkers();

// Cập nhật mỗi 5 giây
setInterval(autoUpdate, 5000);

// Fix hiển thị map khi load
setTimeout(() => {
  map.invalidateSize();
  map.setView([defaultLocation.lat, defaultLocation.lng], 18, { animate: false });
}, 500);




// --- Gợi ý tìm kiếm ---
const searchInput = document.getElementById("searchInput");
const suggestionList = document.getElementById("suggestionList");

searchInput.addEventListener("input", () => {
  const keyword = searchInput.value.toLowerCase();
  suggestionList.innerHTML = "";

  if (keyword.trim() === "") {
    suggestionList.style.display = "none";
    return;
  }

  const filtered = locations.filter((loc) =>
    loc.name.toLowerCase().includes(keyword)
  );

  if (filtered.length === 0) {
    suggestionList.style.display = "none";
    return;
  }

  filtered.forEach((loc) => {
    const div = document.createElement("div");
    div.textContent = loc.name;
    div.onclick = () => selectLocation(loc);
    suggestionList.appendChild(div);
  });

  suggestionList.style.display = "block";
});

// --- Khi chọn vị trí từ ô tìm kiếm ---
function selectLocation(loc) {
  searchInput.value = loc.name;
  suggestionList.style.display = "none";
  map.flyTo([loc.lat, loc.lng], 18);
  markers[loc.name].openPopup();
  loadData(loc.name);
  scrollToMap();
}

function scrollToMap() {
  const mapElement = document.getElementById("map");
  mapElement.scrollIntoView({ behavior: "smooth", block: "center" });
}


// =========================
// NÚT XÁC NHẬN TÌM KIẾM
// =========================
function confirmbtn() {
  const input = searchInput.value.trim().toLowerCase();
  if (input === "") {
    alert("Vui lòng nhập tên địa điểm!");
    return;
  }

  // Tìm địa điểm có tên khớp (không phân biệt hoa/thường)
  const loc = locations.find(l => l.name.toLowerCase() === input);

  if (!loc) {
    alert("Không tìm thấy địa điểm phù hợp!");
    return;
  }

  // Giống như chọn gợi ý
  selectLocation(loc);
}


// =========================
// LƯU / XOÁ THỜI GIAN ĐÈN (localStorage)
// =========================
function getCurrentLocationName() {
  return searchInput.value;
}

function loadData(location) {
  const data = JSON.parse(localStorage.getItem(location));
  if (data) {
    document.getElementById("redTime").value = data.red;
    document.getElementById("yellowTime").value = data.yellow;
    document.getElementById("greenTime").value = data.green;
  } else {
    document.getElementById("redTime").value = "";
    document.getElementById("yellowTime").value = "";
    document.getElementById("greenTime").value = "";
  }
}

document.getElementById("saveBtn").addEventListener("click", () => {
  const location = getCurrentLocationName();
  if (!location) return alert("Vui lòng chọn địa điểm!");
  const data = {
    red: document.getElementById("redTime").value,
    yellow: document.getElementById("yellowTime").value,
    green: document.getElementById("greenTime").value,
  };
  localStorage.setItem(location, JSON.stringify(data));
  alert("Đã lưu thời gian cho " + location);
});

document.getElementById("editBtn").addEventListener("click", () => {
  document.getElementById("saveBtn").click();
});

document.getElementById("deleteBtn").addEventListener("click", () => {
  const location = getCurrentLocationName();
  if (!location) return;
  localStorage.removeItem(location);
  loadData(location);
  alert("Đã xóa dữ liệu của " + location);
});

// Giới hạn chỉ nhập số
document.querySelectorAll("#redTime, #yellowTime, #greenTime").forEach((input) => {
  input.addEventListener("input", function () {
    this.value = this.value.replace(/[^0-9]/g, "");
  });
});

// =========================
// BIỂU ĐỒ (Chart.js)
// =========================
function createChart(canvasId, label, color, min, max) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return null;
  const ctx = canvas.getContext("2d");

  return new Chart(ctx, {
    type: "line",
    data: {
      labels: [],
      datasets: [
        {
          label,
          data: [],
          borderColor: color,
          backgroundColor: color.replace("1)", "0.2)"),
          fill: true,
          tension: 0.3,
          pointRadius: 3,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: { y: { min, max } },
    },
  });
}

function formatTimeUTC7(timestamp) {
  if (!timestamp) return "--";
  const d = new Date(timestamp.includes("T") ? timestamp : timestamp.replace(" ", "T"));
  d.setHours(d.getHours() + 7);

  const weekday = d.toLocaleDateString("en-US", { weekday: "short" });

  const timePart = d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  return `${weekday}, ${timePart}`;
}


const charts = {
  temperature: createChart("chartTemp", "Temperature (°C)", "rgba(255,99,132,1)", 0, 40),
  humidity: createChart("chartHumidity", "Humidity (%)", "rgba(54,162,235,1)", 0, 100),
  co2: createChart("chartCO2", "CO₂ (ppm)", "rgba(0,200,0,1)", 300, 2000),
  pm1_0: createChart("chartPM1", "PM1.0 (µg/m³)", "rgba(75,192,192,1)", 0, 100),
  pm2_5: createChart("chartPM25", "PM2.5 (µg/m³)", "rgba(153,102,255,1)", 0, 100),
  pm10: createChart("chartPM10", "PM10 (µg/m³)", "rgba(255,159,64,1)", 0, 100),
  noise: createChart("chartNOISE", "NOISE (dB)", "rgba(255,159,64,1)", -120, 0),
};

let lastTimestamp = null;

// =========================
// LỊCH SỬ DỮ LIỆU
// =========================
async function loadHistory() {
  try {
    const res = await fetch("/api/sensors/history");
    const rows = await res.json();

    rows.reverse().forEach((r) => {
      const time = formatTimeUTC7(r.timestamp);
      const mapping = {
        temperature: r.temperature,
        humidity: r.humidity,
        co2: r.co2,
        pm1_0: r.pm1_0,
        pm2_5: r.pm2_5,
        pm10: r.pm10,
        noise: r.noise,
      };

      for (let key in charts) {
        if (charts[key]) {
          charts[key].data.labels.push(time);
          charts[key].data.datasets[0].data.push(mapping[key]);
        }
      }
    });

    Object.values(charts).forEach((chart) => chart && chart.update());
    if (rows.length) lastTimestamp = rows[rows.length - 1].timestamp;
  } catch (err) {
    console.error("History error:", err);
  }
}

// =========================
// CẬP NHẬT REALTIME + MIN/MAX
// =========================
async function fetchLatest() {
  try {
    const res = await fetch("/api/sensors/latest");
    const data = await res.json();
    if (!data) return;

    const time = formatTimeUTC7(data.timestamp);

    // Hiển thị realtime
    document.getElementById("tempValue").textContent = data.temperature + " °C";
    document.getElementById("humValue").textContent = data.humidity + " %";
    document.getElementById("co2Value").textContent = data.co2 + " ppm";
    document.getElementById("pm1Value").textContent = data.pm1_0 + " μg/m³";
    document.getElementById("pm25Value").textContent = data.pm2_5 + " μg/m³";
    document.getElementById("pm10Value").textContent = data.pm10 + " μg/m³";
    document.getElementById("noiseValue").textContent = data.noise + " dB";

    // Update chart khi có bản ghi mới
    if (data.timestamp !== lastTimestamp) {
      lastTimestamp = data.timestamp;

      const mapping = {
        temperature: data.temperature,
        humidity: data.humidity,
        co2: data.co2,
        pm1_0: data.pm1_0,
        pm2_5: data.pm2_5,
        pm10: data.pm10,
        noise: data.noise,
      };

      for (let key in charts) {
        if (charts[key]) {
          charts[key].data.labels.push(time);
          charts[key].data.datasets[0].data.push(mapping[key]);
          if (charts[key].data.labels.length > 10) {
            charts[key].data.labels.shift();
            charts[key].data.datasets[0].data.shift();
          }
          charts[key].update();
        }
      }
    }

    // Min/Max
    const minmaxRes = await fetch("/api/sensors/minmax");
    const minmax = await minmaxRes.json();

    document.getElementById("tempMin").textContent = minmax.temperature.min + " °C";
    document.getElementById("tempMax").textContent = minmax.temperature.max + " °C";
    document.getElementById("humMin").textContent = minmax.humidity.min + " %";
    document.getElementById("humMax").textContent = minmax.humidity.max + " %";
    document.getElementById("co2Min").textContent = minmax.co2.min + " ppm";
    document.getElementById("co2Max").textContent = minmax.co2.max + " ppm";
    document.getElementById("pm1Min").textContent = minmax.pm1.min + " μg/m³";
    document.getElementById("pm1Max").textContent = minmax.pm1.max + " μg/m³";
    document.getElementById("pm25Min").textContent = minmax.pm25.min + " μg/m³";
    document.getElementById("pm25Max").textContent = minmax.pm25.max + " μg/m³";
    document.getElementById("pm10Min").textContent = minmax.pm10.min + " μg/m³";
    document.getElementById("pm10Max").textContent = minmax.pm10.max + " μg/m³";
    document.getElementById("noiseMin").textContent = minmax.noise.min + " dB";
    document.getElementById("noiseMax").textContent = minmax.noise.max + " dB";
  } catch (err) {
    console.error("Fetch latest error:", err);
  }
}

// =========================
// CHẠY LẦN ĐẦU
// =========================
loadHistory();
setInterval(fetchLatest, 5000);

