function loadExcel(file) {
  clearContent();
  
  const fileName = file.split('/').pop().replace('.xlsx', '');
  document.getElementById("title").innerText = fileName.replace(/-/g, ' ').toUpperCase();

  fetch(file)
    .then((res) => res.arrayBuffer())
    .then((data) => {
      const workbook = XLSX.read(data);

      const sheet = workbook.Sheets[workbook.SheetNames[0]];

      const json = XLSX.utils.sheet_to_json(sheet);

      let table = "<table>";

      let headers = Object.keys(json[0]);

      table += "<tr>";

      headers.forEach((h) => {
        table += `<th>${h}</th>`;
      });

      table += "</tr>";

      json.forEach((row) => {
        table += "<tr>";

        headers.forEach((h) => {
          table += `<td>${row[h] || ""}</td>`;
        });

        table += "</tr>";
      });

      table += "</table>";

      document.getElementById("table").innerHTML = table;
    })
    .catch((err) => {
      document.getElementById("table").innerHTML = `<p style="color: #e74c3c;">Error loading file: ${err.message}</p>`;
    });
}

function loadMarkdown(file) {
  clearContent();
  
  const fileName = file.split('/').pop().replace('.md', '');
  document.getElementById("title").innerText = fileName.replace(/-/g, ' ').toUpperCase();

  fetch(file)
    .then((res) => res.text())
    .then((text) => {
      const html = marked.parse(text);

      document.getElementById("markdown").innerHTML = html;
    })
    .catch((err) => {
      document.getElementById("markdown").innerHTML = `<p style="color: #e74c3c;">Error loading file: ${err.message}</p>`;
    });
}

function runTest() {
  clearContent();
  
  document.getElementById("title").innerText = "SELENIUM LOGIN TEST";

  const output = document.getElementById("testOutput");

  output.innerText = "🔍 Kiểm tra server...\n\n";

  // Kiểm tra server trước khi chạy test
  checkServerHealth()
    .then(isHealthy => {
      if (!isHealthy) {
        // Server chưa sẵn sàng
        output.innerText = `═══════════════════════════════════════
  🚀 SERVER ĐANG KHỞI ĐỘNG
═══════════════════════════════════════

Máy chủ hiện đang khởi động, vui lòng đợi...

Các lựa chọn:
1. ⏳ Đợi 30 giây và thử lại
2. 🔄 Refresh trang này
3. 💻 Nếu local: Chạy "npm start"
4. ☁️  Nếu Render: Chờ deployment hoàn thành

═══════════════════════════════════════

Retry tự động trong 30 giây...`;

        // Retry sau 30 giây
        setTimeout(() => {
          runTest();
        }, 30000);
        return;
      }

      // Server sẵn sàng, chạy test
      output.innerText = "⏳ Chạy Selenium Test... Vui lòng đợi...\n\n(Mất khoảng 30-45 giây)";

      // Lấy base URL của Render nếu deploy, ngược lại dùng localhost
      const isProduction = window.location.hostname !== 'localhost';
      const apiUrl = isProduction ? 
        `${window.location.origin}/run-test` : 
        'http://localhost:3000/run-test';

      fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      .then(response => response.json())
      .then(data => {
        let result = `═══════════════════════════════════════
  SELENIUM LOGIN TEST EXECUTION
═══════════════════════════════════════\n`;

        if (data.output) {
          result += `\n${data.output}`;
        }

        if (data.errorOutput) {
          result += `\n\nErrors:\n${data.errorOutput}`;
        }

        const status = data.success ? '✓ PASS' : '✗ FAIL';
        const mode = data.message.includes('Mock') ? '(📋 MOCK MODE - Demo)' : '(🔴 REAL TEST)';
        
        result += `\n═══════════════════════════════════════
Result: ${status} ${mode}
═══════════════════════════════════════
Message: ${data.message}
Timestamp: ${new Date().toLocaleString()}
===================================================`;

        output.innerText = result;
      })
      .catch(error => {
        output.innerText = `═══════════════════════════════════════
  ❌ LỖI EXECUTE TEST
═══════════════════════════════════════

Error: ${error.message}

Vui lòng check:
- Local: node server.js đang chạy?
- Render: Check deployment logs
- Refresh trang nếu cần

═══════════════════════════════════════`;
      });
    });
}

function clearContent() {
  document.getElementById("markdown").innerHTML = "";

  document.getElementById("table").innerHTML = "";

  document.getElementById("testOutput").innerText = "";
}

function checkServerHealth() {
  const isProduction = window.location.hostname !== 'localhost';
  const healthUrl = isProduction ? 
    `${window.location.origin}/health` : 
    'http://localhost:3000/health';

  return fetch(healthUrl, { 
    method: 'GET',
    timeout: 5000 
  })
    .then(res => res.ok)
    .catch(() => false);
}
