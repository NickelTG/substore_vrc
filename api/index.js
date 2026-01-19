const { fork } = require('child_process');
const path = require('path');
const http = require('http');

let child;
// МЕНЯЕМ ПОРТ НА 3000, так как бандл игнорирует аргументы и садится на дефолтный
const PORT = 3000; 

module.exports = async (req, res) => {
  const scriptPath = path.join(process.cwd(), 'sub-store.bundle.js');

  if (!child) {
    console.log("Starting Sub-Store on port 3000...");
    child = fork(scriptPath, [], {
      env: { 
        ...process.env, 
        SUB_STORE_DATA_DIRECTORY: '/tmp',
        SUB_STORE_FRONTEND_BACKEND_PATH: process.env.SUB_STORE_FRONTEND_BACKEND_PATH 
      },
      cwd: '/tmp'
    });

    // Ждем, пока в логах появится "listening", но для Vercel просто даем паузу
    await new Promise(resolve => setTimeout(resolve, 3000));
  }

  const secret = process.env.SUB_STORE_FRONTEND_BACKEND_PATH;
  // Исправляем парсинг пути, чтобы прокси корректно передавал запрос внутрь
  const urlParts = req.url.split(secret);
  const targetPath = urlParts.length > 1 ? urlParts[1] : '/';

  const proxyReq = http.request({
    host: '127.0.0.1',
    port: PORT,
    path: targetPath,
    method: req.method,
    headers: req.headers
  }, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (e) => {
    res.status(500).send(`Proxy Error: ${e.message}. Backend is on 3000, but refusing connection.`);
  });

  req.pipe(proxyReq);
};
