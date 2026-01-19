const { fork } = require('child_process');
const path = require('path');
const http = require('http');

let child;
const PORT = 3001;

module.exports = async (req, res) => {
  const scriptPath = path.join(process.cwd(), 'sub-store.bundle.js');

  if (!child) {
    console.log("Starting Sub-Store in /tmp...");
    child = fork(scriptPath, ['-p', PORT.toString()], {
      env: { 
        ...process.env, 
        // КЛЮЧЕВОЙ МОМЕНТ: Переносим рабочую директорию в /tmp
        SUB_STORE_DATA_DIRECTORY: '/tmp',
        SUB_STORE_FRONTEND_BACKEND_PATH: process.env.SUB_STORE_FRONTEND_BACKEND_PATH 
      },
      cwd: '/tmp' // Запускаем процесс из временной папки
    });

    await new Promise(resolve => setTimeout(resolve, 4000));
  }

  const secret = process.env.SUB_STORE_FRONTEND_BACKEND_PATH;
  const targetPath = req.url.includes(secret) ? req.url.split(secret)[1] : req.url;

  const proxyReq = http.request({
    host: '127.0.0.1',
    port: PORT,
    path: targetPath || '/',
    method: req.method,
    headers: req.headers
  }, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (e) => {
    res.status(500).send(`Error: ${e.message}. Backend may be failing to write to /tmp`);
  });

  req.pipe(proxyReq);
};
