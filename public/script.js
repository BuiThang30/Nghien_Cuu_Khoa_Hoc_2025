// =========================
// LOGIN / REGISTER
// =========================
function login() {
  const username = document.getElementById("username")?.value.trim();
  const password = document.getElementById("password")?.value.trim();

  if (!username || !password) {
    alert("Vui lòng nhập đầy đủ thông tin!");
  } else {
    window.location.href = "/home";
  }
}

function register() {
  window.location.href = "/register";
}

// =========================
// XỬ LÝ TẠO TÀI KHOẢN MỚI
// =========================
document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("form");
  if (!form) return; // nếu không có form thì dừng ở đây (tránh lỗi)

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const inputs = document.querySelectorAll("input");
    if (inputs.length < 6) {
      alert("Thiếu trường nhập liệu trong form!");
      return;
    }

    const first_name = inputs[0].value.trim();
    const last_name = inputs[1].value.trim();
    const username = document.querySelector("#username").value.trim();
    const email = inputs[3].value.trim();
    const password = inputs[4].value.trim();
    const confirm_password = inputs[5].value.trim();

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name,
          last_name,
          username,
          email,
          password,
          confirm_password,
        }),
      });

      const data = await res.json();

      if (data.success) {
        alert("Đăng ký thành công!");
        window.location.href = "/login";
      } else {
        alert("⚠️ " + (data.error || "Lỗi không xác định!"));
      }
    } catch (err) {
      console.error("Lỗi:", err);
      alert("Không thể kết nối đến máy chủ");
    }
  });
});


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
  { name: "Cầu Vượt Phạm Ngọc Thạch", lat: 21.008362, lng: 105.833848, image: "image/anhtest.png"},
  { name: "Ngã Tư Viện Nhi", lat: 21.026209, lng: 105.810259, image: "image/anhtest.png" },
  { name: "Ngã Tư Cầu Giấy", lat: 21.030024, lng: 105.801724, image: "image/anhtest.png" },
  { name: "Ngã Tư Kim Mã", lat: 21.030298, lng: 105.812933, image: "image/anhtest.png" },
  { name: "Ngã Tư Nguyễn Chí Thanh", lat: 21.019907, lng: 105.808252, image: "image/anhtest.png" },
  { name: "Ngã Tư Trung Kính", lat: 21.014273, lng: 105.795668, image: "image/anhtest.png" },
  { name: "Ngã Tư Chùa Bộc", lat: 21.009353, lng: 105.824337, image: "image/anhtest.png" },
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


// ===== Hiển thị ảnh dưới info-box =====
let currentImage = null;

function showLocationImage(loc) {
  // Xóa ảnh cũ nếu có
  if (currentImage) {
    currentImage.remove();
    currentImage = null;
  }

  // Nếu không có ảnh thì bỏ qua
  if (!loc.image) return;

  const img = document.createElement("img");
  img.src = loc.image;
  img.alt = loc.name;
  img.className = "location-image";

  const pos = map.latLngToLayerPoint([loc.lat, loc.lng]);
  img.style.left = `${pos.x + 50}px`;
  img.style.top = `${pos.y + 10}px`;

  map.getPanes().overlayPane.appendChild(img);
  currentImage = img;
}

// ===== Xóa ảnh khi zoom hoặc pan =====
let mapJustInitialized = true;

