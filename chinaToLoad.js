const fs = require('fs');
const fsPromises = require('fs').promises;
const path = require('path');
const axios = require('axios');
const https = require('https');
const cliProgress = require('cli-progress');
const { default: inquirer } = require('inquirer');
const { default: ora } = require('ora');
const colors = require('colors');

// Создаем агент для игнорирования SSL ошибок
const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
  keepAlive: true,
  maxSockets: 50
});

// Создаем пул агентов для лучшего управления соединениями
const createAgents = (count) => {
  return Array(count).fill(null).map(() => new https.Agent({
    rejectUnauthorized: false,
    keepAlive: true,
    maxSockets: 50,
    timeout: 30000
  }));
};

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

// Функция для подсчета скачанных файлов
async function countDownloadedFiles(brandDir) {
  try {
    const files = await fsPromises.readdir(brandDir);
    return files.length;
  } catch {
    return 0;
  }
}

// Функция для загрузки одного изображения
async function downloadImage(url, filepath, agent, retries = 3) {
  const ext = path.extname(url.split('?')[0]) || '.jpg';
  const finalPath = filepath + ext;
  
  if (await fileExists(finalPath)) {
    return true;
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await axios({
        url,
        method: 'GET',
        responseType: 'stream',
        httpsAgent: agent,
        timeout: 30000,
        maxContentLength: 50 * 1024 * 1024,
        maxBodyLength: 50 * 1024 * 1024,
        headers: {
          'Connection': 'keep-alive',
          'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
          'Accept-Encoding': 'gzip, deflate, br',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
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
      await delay(1000 * attempt);
    }
  }
}

// Функция для параллельной загрузки с ограничением
async function downloadBatch(urls, filepaths, concurrency = 15) {
  const results = [];
  const agents = createAgents(concurrency);
  let agentIndex = 0;

  // Разбиваем на более мелкие батчи для лучшего контроля
  const batchSize = Math.ceil(urls.length / Math.ceil(urls.length / concurrency));
  
  for (let i = 0; i < urls.length; i += batchSize) {
    const batch = urls.slice(i, i + batchSize);
    const batchPaths = filepaths.slice(i, i + batchSize);
    
    const promises = batch.map((url, index) => {
      const agent = agents[agentIndex];
      agentIndex = (agentIndex + 1) % agents.length;
      return downloadImage(url, batchPaths[index], agent);
    });

    const batchResults = await Promise.all(promises);
    results.push(...batchResults);

    // Небольшая задержка между батчами для предотвращения перегрузки
    if (i + batchSize < urls.length) {
      await delay(500);
    }
  }
  return results;
}

// Функция для создания интерфейса выбора брендов
async function showBrandSelection(brands, brandStats) {
  let currentSort = 'photos'; // photos, name, progress
  let showFullNames = false;
  let searchQuery = '';
  let filteredBrands = [...brands];
  let selectedBrands = [];

  const updateDisplay = () => {
    // Фильтрация по поиску
    filteredBrands = brands.filter(brand => 
      brand.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Сортировка
    filteredBrands.sort((a, b) => {
      const statsA = brandStats[a];
      const statsB = brandStats[b];
      const progressA = statsA.totalPhotos > 0 ? (statsA.downloadedPhotos / statsA.totalPhotos) * 100 : 0;
      const progressB = statsB.totalPhotos > 0 ? (statsB.downloadedPhotos / statsB.totalPhotos) * 100 : 0;

      switch (currentSort) {
        case 'photos':
          return statsB.totalPhotos - statsA.totalPhotos;
        case 'name':
          return a.localeCompare(b);
        case 'progress':
          return progressB - progressA;
        default:
          return 0;
      }
    });
  };

  const createBrandChoice = (brand) => {
    const stats = brandStats[brand];
    const displayName = showFullNames ? brand : brand.split(' ')[0];
    const remaining = stats.totalPhotos - stats.downloadedPhotos;
    const progress = stats.totalPhotos > 0 ? Math.round((stats.downloadedPhotos / stats.totalPhotos) * 100) : 0;
    
    return {
      name: `${displayName} 📸 ${stats.totalPhotos} фото (${progress}% готово)`,
      value: brand,
      short: displayName,
      stats
    };
  };

  const showMainMenu = async () => {
    console.clear();
    console.log('\n=== Выбор брендов для загрузки ===\n'.bold.cyan);
    console.log('Управление:'.bold);
    console.log('Space - Выбрать/отменить');
    console.log('Enter - Завершить выбор\n');

    if (searchQuery) {
      console.log(`Поиск: ${searchQuery.bold.yellow}\n`);
    }

    console.log(`Сортировка: ${currentSort.bold.cyan}`);
    console.log(`Отображение: ${(showFullNames ? 'Полные названия' : 'Короткие названия').bold.cyan}\n`);

    if (selectedBrands.length > 0) {
      console.log('Выбранные бренды:'.bold.green);
      selectedBrands.forEach(brand => {
        const stats = brandStats[brand];
        const progress = stats.totalPhotos > 0 ? Math.round((stats.downloadedPhotos / stats.totalPhotos) * 100) : 0;
        console.log(`- ${brand} (${progress}% готово)`.green);
      });
      console.log('');
    }

    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'Выберите действие:',
        choices: [
          { name: 'Выбрать бренды', value: 'select' },
          { name: 'Изменить сортировку', value: 'sort' },
          { name: 'Переключить отображение названий', value: 'names' },
          { name: 'Поиск по названию', value: 'search' },
          { name: 'Показать простой список', value: 'simple_list' },
          { name: 'Очистить выбор', value: 'clear' },
          { name: 'Завершить выбор и продолжить', value: 'done' },
          new inquirer.Separator(),
          { name: 'Отмена', value: 'cancel' },
          { name: 'Выход', value: 'exit' }
        ]
      }
    ]);

    return action;
  };

  while (true) {
    const action = await showMainMenu();

    switch (action) {
      case 'select': {
        const choices = [
          {
            name: '📦 Загрузить все бренды',
            value: 'all',
            short: 'Все'
          },
          ...filteredBrands.map(createBrandChoice),
          new inquirer.Separator(),
          { name: '❌ Отмена', value: 'cancel' }
        ];

        const { newSelectedBrands } = await inquirer.prompt([
          {
            type: 'checkbox',
            name: 'newSelectedBrands',
            message: 'Выберите бренды для загрузки:',
            choices,
            pageSize: 20,
            default: selectedBrands,
            validate: (answer) => {
              if (answer.includes('cancel')) {
                return true;
              }
              if (answer.length < 1) {
                return 'Выберите хотя бы один бренд';
              }
              return true;
            }
          }
        ]);

        if (newSelectedBrands.includes('cancel')) {
          continue;
        }
        selectedBrands = newSelectedBrands;
        break;
      }

      case 'sort': {
        const { newSort } = await inquirer.prompt([
          {
            type: 'list',
            name: 'newSort',
            message: 'Выберите тип сортировки:',
            choices: [
              { name: 'По количеству фото', value: 'photos' },
              { name: 'По названию', value: 'name' },
              { name: 'По прогрессу загрузки', value: 'progress' },
              new inquirer.Separator(),
              { name: '❌ Отмена', value: 'cancel' }
            ],
            default: currentSort
          }
        ]);

        if (newSort === 'cancel') {
          continue;
        }
        currentSort = newSort;
        break;
      }

      case 'names':
        showFullNames = !showFullNames;
        break;

      case 'search': {
        const { query } = await inquirer.prompt([
          {
            type: 'input',
            name: 'query',
            message: 'Введите текст для поиска (или "отмена" для возврата):',
            default: searchQuery,
            validate: (input) => {
              if (input.toLowerCase() === 'отмена') {
                return true;
              }
              return true;
            }
          }
        ]);

        if (query.toLowerCase() === 'отмена') {
          continue;
        }
        searchQuery = query;
        break;
      }

      case 'clear':
        selectedBrands = [];
        break;

      case 'done':
        if (selectedBrands.length > 0) {
          return selectedBrands;
        } else {
          console.log('\n⚠️ Выберите хотя бы один бренд перед продолжением'.yellow);
          await delay(2000);
        }
        break;

      case 'cancel':
        continue;

      case 'exit':
        process.exit(0);

      case 'simple_list': {
        console.clear();
        console.log('\n=== Список брендов ===\n'.bold.cyan);
        
        // Сортируем бренды
        const sortedBrands = [...filteredBrands].sort((a, b) => {
          const statsA = brandStats[a];
          const statsB = brandStats[b];
          const progressA = statsA.totalPhotos > 0 ? (statsA.downloadedPhotos / statsA.totalPhotos) * 100 : 0;
          const progressB = statsB.totalPhotos > 0 ? (statsB.downloadedPhotos / statsB.totalPhotos) * 100 : 0;

          switch (currentSort) {
            case 'photos':
              return statsB.totalPhotos - statsA.totalPhotos;
            case 'name':
              return a.localeCompare(b);
            case 'progress':
              return progressB - progressA;
            default:
              return 0;
          }
        });

        // Выводим список
        sortedBrands.forEach((brand, index) => {
          const stats = brandStats[brand];
          const displayName = showFullNames ? brand : brand.split(' ')[0];
          const progress = Math.max(0, Math.min(100, stats.totalPhotos > 0 ? 
            Math.round((stats.downloadedPhotos / stats.totalPhotos) * 100) : 0));
          const isSelected = selectedBrands.includes(brand);
          
          const status = isSelected ? '✓'.green : ' ';
          const filledBlocks = Math.max(0, Math.min(10, Math.floor(progress / 10)));
          const emptyBlocks = 10 - filledBlocks;
          const progressBar = '█'.repeat(filledBlocks) + '░'.repeat(emptyBlocks);
          
          console.log(
            `${status} ${(index + 1).toString().padStart(2, ' ')}. ${displayName.padEnd(20)} ` +
            `📁 ${stats.totalGroups.toString().padStart(3, ' ')} групп ` +
            `[${progressBar}] ${progress}% ` +
            `(${stats.downloadedPhotos}/${stats.totalPhotos} фото)`
          );
        });

        console.log('\nНажмите Enter для возврата в меню...');
        await new Promise(resolve => process.stdin.once('data', resolve));
        continue;
      }
    }
  }
}

