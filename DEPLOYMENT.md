# QA Testing Dashboard

Dashboard quản lý tài liệu QA với tích hợp Selenium automation testing.

## 🚀 Quick Start

### Local Development

```bash
# Cài đặt dependencies
npm install

# Chạy server
npm start

# Mở http://localhost:3000 trong trình duyệt
```

### Deploy lên Render

#### Bước 1: Đẩy code lên GitHub
```bash
git add .
git commit -m "QA Testing Dashboard"
git push origin main
```

#### Bước 2: Deploy trên Render
1. Vào https://render.com
2. Đăng ký bằng GitHub
3. Bấm **New +** → **Web Service**
4. Chọn `qa-testing-project` repository
5. Điền:
   - **Name**: `qa-testing-dashboard`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
6. Bấm **Create Web Service**
7. Chờ deploy (2-3 phút)

#### Bước 3: Lấy URL công khai
```
https://qa-testing-dashboard-xxxx.onrender.com
```

## 📁 Cấu trúc thư mục

```
├── index.html               # Dashboard UI
├── app.js                   # Frontend JavaScript
├── server.js                # Node.js server backend
├── package.json             # Dependencies
├── api-testing/             # API test cases
├── automation-test/         # Selenium tests
│   └── selenium-tests/
│       └── login-test.js    # Login automation
├── test-cases/              # Test cases
├── test-report/             # Test reports
└── ...
```

## ✨ Tính năng

- 📋 Xem test cases (Excel, Markdown)
- 🤖 Chạy Selenium login test
- 📊 Bảng điểu khiển tài liệu QA
- 📱 Responsive design (mobile-friendly)

## 🔧 Yêu cầu

- Node.js 18+
- npm hoặc yarn
- Trình duyệt hiện đại
- (Optional) ChromeDriver cho Selenium

## 📝 Ghi chú

- Selenium test chỉ chạy trên server (Node.js), không chạy trên GitHub Pages
- Render free tier có giới hạn:
  - Idle sau 15 phút không dùng (chậm khi khởi động lại)
  - 750 giờ/tháng
  - Nên upgrade nếu dùng nhiều

## 👤 Author

phune23

## 📄 License

ISC
