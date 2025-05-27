const fs = require('fs').promises;
const path = require('path');
const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

// === НАСТРОЙКИ ===
const TELEGRAM_TOKENS = [
    process.env.TELEGRAM_TOKEN,
  process.env.TELEGRAM_TOKEN1,
  process.env.TELEGRAM_TOKEN2,
    process.env.TELEGRAM_TOKEN3,
    process.env.TELEGRAM_TOKEN4,
  // Добавьте дополнительные токены, если нужно
].filter(token => token); // Фильтруем undefined/null токены
const CHANNEL_ID = process.env.CHANNEL_ID || '@your_channel'; // Укажите ID канала или username с @
const PRICE = 3000;
const POST_DELAY = 3000; // Задержка в миллисекундах (3 секунды)

// Проверка наличия токенов
if (TELEGRAM_TOKENS.length === 0) {
  console.error('Не указаны токены ботов в .env!');
  process.exit(1);
}

// Получаем путь к папке из аргументов
const brandDir = process.argv[2];
if (!brandDir) {
  console.error('Укажите путь к папке с фото!');
  process.exit(1);
}
const brand = path.basename(brandDir);
const hashtag = `#${brand}`;
const brandLink = `https://t.me/${brand}`; // переменная для ссылки (можно использовать в будущем)

// Создаем массив ботов
const bots = TELEGRAM_TOKENS.map(token => new TelegramBot(token, { polling: false }));

// Функция для создания задержки
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// Функция-обертка для отправки с обработкой rate limit
async function safeSend(bot, fn, ...args) {
  while (true) {
    try {
      return await fn(...args);
    } catch (err) {
      if (err.response && err.response.body && err.response.body.error_code === 429) {
        const retryAfter = err.response.body.parameters.retry_after || 5;
        console.log(`Слишком много запросов для бота! Жду ${retryAfter} секунд...`);
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

  // Распределяем посты между ботами
  const groupNums = Object.keys(groups).sort((a, b) => a - b);
  for (let i = 0; i < groupNums.length; i++) {
    const groupNum = groupNums[i];
    const bot = bots[i % bots.length]; // Циклически выбираем бота
    const photoFiles = groups[groupNum].map(f => path.join(brandDir, f));
    const text = `${brand}\nВартість: ${PRICE}\n${hashtag}`;

    // Если фото одно — отправляем как photo, если несколько — как mediaGroup
    if (photoFiles.length === 1) {
      await safeSend(bot, bot.sendPhoto.bind(bot), CHANNEL_ID, photoFiles[0], { caption: text });
    } else {
      const media = photoFiles.map((file, idx) => ({
        type: 'photo',
        media: file,
        ...(idx === 0 ? { caption: text } : {})
      }));
      await safeSend(bot, bot.sendMediaGroup.bind(bot), CHANNEL_ID, media);
    }
    console.log(`Пост ${groupNum} отправлен ботом ${bot.options.token.slice(0, 10)}...!`);

    // Задержка 3 секунды перед следующим постом
    await delay(POST_DELAY);
  }
}

main().catch(console.error);
