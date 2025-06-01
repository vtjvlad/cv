const fs = require('fs');
const fsPromises = require('fs').promises;
const path = require('path');
const axios = require('axios');
const https = require('https');
const cliProgress = require('cli-progress');

// Создаем агент для игнорирования SSL ошибок
const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
  keepAlive: true,
  maxSockets: 50
});

// Функция для форматирования времени
function formatTime(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}ч ${minutes % 60}м`;
  } else if (minutes > 0) {
    return `${minutes}м ${seconds % 60}с`;
  } else {
    return `${seconds}с`;
  }
}

// Функция для задержки
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// Функция для проверки существования файла
async function fileExists(filepath) {
  try {
    await fsPromises.access(filepath);
    return true;
  } catch {
    return false;
  }
}

// Функция для загрузки одного изображения
async function downloadImage(url, filepath, retries = 2) {
  // Проверяем существование файла
  const ext = path.extname(url.split('?')[0]) || '.jpg';
  const finalPath = filepath + ext;
  
  if (await fileExists(finalPath)) {
    return true; // Файл уже существует
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await axios({
        url,
        method: 'GET',
        responseType: 'stream',
        httpsAgent,
        timeout: 5000, // 30 секунд таймаут
        maxContentLength: 50 * 1024 * 1024, // 50MB максимум
        maxBodyLength: 50 * 1024 * 1024
      });

      const writer = fs.createWriteStream(finalPath);
      response.data.pipe(writer);

      return new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });
    } catch (error) {
      if (attempt === retries) {
        console.error(`Ошибка при загрузке ${url} после ${retries} попыток:`, error.message);
        return null;
      }
      // Ждем перед следующей попыткой
      await delay(1000 * attempt);
    }
  }
}

// Функция для параллельной загрузки с ограничением
async function downloadBatch(urls, filepaths, concurrency = 15) {
  const results = [];
  for (let i = 0; i < urls.length; i += concurrency) {
    const batch = urls.slice(i, i + concurrency);
    const batchPaths = filepaths.slice(i, i + concurrency);
    
    // Загружаем батч
    const promises = batch.map((url, index) => 
      downloadImage(url, batchPaths[index])
    );
    const batchResults = await Promise.all(promises);
    results.push(...batchResults);

    // Добавляем небольшую задержку между батчами
    if (i + concurrency < urls.length) {
      await delay(1000);
    }
  }
  return results;
}

// Основная функция
async function processImages(jsonFilePath, outputDir) {
  try {
    // Создаем главную папку
    await fsPromises.mkdir(outputDir, { recursive: true });

    // Читаем весь файл
    const fileContent = await fsPromises.readFile(jsonFilePath, 'utf8');
    
    // Парсим JSON
    const data = JSON.parse(fileContent);
    
    if (!Array.isArray(data)) {
      throw new Error('JSON файл должен содержать массив объектов');
    }

    // Подсчитываем общее количество изображений
    const totalImages = data.reduce((sum, item) => sum + (item.imgSrc?.length || 0), 0);
    let processedImages = 0;
    let skippedImages = 0;
    const startTime = Date.now();

    // Создаем прогресс-бар
    const progressBar = new cliProgress.SingleBar({
      format: 'Прогресс |{bar}| {percentage}% | {value}/{total} изображений | Пропущено: {skipped} | Осталось: {eta}s',
      barCompleteChar: '\u2588',
      barIncompleteChar: '\u2591',
      hideCursor: true
    });

    // Инициализируем прогресс-бар
    progressBar.start(totalImages, 0, { skipped: 0 });

    // Обрабатываем каждый объект
    for (const item of data) {
      if (!item.imgSrc || !Array.isArray(item.imgSrc)) {
        console.warn('Пропущен объект без imgSrc:', item);
        continue;
      }

      const { rownum, title, imgSrc: imgSrcArray, price } = item;
      const brandDir = path.join(outputDir, title);
      await fsPromises.mkdir(brandDir, { recursive: true });

      const filepaths = imgSrcArray.map((_, i) => 
        path.join(brandDir, `${rownum}-${i + 1}-${price}`)
      );

      const results = await downloadBatch(imgSrcArray, filepaths);
      const newSkipped = results.filter(r => r === true).length;
      skippedImages += newSkipped;
      processedImages += imgSrcArray.length;
      
      progressBar.update(processedImages, { skipped: skippedImages });

      // Добавляем небольшую паузу между брендами
      await delay(2000);
    }

    progressBar.stop();
    const totalTime = Date.now() - startTime;
    console.log(`\nЗагрузка завершена!`);
    console.log(`Общее время: ${formatTime(totalTime)}`);
    console.log(`Загружено новых изображений: ${processedImages - skippedImages}`);
    console.log(`Пропущено существующих: ${skippedImages}`);
  } catch (error) {
    console.error('Ошибка:', error.message);
    if (error instanceof SyntaxError) {
      console.error('Ошибка в формате JSON файла. Проверьте, что файл содержит корректный JSON массив.');
    }
  }
}

// Использование
const jsonFilePath = './JSON/china-ready.json';
const outputDir = 'china-images';

processImages(jsonFilePath, outputDir);