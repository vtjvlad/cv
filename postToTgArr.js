const fs = require('fs').promises;
const path = require('path');
const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

// === НАСТРОЙКИ ===
const TELEGRAM_TOKENS = [
  process.env.TELEGRAM_TOKEN1,
  process.env.TELEGRAM_TOKEN2,
    process.env.TELEGRAM_TOKEN3,
    process.env.TELEGRAM_TOKEN4,
  // Добавьте дополнительные токены, если нужно
].filter(token => token); // Фильтруем undefined/null токены
const CHANNEL_ID = process.env.CHANNEL_ID || '@your_channel'; // Укажите ID канала или username с @
const PRICE = 3000;
const POST_DELAY = 1000; // Задержка между постами (1 секунда)
const BOT_COOLDOWN = 20000; // Задержка для одного бота (20 секунд)

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
const brandLink = `https://t.me/${brand}`;

// Создаем массив ботов с таймерами
const bots = TELEGRAM_TOKENS.map(token => ({
  bot: new TelegramBot(token, { polling: false }),
  lastSent: 0, // Время последней отправки (в миллисекундах)
}));

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
        console.log(`Слишком много запросов для бота ${bot.options.token.slice(0, 10)}...! Жду ${retryAfter} секунд...`);
        await delay(retryAfter * 1000);
      } else {
        throw err;
      }
    }
  }
}

// Функция для выбора доступного бота
async function getAvailableBot() {
  while (true) {
    const now = Date.now();
    const availableBot = bots.find(b => now - b.lastSent >= BOT_COOLDOWN);
    if (availableBot) {
      return availableBot;
    }
    // Ждем, пока не освободится хотя бы один бот
    const minWait = Math.min(...bots.map(b => BOT_COOLDOWN - (now - b.lastSent)));
    console.log(`Все боты на кулдауне, жду ${minWait / 1000} секунд...`);
    await delay(minWait);
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

  // Очередь постов
  const groupNums = Object.keys(groups).sort((a, b) => a - b);
  for (const groupNum of groupNums) {
    const photoFiles = groups[groupNum].map(f => path.join(brandDir, f));
    const text = `${brand}\nВартість: ${PRICE}\n${hashtag}`;

    // Получаем доступного бота
    const { bot, lastSent } = await getAvailableBot();

    // Отправляем пост
    if (photoFiles.length === 1) {
      await safeSend(
        bot,
        bot.sendPhoto.bind(bot),
        CHANNEL_ID,
        photoFiles[0],
        { caption: text },
        { contentType: /\.(png)$/i.test(photoFiles[0]) ? 'image/png' : 'image/jpeg' } // Указываем content-type
      );
    } else {
      const media = photoFiles.map((file, idx) => ({
        type: 'photo',
        media: file,
        caption: idx === 0 ? text : undefined, // Caption только для первого файла
        parse_mode: idx === 0 ? 'Markdown' : undefined, // Опционально, если нужно форматирование
        contentType: /\.(png)$/i.test(file) ? 'image/png' : 'image/jpeg' // Указываем content-type
      }));
      await safeSend(bot, bot.sendMediaGroup.bind(bot), CHANNEL_ID, media);
    }

    // Обновляем время последней отправки для бота
    bot.lastSent = Date.now();
    console.log(`Пост ${groupNum} отправлен ботом ${bot.options.token.slice(0, 10)}...!`);

    // Задержка между постами
    await delay(POST_DELAY);
  }
}

main().catch(console.error);
