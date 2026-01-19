const { fork } = require('child_process');
const path = require('path');

module.exports = (req, res) => {
  // Указываем путь к бандлу
  const scriptPath = path.join(process.cwd(), 'sub-store.bundle.js');

  // Параметры запуска для Node.js
  const child = fork(scriptPath, ['--port', '3001'], {
    env: { 
      ...process.env, 
      SUB_STORE_FRONTEND_BACKEND_PATH: process.env.SUB_STORE_FRONTEND_BACKEND_PATH 
    }
  });

  // Отправляем ответ, чтобы Vercel не убил функцию мгновенно
  res.status(200).send("Sub-Store Bundle is active. Connect via https://sub-store.vercel.app/");
};
