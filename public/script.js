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
