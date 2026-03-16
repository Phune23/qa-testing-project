const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

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
