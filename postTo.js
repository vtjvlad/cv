const fs = require('fs').promises;
const path = require('path');
const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

// === НАСТРОЙКИ ===
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID || '@your_channel'; // Укажите ID канала или username с @
const PRICE = 3000;
const POST_DELAY = 3000; // Задержка в миллисекундах (3 секунды)

// Получаем путь к папке из аргументов
const brandDir = process.argv[2];
if (!brandDir) {
  console.error('Укажите путь к папке с фото!');
  process.exit(1);
}
const brand = path.basename(brandDir);
const hashtag = `#${brand}`;
const brandLink = `https://t.me/${brand}`; // переменная для ссылки (можно использовать в будущем)

const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: false });

// Функция для создания задержки
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// Функция-обертка для отправки с обработкой rate limit
async function safeSend(fn, ...args) {
  while (true) {
    try {
      return await fn(...args);
    } catch (err) {
      if (err.response && err.response.body && err.response.body.error_code === 429) {
        const retryAfter = err.response.body.parameters.retry_after || 5;
        console.log(`Слишком много запросов! Жду ${retryAfter} секунд...`);
        await delay(retryAfter * 1000);
      } else {
        throw err;
      }
    }
  }
}

async function main() {
  // Читаем все файлы в папке
  const files = (await fs.readdir(brandDir))
    .filter(f => /\.(jpg|jpeg|png)$/i.test(f));

  // Группируем по первой цифре
  const groups = {};
  for (const file of files) {
    const match = file.match(/^([0-9]+)-/);
    if (!match) continue;
    const groupNum = match[1];
    if (!groups[groupNum]) groups[groupNum] = [];
    groups[groupNum].push(file);
  }

  // Для каждой группы делаем пост с задержкой
  for (const groupNum of Object.keys(groups).sort((a, b) => a - b)) {
    const photoFiles = groups[groupNum].map(f => path.join(brandDir, f));
    const text = `${brand}\nВартість: ${PRICE}\n${hashtag}`;

    // Если фото одно — отправляем как photo, если несколько — как mediaGroup
    if (photoFiles.length === 1) {
      await safeSend(bot.sendPhoto.bind(bot), CHANNEL_ID, photoFiles[0], { caption: text });
    } else {
      const media = photoFiles.map((file, idx) => ({
        type: 'photo',
        media: file,
        ...(idx === 0 ? { caption: text } : {})
      }));
      await safeSend(bot.sendMediaGroup.bind(bot), CHANNEL_ID, media);
    }
    console.log(`Пост ${groupNum} отправлен!`);

    // Задержка 3 секунды перед следующим постом
    await delay(POST_DELAY);
  }
}

main().catch(console.error);