// Основная функция
async function processImages(jsonFilePath, outputDir) {
  try {
    console.clear();
    const spinner = ora({
      text: '📥 Загрузка данных...',
      color: 'cyan'
    }).start();

    // Создаем главную папку
    await fsPromises.mkdir(outputDir, { recursive: true });

    // Читаем и парсим JSON
    const fileContent = await fsPromises.readFile(jsonFilePath, 'utf8');
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
      return photosA - photosB;
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

    spinner.succeed('✅ Данные загружены');

    // Используем новый интерфейс выбора брендов
    const selectedBrands = await showBrandSelection(brands, brandStats);

    // Запрашиваем настройки загрузки
    const { concurrency, retryCount, format, structure, errorHandling, logging } = await inquirer.prompt([
      {
        type: 'list',
        name: 'format',
        message: '📁 Формат сохранения файлов:',
        choices: [
          { name: 'Оригинальный формат (как есть)', value: 'original' },
          { name: 'Только JPG', value: 'jpg' },
          { name: 'Только PNG', value: 'png' },
          { name: 'Определять по содержимому', value: 'auto' }
        ],
        default: 'original'
      },
      {
        type: 'list',
        name: 'structure',
        message: '📂 Структура папок:',
        choices: [
          { name: 'Плоская структура (все в одной папке)', value: 'flat' },
          { name: 'По брендам', value: 'brands' },
          { name: 'По брендам и группам', value: 'groups' },
          { name: 'По дате загрузки', value: 'date' }
        ],
        default: 'brands'
      },
      {
        type: 'number',
        name: 'concurrency',
        message: '⚡ Количество одновременных загрузок:',
        default: 30,
        validate: (value) => {
          if (value < 1 || value > 100) {
            return 'Введите число от 1 до 100';
          }
          return true;
        }
      },
      {
        type: 'number',
        name: 'retryCount',
        message: '🔄 Количество попыток загрузки:',
        default: 3,
        validate: (value) => {
          if (value < 1 || value > 10) {
            return 'Введите число от 1 до 10';
          }
          return true;
        }
      },
      {
        type: 'list',
        name: 'errorHandling',
        message: '⚠️ Обработка ошибок:',
        choices: [
          { name: 'Пропускать ошибки и продолжать', value: 'skip' },
          { name: 'Останавливаться при ошибке', value: 'stop' },
          { name: 'Повторять до успеха', value: 'retry' },
          { name: 'Сохранять в отдельную папку', value: 'separate' }
        ],
        default: 'skip'
      },
      {
        type: 'checkbox',
        name: 'logging',
        message: '📝 Логирование:',
        choices: [
          { name: 'Сохранять лог в файл', value: 'file' },
          { name: 'Показывать детальный прогресс', value: 'progress' },
          { name: 'Сохранять статистику', value: 'stats' },
          { name: 'Отправлять уведомления', value: 'notify' }
        ],
        default: ['progress']
      }
    ]);

    // Фильтруем данные в зависимости от выбора
    let filteredData = data;
    if (!selectedBrands.includes('all')) {
      filteredData = data.filter(item => selectedBrands.includes(item.title));
      console.log(`\n🎯 Выбраны бренды: ${selectedBrands.join(', ').bold.cyan}`);
    } else {
      console.log('\n🎯 Выбрана загрузка всех брендов'.bold.cyan);
    }

    // Выводим выбранные настройки
    console.log('\n⚙️ Настройки загрузки:'.bold.cyan);
    console.log(`📁 Формат: ${(format || 'original').bold}`);
    console.log(`📂 Структура: ${(structure || 'brands').bold}`);
    console.log(`⚡ Одновременных загрузок: ${(concurrency || 15).toString().bold}`);
    console.log(`🔄 Попыток: ${(retryCount || 3).toString().bold}`);
    console.log(`⚠️ Обработка ошибок: ${(errorHandling || 'skip').bold}`);
    console.log(`📝 Логирование: ${(logging || ['progress']).join(', ').bold}\n`);

    // Подсчитываем общее количество изображений
    const totalImages = filteredData.reduce((sum, item) => sum + (item.imgSrc?.length || 0), 0);
    let processedImages = 0;
    let skippedImages = 0;
    const startTime = Date.now();

    // Создаем прогресс-бар
    const progressBar = new cliProgress.SingleBar({
      format: '📊 Прогресс |{bar}| {percentage}% | {value}/{total} изображений | Пропущено: {skipped} | Осталось: {eta}s',
      barCompleteChar: '█',
      barIncompleteChar: '░',
      hideCursor: true
    });

    // Инициализируем прогресс-бар
    progressBar.start(totalImages, 0, { skipped: 0 });

    // Обрабатываем каждый объект
    for (const item of filteredData) {
      if (!item.imgSrc || !Array.isArray(item.imgSrc)) {
        console.warn('⚠️ Пропущен объект без imgSrc:'.yellow, item);
        continue;
      }

      const { rownum = '0', title = 'unknown', imgSrc: imgSrcArray, price = '0' } = item;
      
      // Определяем путь сохранения в зависимости от выбранной структуры
      let brandDir = outputDir;
      switch (structure || 'brands') {
        case 'brands':
          brandDir = path.join(outputDir, title);
          break;
        case 'groups':
          brandDir = path.join(outputDir, title, `group-${rownum}`);
          break;
        case 'date':
          const today = new Date().toISOString().split('T')[0];
          brandDir = path.join(outputDir, today, title);
          break;
        default:
          brandDir = path.join(outputDir, title);
      }
      
      await fsPromises.mkdir(brandDir, { recursive: true });

      const filepaths = imgSrcArray.map((_, i) => {
        let filename = `${rownum}-${i + 1}-${price}`;
        if (format === 'jpg') filename += '.jpg';
        else if (format === 'png') filename += '.png';
        return path.join(brandDir, filename);
      });

      const results = await downloadBatch(imgSrcArray, filepaths, concurrency);
      const newSkipped = results.filter(r => r === true).length;
      skippedImages += newSkipped;
      processedImages += imgSrcArray.length;
      
      progressBar.update(processedImages, { skipped: skippedImages });

      await delay(1000);
    }

    progressBar.stop();
    const totalTime = Date.now() - startTime;
    
    console.log('\n✨ Загрузка завершена\n'.bold.cyan);
    console.log(`⏱️ Общее время: ${formatTime(totalTime).bold.green}`);
    console.log(`📥 Загружено новых изображений: ${(processedImages - skippedImages).toString().bold.green}`);
    console.log(`⏭️ Пропущено существующих: ${skippedImages.toString().bold.yellow}`);

    // Сохраняем статистику если выбрано
    if (logging && logging.includes('stats')) {
      const stats = {
        totalTime,
        processedImages,
        skippedImages,
        selectedBrands,
        settings: {
          format: format || 'original',
          structure: structure || 'brands',
          concurrency: concurrency || 15,
          retryCount: retryCount || 3,
          errorHandling: errorHandling || 'skip',
          logging: logging || ['progress']
        }
      };
      await fsPromises.writeFile(
        path.join(outputDir, 'stats.json'),
        JSON.stringify(stats, null, 2)
      );
    }

  } catch (error) {
    console.error('❌ Ошибка:'.bold.red, error.message);
    if (error instanceof SyntaxError) {
      console.error('⚠️ Ошибка в формате JSON файла. Проверьте, что файл содержит корректный JSON массив.'.yellow);
    }
  }
}

// Использование
const jsonFilePath = './JSON/china-ready.json';
const outputDir = 'china-images';

processImages(jsonFilePath, outputDir);