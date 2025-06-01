const fs = require('fs');
const fsPromises = require('fs').promises;
const path = require('path');
const axios = require('axios');
const https = require('https');
const cliProgress = require('cli-progress');
const readline = require('readline');
const colors = require('colors');

// Создаем интерфейс для чтения ввода
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Функция для получения ввода от пользователя
function question(query) {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

// Функция для подсчета скачанных файлов
async function countDownloadedFiles(brandDir) {
  try {
    const files = await fsPromises.readdir(brandDir);
    return files.length;
  } catch {
    return 0;
  }
}

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
async function downloadImage(url, filepath, retries = 3) {
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
        timeout: 30000, // 30 секунд таймаут
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
        console.error(`Ошибка при загрузке ${url} после ${retries} попыток:`.red, error.message);
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
    console.clear(); // Очищаем консоль
    console.log('\nЗагрузка изображений\n'.bold.cyan);
    
    // Создаем главную папку
    await fsPromises.mkdir(outputDir, { recursive: true });

    // Читаем весь файл
    const fileContent = await fsPromises.readFile(jsonFilePath, 'utf8');
    
    // Парсим JSON
    const data = JSON.parse(fileContent);
    
    if (!Array.isArray(data)) {
      throw new Error('JSON файл должен содержать массив объектов');
    }

    // Группируем данные по брендам
    const brandGroups = data.reduce((acc, item) => {
      if (!acc[item.title]) {
        acc[item.title] = [];
      }
      acc[item.title].push(item);
      return acc;
    }, {});

    // Получаем список брендов и сортируем по количеству фотографий
    const brands = Object.keys(brandGroups).sort((a, b) => {
      const photosA = brandGroups[a].reduce((sum, item) => sum + (item.imgSrc?.length || 0), 0);
      const photosB = brandGroups[b].reduce((sum, item) => sum + (item.imgSrc?.length || 0), 0);
      return photosA - photosB; // Сортировка от меньшего к большему
    });
    
    // Собираем статистику для каждого бренда
    const brandStats = {};
    for (const brand of brands) {
      const brandData = brandGroups[brand];
      const totalGroups = brandData.length;
      const totalPhotos = brandData.reduce((sum, item) => sum + (item.imgSrc?.length || 0), 0);
      const brandDir = path.join(outputDir, brand);
      const downloadedPhotos = await countDownloadedFiles(brandDir);
      
      brandStats[brand] = {
        totalGroups,
        totalPhotos,
        downloadedPhotos
      };
    }

    // Выводим список брендов
    console.log('Доступные бренды:\n'.bold);
    
    for (let i = 0; i < brands.length; i++) {
      const brand = brands[i];
      const stats = brandStats[brand];
      const remaining = stats.totalPhotos - stats.downloadedPhotos;
      const progress = stats.totalPhotos > 0 ? Math.round((stats.downloadedPhotos / stats.totalPhotos) * 100) : 0;
      
      // Упрощаем название бренда
      const shortBrand = brand.split(' ')[0]; // Берем только первое слово
      
      console.log(`${i + 1}. ${shortBrand.bold.cyan}`);
      console.log(`   Групп: ${stats.totalGroups.toString().yellow}`);
      console.log(`   Всего фото: ${stats.totalPhotos.toString().yellow}`);
      console.log(`   Скачано: ${stats.downloadedPhotos.toString().green}`);
      console.log(`   Осталось: ${remaining.toString().red}`);
      console.log(`   Прогресс: ${progress}%\n`);
    }
    
    console.log('0. Загрузить все бренды'.bold.magenta);

    // Запрашиваем выбор пользователя
    const choice = await question('\nВыберите номер бренда для загрузки: '.bold);
    const selectedIndex = parseInt(choice) - 1;

    // Фильтруем данные в зависимости от выбора
    let filteredData = data;
    if (selectedIndex >= 0 && selectedIndex < brands.length) {
      const selectedBrand = brands[selectedIndex];
      filteredData = data.filter(item => item.title === selectedBrand);
      console.log(`\nВыбрана загрузка бренда: ${selectedBrand.bold.cyan}`);
    } else if (selectedIndex === -1) {
      console.log('\nВыбрана загрузка всех брендов'.bold.cyan);
    } else {
      console.log('\nНеверный выбор. Загружаем все бренды.'.yellow);
    }

    // Подсчитываем общее количество изображений
    const totalImages = filteredData.reduce((sum, item) => sum + (item.imgSrc?.length || 0), 0);
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
    for (const item of filteredData) {
      if (!item.imgSrc || !Array.isArray(item.imgSrc)) {
        console.warn('Пропущен объект без imgSrc:'.yellow, item);
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
    console.log('\nЗагрузка завершена\n'.bold.cyan);
    console.log(`Общее время: ${formatTime(totalTime).bold.green}`);
    console.log(`Загружено новых изображений: ${(processedImages - skippedImages).toString().bold.green}`);
    console.log(`Пропущено существующих: ${skippedImages.toString().bold.yellow}`);

    // Закрываем интерфейс ввода
    rl.close();
  } catch (error) {
    console.error('Ошибка:'.bold.red, error.message);
    if (error instanceof SyntaxError) {
      console.error('Ошибка в формате JSON файла. Проверьте, что файл содержит корректный JSON массив.'.yellow);
    }
    rl.close();
  }
}

// Использование
const jsonFilePath = './JSON/china-ready.json';
const outputDir = 'china-images';

processImages(jsonFilePath, outputDir);