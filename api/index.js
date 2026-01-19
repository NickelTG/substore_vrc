const { fork } = require('child_process');
const path = require('path');
const http = require('http');

let child;
const PORT = 3001;

module.exports = async (req, res) => {
  const scriptPath = path.join(process.cwd(), 'sub-store.bundle.js');

  // 1. Запуск процесса, если он еще не запущен
  if (!child) {
    child = fork(scriptPath, ['--port', PORT.toString()], {
      env: { ...process.env, SUB_STORE_FRONTEND_BACKEND_PATH: process.env.SUB_STORE_FRONTEND_BACKEND_PATH }
    });
    // Даем время на инициализацию базы данных и порта
    await new Promise(resolve => setTimeout(resolve, 3000));
  }

  // 2. Очистка пути для проксирования
  // Vercel передает /api/subsexxo1/..., а Sub-Store ждет /api/...
  const targetPath = req.url.split(process.env.SUB_STORE_FRONTEND_BACKEND_PATH)[1] || '/';

  // 3. Проксирование запроса к внутреннему порту 3001
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

  proxyReq.on('error', (err) => {
    res.status(500).send(`Proxy Error: ${err.message}. Sub-Store might still be starting...`);
  });

  req.pipe(proxyReq);
};