map.on("zoom move", () => {
  if (mapJustInitialized) return;
  const zoomLevel = map.getZoom();
  if (currentImage) {
    if (zoomLevel < 18.5) {
      currentImage.remove();
      currentImage = null;
    }else if (zoomLevel > 17.5) {
      currentImage.remove();
      currentImage = null;
    }
  }
});


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
      .openPopup();

    markers[loc.name] = marker;


    marker.on("click", () => {
      currentLocation = loc;
      map.flyTo([loc.lat, loc.lng], 18);
      marker.openPopup();

      const d = piData.find((item) => item.location_name === loc.name);
      if (d) {
        createInfoBox(loc, d);
        map.once("moveend", () => {
          showLocationImage(loc);
        });
      }
    });
  });

  // Hiển thị infoBox mặc định ban đầu
  map.whenReady(() => {
    const defData = piData.find((d) => d.location_name === defaultLocation.name);
    if (defData) {
      createInfoBox(defaultLocation, defData);
      setTimeout(() => {
        showLocationImage(defaultLocation);
      }, 300);
    }
  });

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
    // showLocationImage(currentLocation);
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

  setTimeout(() => {
    const defData = currentData.find(d => d.location_name === defaultLocation.name);
    if (defData) {
      createInfoBox(defaultLocation, defData);
      showLocationImage(defaultLocation);
    }
    mapJustInitialized = false;
  }, 300);
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

  const d = currentData.find(item => item.location_name === loc.name);
  if (d) {
    createInfoBox(loc, d);
    showLocationImage(loc);
  }

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

