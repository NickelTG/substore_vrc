const { spawn } = require('child_process');
const path = require('path');

module.exports = (req, res) => {
  // Это запуск бинарного файла Sub-Store, который мы скачали при сборке
  const subStore = spawn(path.join(__dirname, '..', 'sub-store'), ['-p', '3001']);

  subStore.stdout.on('data', (data) => {
    console.log(`stdout: ${data}`);
  });

  // Перенаправляем запрос на запущенный процесс
  res.status(200).send("Backend is starting... Try /sub-store/ in a moment.");
};
