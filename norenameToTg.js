const fs = require('fs').promises;
const path = require('path');
const TelegramBot = require('node-telegram-bot-api');
const cliProgress = require('cli-progress');
const colors = require('colors');
require('dotenv').config();

// === НАСТРОЙКИ ===
const BOT_TOKENS = process.env.BOT_TOKENS.split(','); // Массив токенов ботов
const CHANNEL_ID = process.env.CHANNEL_ID || '@your_channel';
const POST_DELAY = 1000; // Задержка между постами (1 секунда)
const BOT_RATE_LIMIT = 20000; // Лимит для бота (20 секунд)

// Получаем путь к папке из аргументов
const brandDir = process.argv[2];
if (!brandDir) {
  console.error(colors.red('Укажите путь к папке с фото!'));
  process.exit(1);
}
const brand = path.basename(brandDir);
const hashtag = `#${brand}`;
const brandLink = `https://t.me/${brand}`;

// Создаем ботов
const bots = BOT_TOKENS.map(token => new TelegramBot(token, { polling: false }));

// Очередь постов
const postQueue = [];
let isProcessing = false;

// Создаем прогресс-бар
const progressBar = new cliProgress.SingleBar({
  format: '{bar} | {status} | {value}/{total}',
  barCompleteChar: '\u2588',
  barIncompleteChar: '\u2591',
  hideCursor: true,
  clearOnComplete: false,
  stopOnComplete: false
});

// Функция для обновления статуса
function updateStatus(status, current, total) {
  progressBar.update(current, { status });
}

// Функция для переименования файла
async function renameFile(filePath) {
  try {
    const dir = path.dirname(filePath);
    const ext = path.extname(filePath);
    const baseName = path.basename(filePath, ext);
    const newName = `post-${baseName}${ext}`;
    const newPath = path.join(dir, newName);
    
    await fs.rename(filePath, newPath);
    return newPath;
  } catch (error) {
    console.error(colors.red(`\n✗ Ошибка переименования файла ${filePath}: ${error.message}`));
    return filePath;
  }
}

// Функция-обертка для отправки с обработкой rate limit
async function safeSend(bot, fn, ...args) {
  while (true) {
    try {
      return await fn(...args);
    } catch (err) {
      if (err.response && err.response.body && err.response.body.error_code === 429) {
        const retryAfter = err.response.body.parameters.retry_after || 5;
        updateStatus(colors.yellow(`Ожидание ${retryAfter}с...`), progressBar.value, progressBar.total);
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
      } else {
        throw err;
      }
    }
  }
}

// Функция для отправки поста
async function sendPost(post, current, total) {
  const { photoFiles, text, bot } = post;
  
  updateStatus(colors.yellow('Отправка...'), current, total);
  
  try {
    if (photoFiles.length === 1) {
      await safeSend(bot, bot.sendPhoto.bind(bot), CHANNEL_ID, photoFiles[0], { caption: text });
      // Переименовываем файл после успешной отправки
      await renameFile(photoFiles[0]);
    } else {
      const media = photoFiles.map((file, idx) => ({
        type: 'photo',
        media: file,
        ...(idx === 0 ? { caption: text } : {})
      }));
      await safeSend(bot, bot.sendMediaGroup.bind(bot), CHANNEL_ID, media);
      // Переименовываем все файлы после успешной отправки
      for (const file of photoFiles) {
        await renameFile(file);
      }
    }
    updateStatus(colors.green('Отправлено'), current, total);
  } catch (error) {
    updateStatus(colors.red('Ошибка'), current, total);
    console.error(colors.red(`\n✗ Ошибка отправки: ${error.message}`));
  }
}

// Функция для обработки очереди
async function processQueue() {
  if (isProcessing || postQueue.length === 0) return;
  
  isProcessing = true;
  const totalPosts = postQueue.length;
  let currentPost = 0;
  
  // Инициализируем прогресс-бар
  progressBar.start(totalPosts, 0, { status: colors.cyan('Начало отправки') });
  
  while (postQueue.length > 0) {
    const post = postQueue.shift();
    currentPost++;
    
    await sendPost(post, currentPost, totalPosts);
    await new Promise(resolve => setTimeout(resolve, POST_DELAY));
  }
  
  progressBar.stop();
  isProcessing = false;
}

async function main() {
  // Очищаем консоль
  console.clear();
  
  // Выводим заголовок
  console.log(colors.cyan('\n=== Отправка постов в Telegram ===\n'));
  console.log(colors.cyan(`Бренд: ${brand}`));
  console.log(colors.cyan(`Канал: ${CHANNEL_ID}`));
  console.log(colors.cyan(`Количество ботов: ${bots.length}\n`));

  // Читаем все файлы в папке
  const files = (await fs.readdir(brandDir))
    .filter(f => /\.(jpg|jpeg|png)$/i.test(f) && !f.startsWith('post-')); // Исключаем уже отправленные файлы

  console.log(colors.cyan(`Найдено файлов: ${files.length}`));

  // Группируем по первой цифре
  const groups = {};
  for (const file of files) {
    const match = file.match(/^([0-9]+)-/);
    if (!match) continue;
    const groupNum = match[1];
    if (!groups[groupNum]) groups[groupNum] = [];
    groups[groupNum].push(file);
  }

  console.log(colors.cyan(`Сформировано групп: ${Object.keys(groups).length}\n`));

  // Для каждой группы создаем пост и добавляем в очередь
  for (const groupNum of Object.keys(groups).sort((a, b) => a - b)) {
    const photoFiles = groups[groupNum].map(f => path.join(brandDir, f));
    
    // Извлекаем цену из первого файла в группе
    const firstFile = groups[groupNum][0];
    const priceMatch = firstFile.match(/-([0-9]+)\./);
    const price = priceMatch ? priceMatch[1] : '0';
    
        
    const text = `^^^^^^^^^^^^^^^^^^^^^^^^\n\n  ${brand}\n\n  Вартість: ${price} грн.\n\n~~~~~~~~~~~~~~~~~~~~~~~~`;
    // const text = `${brand}\nВартість: ${price}\n${hashtag}`;
    
    // Распределяем посты между ботами
    const botIndex = postQueue.length % bots.length;
    const bot = bots[botIndex];
    
    postQueue.push({
      photoFiles,
      text,
      bot
    });
  }

  // Запускаем обработку очереди
  await processQueue();
  
  console.log(colors.green('\n=== Отправка постов завершена ===\n'));
}

main().catch(error => {
  console.error(colors.red('\n=== Произошла ошибка ==='));
  console.error(colors.red(error.message));
  process.exit(1);
}); 
