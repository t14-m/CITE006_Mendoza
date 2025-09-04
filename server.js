const http = require('http');
const fs = require('fs');
const path = require('path');
const mime = require('mime-types');
const formidable = require('formidable');

const server = http.createServer((req, res) => {
    if (req.url === '/upload' && req.method.toLowerCase() === 'get') {
        // Serve the upload page
        const uploadPage = path.join(__dirname, 'public', 'upload.html');
        fs.readFile(uploadPage, (err, content) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Error loading upload page.');
            } else {
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(content, 'utf8');
            }
        });
    }
    else if (req.url === '/upload' && req.method.toLowerCase() === 'post') {
        // Handle file upload
        const form = formidable({
            multiples: false,
            uploadDir: path.join(__dirname, 'uploads'),
            keepExtensions: true
        });

        form.parse(req, (err, fields, files) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                return res.end('Error uploading file.');
            }

            const file = files.file;
            if (!file) {
                res.writeHead(400, { 'Content-Type': 'text/plain' });
                return res.end('No file uploaded.');
            }

            const allowedTypes = ['.png', '.jpg', '.jpeg', '.txt', '.pdf'];
            const ext = path.extname(file.originalFilename).toLowerCase();

            if (!allowedTypes.includes(ext)) {
                fs.unlinkSync(file.filepath);
                res.writeHead(400, { 'Content-Type': 'text/plain' });
                return res.end('Invalid file type.');
            }

            const newPath = path.join(__dirname, 'uploads', file.originalFilename);

            try {
                fs.renameSync(file.filepath, newPath);
            } catch (moveErr) {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                return res.end('Error saving file.');
            }

            // Success response with cute UI
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(`
                <html>
                <head>
                  <style>
                    body { 
                        font-family: 'Segoe UI', sans-serif; 
                        background: #fdf6f9; 
                        display: flex; 
                        height: 100vh; 
                        justify-content: center; 
                        align-items: center; 
                        margin: 0;
                    }
                    .msg-box {
                        background: white;
                        padding: 20px 30px;
                        border-radius: 16px;
                        box-shadow: 0 6px 15px rgba(0,0,0,0.1);
                        text-align: center;
                    }
                    h2 {
                        color: #e75480;
                    }
                    a {
                        display: inline-block;
                        margin-top: 15px;
                        padding: 10px 18px;
                        background: #e75480;
                        color: white;
                        text-decoration: none;
                        border-radius: 8px;
                        transition: background 0.2s ease;
                    }
                    a:hover {
                        background: #d0436f;
                    }
                  </style>
                </head>
                <body>
                  <div class="msg-box">
                    <h2>✅ File uploaded successfully!</h2>
                    <a href="/upload">Upload another file</a>
                  </div>
                </body>
                </html>
            `);
        });
    }
    else {
        // Serve static files from /public
        let filePath = path.join(__dirname, 'public', req.url === '/' ? 'index.html' : req.url);

        fs.readFile(filePath, (err, content) => {
            if (err) {
                if (err.code === 'ENOENT') {
                    res.writeHead(404, { 'Content-Type': 'text/html' });
                    res.end('<h1>404 - File Not Found</h1>', 'utf8');
                } else {
                    res.writeHead(500);
                    res.end(`Server Error: ${err.code}`);
                }
            } else {
                res.writeHead(200, { 'Content-Type': mime.lookup(filePath) });
                res.end(content, 'utf8');
            }
        });
    }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
