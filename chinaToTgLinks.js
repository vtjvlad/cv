const fs = require('fs').promises;
const path = require('path');
const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

// === НАСТРОЙКИ ===
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID || '@your_channel'; // Укажите ID канала или username с @

// Получаем путь к JSON файлу из аргументов
const jsonFilePath = process.argv[2];
if (!jsonFilePath) {
  console.error('Укажите путь к JSON файлу!');
  process.exit(1);
}

const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: false });

// Функция-обертка для отправки с обработкой rate limit
async function safeSend(fn, ...args) {
  while (true) {
    try {
      return await fn(...args);
    } catch (err) {
      if (err.response && err.response.body && err.response.body.error_code === 429) {
        const retryAfter = err.response.body.parameters.retry_after || 5;
        console.log(`Слишком много запросов! Жду ${retryAfter} секунд...`);
        await new Promise(res => setTimeout(res, retryAfter * 1000));
      } else {
        throw err;
      }
    }
  }
}

async function main() {
  // Читаем JSON файл
  const jsonData = JSON.parse(await fs.readFile(jsonFilePath, 'utf8'));
  
  // Проверяем структуру данных
  if (!Array.isArray(jsonData)) {
    console.error('JSON файл должен содержать массив объектов');
    process.exit(1);
  }

  // Для каждого объекта в массиве делаем пост
  for (const item of jsonData) {
    if (!item.title || !item.price || !Array.isArray(item.imgSrc)) {
      console.error('Каждый объект должен содержать поля title, price и imgSrc');
      continue;
    }

    const brand = item.title;
    const hashtag = `#${brand}`;
    const text = `${brand}\nВартість: ${item.price}\n${hashtag}\n\nФото:\n${item.imgSrc.join('\n')}`;

    // Отправляем сообщение с ссылками
    await safeSend(bot.sendMessage.bind(bot), CHANNEL_ID, text);
    console.log(`Пост для ${brand} отправлен!`);
  }
}

main().catch(console.error); 