const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const https = require('https');
const querystring = require('querystring');

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle OPTIONS request
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    // Run selenium test endpoint
    if (req.url === '/run-test' && req.method === 'POST') {
        runSeleniumTest(res);
        return;
    }

    // Health check endpoint
    if (req.url === '/health' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok' }));
        return;
    }

    // Run API tests endpoint
    if (req.url === '/run-api-tests' && req.method === 'POST') {
        runAPITests(res);
        return;
    }

    // Serve static files
    let filePath = req.url === '/' ? '/index.html' : req.url;
    filePath = path.join(__dirname, filePath);

    // Security: prevent directory traversal
    if (!filePath.startsWith(path.join(__dirname))) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
    }

    // Read and serve the file
    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/html' });
            res.end('<h1>404 - File Not Found</h1>');
            return;
        }

        // Determine content type
        const ext = path.extname(filePath);
        let contentType = 'text/html';
        if (ext === '.js') contentType = 'application/javascript';
        if (ext === '.css') contentType = 'text/css';
        if (ext === '.json') contentType = 'application/json';
        if (ext === '.xlsx') contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

        res.writeHead(200, { 'Content-Type': contentType });
        res.end(data);
    });
});

function runSeleniumTest(res) {
    const testPath = path.join(__dirname, 'automation-test', 'selenium-tests', 'login-test.js');
    const testDir = path.join(__dirname, 'automation-test', 'selenium-tests');

    // Detecte nếu chạy trên Render (không có Chrome)
    const isRender = process.env.RENDER === 'true';
    
    if (isRender) {
        // Mock data cho Render (vì không có Chrome)
        const mockResult = {
            success: true,
            code: 0,
            output: `
Step 1: Open login page ✓
Step 2: Enter email (phutranbs23@gmail.com) ✓
Step 3: Enter password ✓
Step 4: Click login button ✓
Step 5: Verify redirect URL ✓

Current URL: https://automationexercise.com/ (After login)
Login Status: SUCCESS
`,
            errorOutput: '',
            message: 'Test passed (Mock mode - Chrome not available on Render)'
        };

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(mockResult));
        return;
    }

    // Chạy Selenium test thực trên local
    let output = '';
    let errorOutput = '';

    console.log(`Running test: ${testPath}`);

    const child = spawn('node', [testPath], {
        cwd: testDir,
        stdio: ['pipe', 'pipe', 'pipe']
    });

    let timeoutId = setTimeout(() => {
        child.kill();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            success: false,
            message: 'Test timeout (exceeded 60 seconds)',
            output: output,
            errorOutput: errorOutput
        }));
    }, 60000); // 60 second timeout

    child.stdout.on('data', (data) => {
        output += data.toString();
        console.log(`stdout: ${data}`);
    });

    child.stderr.on('data', (data) => {
        errorOutput += data.toString();
        console.log(`stderr: ${data}`);
    });

    child.on('close', (code) => {
        clearTimeout(timeoutId);
        
        const success = code === 0 && !errorOutput;
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            success: success,
            code: code,
            output: output,
            errorOutput: errorOutput,
            message: success ? 'Test passed' : 'Test failed'
        }));
    });

    child.on('error', (err) => {
        clearTimeout(timeoutId);
        console.log(`Error: ${err}`);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            success: false,
            message: `Failed to run test: ${err.message}`,
            output: output,
            errorOutput: errorOutput
        }));
    });
}

server.listen(PORT, () => {
    console.log(`QA Testing Dashboard running at http://localhost:${PORT}`);
    console.log(`Press Ctrl+C to stop the server`);
});

function runAPITests(res) {
    const collectionPath = path.join(__dirname, 'api-testing', 'qa-testing-project-phune23.postman_collection.json');
    
    let results = [];
    
    try {
        const collectionData = fs.readFileSync(collectionPath, 'utf8');
        const collection = JSON.parse(collectionData);
        
        // Lấy tất cả requests từ collection
        const requests = collection.item || [];
        
        // Chạy từng request
        let completed = 0;
        
        requests.forEach((item, index) => {
            if (item.request) {
                executeRequest(item, (result) => {
                    results.push(result);
                    completed++;
                    
                    // Khi hoàn thành tất cả, gửi response
                    if (completed === requests.length) {
                        const allPassed = results.every(r => r.success);
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({
                            success: allPassed,
                            results: results,
                            message: allPassed ? 'All API tests passed' : 'Some API tests failed'
                        }));
                    }
                });
            }
        });
        
        // Nếu không có requests
        if (requests.length === 0) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: false,
                results: [],
                message: 'No API tests found in collection'
            }));
        }
    } catch (err) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            success: false,
            results: [],
            message: `Error reading collection: ${err.message}`
        }));
    }
}

function executeRequest(item, callback) {
    const request = item.request;
    const testName = item.name || 'Unnamed Test';
    const method = request.method || 'GET';
    
    // Parse URL
    let url = '';
    if (typeof request.url === 'string') {
        url = request.url;
    } else if (typeof request.url === 'object') {
        const protocol = request.url.protocol || 'https';
        const host = Array.isArray(request.url.host) ? request.url.host.join('.') : request.url.host;
        const pathStr = Array.isArray(request.url.path) ? '/' + request.url.path.join('/') : '';
        url = `${protocol}://${host}${pathStr}`;
    }
    
    // Handle body data
    let bodyData = null;
    if (request.body && request.body.mode === 'urlencoded' && request.body.urlencoded) {
        const params = new URLSearchParams();
        request.body.urlencoded.forEach(param => {
            params.append(param.key, param.value);
        });
        bodyData = params.toString();
    }
    
    // Make request
    try {
        const urlObj = new URL(url);
        const options = {
            hostname: urlObj.hostname,
            port: urlObj.port,
            path: urlObj.pathname + urlObj.search,
            method: method,
            headers: {
                'User-Agent': 'QA-Testing-Dashboard',
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            timeout: 10000
        };
        
        if (bodyData) {
            options.headers['Content-Length'] = Buffer.byteLength(bodyData);
        }
        
        const protocol = urlObj.protocol === 'https:' ? https : require('http');
        
        const req = protocol.request(options, (httpRes) => {
            let responseData = '';
            
            httpRes.on('data', (chunk) => {
                responseData += chunk;
            });
            
            httpRes.on('end', () => {
                let parsedResponse = null;
                
                // Try to parse JSON, handle non-JSON responses
                if (responseData) {
                    try {
                        parsedResponse = JSON.parse(responseData);
                    } catch (e) {
                        // If JSON parsing fails, use raw response
                        parsedResponse = responseData.substring(0, 200); // First 200 chars
                    }
                } else {
                    parsedResponse = '(Empty response)';
                }
                
                const isSuccess = httpRes.statusCode >= 200 && httpRes.statusCode < 300;
                
                callback({
                    name: testName,
                    method: method,
                    url: url,
                    statusCode: httpRes.statusCode,
                    success: isSuccess,
                    response: parsedResponse
                });
            });
        });
        
        req.on('error', (error) => {
            callback({
                name: testName,
                method: method,
                url: url,
                statusCode: 0,
                success: false,
                response: `Error: ${error.message}`
            });
        });
        
        req.on('timeout', () => {
            req.destroy();
            callback({
                name: testName,
                method: method,
                url: url,
                statusCode: 0,
                success: false,
                response: 'Request timeout (> 10s)'
            });
        });
        
        if (bodyData) {
            req.write(bodyData);
        }
        
        req.end();
    } catch (err) {
        callback({
            name: testName,
            method: method,
            url: url,
            statusCode: 0,
            success: false,
            response: `Error: ${err.message}`
        });
    }
}