document.addEventListener("DOMContentLoaded", () => {

  const saveBtn = document.getElementById("saveBtn");
  if (saveBtn) {
    saveBtn.addEventListener("click", () => {
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
  }

  const editBtn = document.getElementById("editBtn");
  if (editBtn && saveBtn) {
    editBtn.addEventListener("click", () => saveBtn.click());
  }

  const deleteBtn = document.getElementById("deleteBtn");
  if (deleteBtn) {
    deleteBtn.addEventListener("click", () => {
      const location = getCurrentLocationName();
      if (!location) return;

      localStorage.removeItem(location);
      loadData(location);
      alert("Đã xóa dữ liệu của " + location);
    });
  }

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
          backgroundColor: color,
          fill: false,
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


// Hàm định dạng thời gian
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

// =========================
// KHỞI TẠO BIỂU ĐỒ
// =========================
const charts = {
  temperature: createChart("chartTemp", "Nhiệt độ (°C)", "rgba(255,99,132,1)", 0, 40),
  humidity: createChart("chartHumidity", "Độ ẩm (%)", "rgba(54,162,235,1)", 0, 100),
  co2: createChart("chartCO2", "CO₂ (ppm)", "rgba(0,200,0,1)", 300, 2000),
  noise: createChart("chartNOISE", "Tiếng ồn (dB)", "rgba(255,159,64,1)", -120, 0),

  // Chart gộp PM
  pm: (() => {
    const ctx = document.getElementById("chartPM")?.getContext("2d");
    if (!ctx) return null;

    return new Chart(ctx, {
      type: "line",
      data: {
        labels: [],
        datasets: [
          {
            label: "PM1.0",
            borderColor: "rgba(75,192,192,1)",
            backgroundColor: "rgba(75,192,192,0.2)",
            data: [],
            fill: false,
            tension: 0.3,
            pointRadius: 3,
          },
          {
            label: "PM2.5",
            borderColor: "rgba(153,102,255,1)",
            backgroundColor: "rgba(153,102,255,0.2)",
            data: [],
            fill: false,
            tension: 0.3,
            pointRadius: 3,
          },
          {
            label: "PM10",
            borderColor: "rgba(255,159,64,1)",
            backgroundColor: "rgba(255,159,64,0.2)",
            data: [],
            fill: false,
            tension: 0.3,
            pointRadius: 3,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: { y: { min: 0, max: 100 } },
      },
    });
  })(),
};

let lastTimestamp = null;

// =========================
// LOAD LỊCH SỬ
// =========================
async function loadHistory() {
  try {
    const res = await fetch("/api/sensors/history");
    const rows = await res.json();
    rows.reverse().forEach((r) => {
      const time = formatTimeUTC7(r.timestamp);

      // Các sensor khác
      const mapping = {
        temperature: r.temperature,
        humidity: r.humidity,
        co2: r.co2,
        noise: r.noise,
      };

      for (let key in mapping) {
        if (charts[key]) {
          charts[key].data.labels.push(time);
          charts[key].data.datasets[0].data.push(mapping[key]);
        }
      }

      // PM gộp
      if (charts.pm) {
        charts.pm.data.labels.push(time);
        charts.pm.data.datasets[0].data.push(r.pm1_0);
        charts.pm.data.datasets[1].data.push(r.pm2_5);
        charts.pm.data.datasets[2].data.push(r.pm10);
      }
    });

    Object.values(charts).forEach((c) => c && c.update());
    if (rows.length) lastTimestamp = rows[rows.length - 1].timestamp;
  } catch (err) {
    console.error("History error:", err);
  }
}

// =========================
// CẬP NHẬT REALTIME
// =========================
async function fetchLatest() {
  try {
    const res = await fetch("/api/sensors/latest");
    const data = await res.json();
    if (!data) return;

    const time = formatTimeUTC7(data.timestamp);

    // Cập nhật realtime từng cảm biến
    document.getElementById("tempValue").textContent = data.temperature + " °C";
    document.getElementById("humValue").textContent = data.humidity + " %";
    document.getElementById("co2Value").textContent = data.co2 + " ppm";
    document.getElementById("noiseValue").textContent = data.noise + " dB";

    // ✅ Cập nhật từng giá trị PM tức thời
    document.getElementById("pm1Value").textContent = data.pm1_0;
    document.getElementById("pm25Value").textContent = data.pm2_5;
    document.getElementById("pm10Value").textContent = data.pm10;

    // === Phần update chart như cũ ===
    if (data.timestamp !== lastTimestamp) {
      lastTimestamp = data.timestamp;

      const mapping = {
        temperature: data.temperature,
        humidity: data.humidity,
        co2: data.co2,
        noise: data.noise,
      };

      for (let key in mapping) {
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

      // Chart PM gộp
      if (charts.pm) {
        charts.pm.data.labels.push(time);
        charts.pm.data.datasets[0].data.push(data.pm1_0);
        charts.pm.data.datasets[1].data.push(data.pm2_5);
        charts.pm.data.datasets[2].data.push(data.pm10);

        if (charts.pm.data.labels.length > 10) {
          charts.pm.data.labels.shift();
          charts.pm.data.datasets.forEach((ds) => ds.data.shift());
        }

        charts.pm.update();
      }
    }

    // === Min/Max cập nhật liên tục ===
    const minmaxRes = await fetch("/api/sensors/minmax");
    const minmax = await minmaxRes.json();

    document.getElementById("tempMin").textContent = minmax.temperature.min + " °C";
    document.getElementById("tempMax").textContent = minmax.temperature.max + " °C";
    document.getElementById("humMin").textContent = minmax.humidity.min + " %";
    document.getElementById("humMax").textContent = minmax.humidity.max + " %";
    document.getElementById("co2Min").textContent = minmax.co2.min + " ppm";
    document.getElementById("co2Max").textContent = minmax.co2.max + " ppm";
    document.getElementById("noiseMin").textContent = minmax.noise.min + " dB";
    document.getElementById("noiseMax").textContent = minmax.noise.max + " dB";

    // ✅ PM Min/Max cập nhật liên tục
    document.getElementById("pm1Min").textContent = minmax.pm1.min + " μg/m³";
    document.getElementById("pm1Max").textContent = minmax.pm1.max + " μg/m³";
    document.getElementById("pm25Min").textContent = minmax.pm25.min + " μg/m³";
    document.getElementById("pm25Max").textContent = minmax.pm25.max + " μg/m³";
    document.getElementById("pm10Min").textContent = minmax.pm10.min + " μg/m³";
    document.getElementById("pm10Max").textContent = minmax.pm10.max + " μg/m³";

  } catch (err) {
    console.error("Fetch latest error:", err);
  }
}

// =========================
// CHẠY LẦN ĐẦU
// =========================
loadHistory();
setInterval(fetchLatest, 5000);
