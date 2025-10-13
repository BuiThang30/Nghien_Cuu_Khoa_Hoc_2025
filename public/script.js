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


// --- Danh sách địa điểm (tên + toạ độ) ---
const locations = [
  { name: "Ngã Tư Sở", lat: 21.003369, lng: 105.823150 },
  { name: "Ngã Tư Trần Bình Trọng", lat: 21.024330, lng: 105.847960 },
  { name: "Ngã Tư Viện Nhi", lat: 21.024780, lng: 105.799870 },
  { name: "Ngã Tư Cầu Giấy", lat: 21.036830, lng: 105.800520 },
  { name: "Ngã Tư Kim Mã", lat: 21.031250, lng: 105.816810 },
  { name: "Ngã Tư Láng Hạ", lat: 21.015980, lng: 105.813420 },
  { name: "Ngã Tư Trung Kính", lat: 21.017940, lng: 105.799110 },
  { name: "Ngã Tư Chùa Bộc", lat: 21.007900, lng: 105.825630 },
];

// --- Khởi tạo bản đồ ---
let map = L.map('map').setView([21.028511, 105.804817], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '© OpenStreetMap'
}).addTo(map);
let marker = L.marker([21.028511, 105.804817]).addTo(map);

// --- Gợi ý tìm kiếm ---
const searchInput = document.getElementById('searchInput');
const suggestionList = document.getElementById('suggestionList');

searchInput.addEventListener('input', () => {
  const keyword = searchInput.value.toLowerCase();
  suggestionList.innerHTML = '';

  if (keyword.trim() === '') {
    suggestionList.style.display = 'none';
    return;
  }

  const filtered = locations.filter(loc => loc.name.toLowerCase().includes(keyword));
  if (filtered.length === 0) {
    suggestionList.style.display = 'none';
    return;
  }

  filtered.forEach(loc => {
    const div = document.createElement('div');
    div.textContent = loc.name;
    div.onclick = () => selectLocation(loc);
    suggestionList.appendChild(div);
  });

  suggestionList.style.display = 'block';
});

function selectLocation(loc) {
  searchInput.value = loc.name;
  suggestionList.style.display = 'none';
  map.setView([loc.lat, loc.lng], 16);
  marker.setLatLng([loc.lat, loc.lng]);
  loadData(loc.name);
}

// --- Dữ liệu thời gian đèn (localStorage) ---
const saveBtn = document.getElementById('saveBtn');
const editBtn = document.getElementById('editBtn');
const deleteBtn = document.getElementById('deleteBtn');

function getCurrentLocationName() {
  return searchInput.value;
}

function loadData(location) {
  const data = JSON.parse(localStorage.getItem(location));
  if (data) {
    document.getElementById('redTime').value = data.red;
    document.getElementById('yellowTime').value = data.yellow;
    document.getElementById('greenTime').value = data.green;
  } else {
    document.getElementById('redTime').value = '';
    document.getElementById('yellowTime').value = '';
    document.getElementById('greenTime').value = '';
  }
}

saveBtn.addEventListener('click', () => {
  const location = getCurrentLocationName();
  if (!location) return alert('Vui lòng chọn địa điểm!');
  const data = {
    red: document.getElementById('redTime').value,
    yellow: document.getElementById('yellowTime').value,
    green: document.getElementById('greenTime').value
  };
  localStorage.setItem(location, JSON.stringify(data));
  alert('Đã lưu thời gian cho ' + location);
});

editBtn.addEventListener('click', () => saveBtn.click());

deleteBtn.addEventListener('click', () => {
  const location = getCurrentLocationName();
  if (!location) return;
  localStorage.removeItem(location);
  loadData(location);
  alert('Đã xóa dữ liệu của ' + location);
});



