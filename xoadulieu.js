// reset-db.js
const fs = require('fs');
const path = require('path');

// Đường dẫn tới file cơ sở dữ liệu
const dbPath = path.join(__dirname, 'database.db');

// Xóa file database nếu tồn tại
if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath);
  console.log('🗑️  Đã xóa toàn bộ cơ sở dữ liệu cũ!');
} else {
  console.log('⚠️  Không có file database cũ để xóa.');
}

// Gọi lại db.js để tạo mới
console.log('🚀 Đang tạo lại cơ sở dữ liệu...');
require('./db');
