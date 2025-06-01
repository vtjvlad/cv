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
  maxSockets: 137
});

// Создаем пул агентов для лучшего управления соединениями
const createAgents = (count) => {
  return Array(count).fill(null).map(() => new https.Agent({
    rejectUnauthorized: false,
    keepAlive: true,
    maxSockets: 137,
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

// Функция для создания агента с таймаутами
const createAgent = () => new https.Agent({
  rejectUnauthorized: false,
  keepAlive: true,
  maxSockets: 50,
  timeout: 30000,
  keepAliveMsecs: 30000
});

// Функция для проверки зависания
async function checkHang(startTime, timeout = 30000) {
  if (Date.now() - startTime > timeout) {
    throw new Error('Операция зависла');
  }
}

// Функция для загрузки одного изображения
async function downloadImage(url, filepath, agent, retries = 3) {
  const ext = path.extname(url.split('?')[0]) || '.jpg';
  const finalPath = filepath + ext;
  
  // Проверяем существование файла
  if (await fileExists(finalPath)) {
    return { status: 'skipped', path: finalPath }; // Возвращаем объект с информацией о пропуске
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    const startTime = Date.now();
    try {
      const response = await Promise.race([
        axios({
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
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Таймаут запроса')), 30000)
        )
      ]);

      const writer = fs.createWriteStream(finalPath);
      let bytesWritten = 0;
      let lastProgress = Date.now();
      let isHanging = false;

      const hangCheckPromise = new Promise((resolve, reject) => {
        const checkInterval = setInterval(() => {
          if (Date.now() - lastProgress > 10000) {
            isHanging = true;
            clearInterval(checkInterval);
            reject(new Error('Загрузка зависла'));
          }
        }, 1000);

        writer.on('finish', () => {
          clearInterval(checkInterval);
          resolve();
        });

        writer.on('error', (err) => {
          clearInterval(checkInterval);
          reject(err);
        });
      });

      response.data.on('data', (chunk) => {
        bytesWritten += chunk.length;
        lastProgress = Date.now();
      });

    response.data.pipe(writer);

      try {
        await hangCheckPromise;
        return { status: 'downloaded', path: finalPath }; // Возвращаем объект с информацией об успешной загрузке
      } catch (error) {
        if (isHanging) {
          writer.destroy();
          fs.unlink(finalPath, () => {});
          throw error;
        }
        throw error;
      }
    } catch (error) {
      if (attempt === retries) {
        console.error(createBox(`Ошибка при загрузке ${url} после ${retries} попыток:`.red + '\n' + error.message));
        return { status: 'failed', path: finalPath }; // Возвращаем объект с информацией об ошибке
      }
      await delay(2000 * attempt);
    }
  }
}

// Функция для параллельной загрузки с ограничением
async function downloadBatch(urls, filepaths, concurrency = 137) {
  const results = [];
  const agents = Array(concurrency).fill(null).map(() => createAgent());
  let agentIndex = 0;

  const batchSize = Math.ceil(urls.length / Math.ceil(urls.length / concurrency));
  
  for (let i = 0; i < urls.length; i += batchSize) {
    const batchStartTime = Date.now();
    const batch = urls.slice(i, i + batchSize);
    const batchPaths = filepaths.slice(i, i + batchSize);
    
    const promises = batch.map((url, index) => {
      const agent = agents[agentIndex];
      agentIndex = (agentIndex + 1) % agents.length;
      return downloadImage(url, batchPaths[index], agent).catch(error => {
        console.error(createBox(`Ошибка при загрузке файла:`.red + '\n' + error.message));
        return { status: 'failed', path: batchPaths[index] };
      });
    });

    try {
      const batchResults = await Promise.race([
        Promise.all(promises),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Таймаут батча')), 60000)
        )
      ]);
      results.push(...batchResults);
  } catch (error) {
      console.error(createBox('Ошибка при загрузке батча:'.red + '\n' + error.message));
      results.push(...Array(batch.length).fill({ status: 'failed', path: batchPaths[0] }));
    }

    if (Date.now() - batchStartTime > 60000) {
      console.warn(createBox('Предупреждение: батч выполнялся слишком долго'.yellow));
    }

    if (i + batchSize < urls.length) {
      await delay(1000);
    }
  }
  return results;
}

// Функция для создания рамки
function createBox(text, width = 50) {
  const lines = text.split('\n');
  const maxLength = Math.max(...lines.map(line => line.length), width);
  const top = '╔' + '═'.repeat(maxLength + 2) + '╗';
  const bottom = '╚' + '═'.repeat(maxLength + 2) + '╝';
  const content = lines.map(line => '║ ' + line.padEnd(maxLength) + ' ║').join('\n');
  return `${top}\n${content}\n${bottom}`;
}

// Функция для создания заголовка
function createHeader(text) {
  const width = process.stdout.columns - 4;
  const padding = Math.floor((width - text.length) / 2);
  const header = '═'.repeat(padding) + ' ' + text + ' ' + '═'.repeat(padding);
  return '\n' + '╔' + header + '╗\n' + '╚' + '═'.repeat(header.length) + '╝\n';
}

// Функция для создания подзаголовка
function createSubHeader(text) {
  return '\n' + '─'.repeat(process.stdout.columns - 4).gray + '\n' + text.bold.cyan + '\n' + '─'.repeat(process.stdout.columns - 4).gray + '\n';
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
    console.log(createHeader('Выбор брендов для загрузки'));
    
    console.log(createBox(
      'Управление:\n' +
      'Space - Выбрать/отменить\n' +
      'Enter - Завершить выбор'
    ).cyan);

    if (searchQuery) {
      console.log(createSubHeader(`Поиск: ${searchQuery.bold.yellow}`));
    }

    console.log(createBox(
      `Сортировка: ${currentSort.bold.cyan}\n` +
      `Отображение: ${(showFullNames ? 'Полные названия' : 'Короткие названия').bold.cyan}`
    ).cyan);

    if (selectedBrands.length > 0) {
      console.log(createSubHeader('Выбранные бренды'));
      selectedBrands.forEach(brand => {
        const stats = brandStats[brand];
        const progress = stats.totalPhotos > 0 ? Math.round((stats.downloadedPhotos / stats.totalPhotos) * 100) : 0;
        console.log(createBox(`${brand} (${progress}% готово)`).green);
      });
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
        console.log(createHeader('Список брендов'));
        
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
          
          // Определяем цвет прогресса
          let progressColor = 'white';
          if (progress === 100) progressColor = 'green';
          else if (progress >= 75) progressColor = 'cyan';
          else if (progress >= 50) progressColor = 'yellow';
          else if (progress >= 25) progressColor = 'magenta';
          else progressColor = 'red';

          const status = isSelected ? '✓'.green : ' ';
          const filledBlocks = Math.max(0, Math.min(10, Math.floor(progress / 10)));
          const emptyBlocks = 10 - filledBlocks;
          const progressBar = '█'.repeat(filledBlocks)[progressColor] + '░'.repeat(emptyBlocks).gray;
          
          console.log(
            `${status} ${(index + 1).toString().padStart(2, ' ')}. ` +
            `${displayName.padEnd(20).cyan} ` +
            `📁 ${stats.totalGroups.toString().padStart(3, ' ').yellow} групп ` +
            `[${progressBar}] ` +
            `${progress}%`.bold[progressColor] + ' ' +
            `(${stats.downloadedPhotos}/${stats.totalPhotos} фото)`.gray
          );
        });

        console.log(createSubHeader('Нажмите Enter для возврата в меню...'));
        await new Promise(resolve => process.stdin.once('data', resolve));
        continue;
      }
    }
  }
}

// Функция для создания анимированного спиннера
function createSpinner(text) {
  const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  let i = 0;
  return setInterval(() => {
    process.stdout.write(`\r${frames[i]} ${text}`);
    i = (i + 1) % frames.length;
  }, 80);
}

// Функция для создания красивого прогресс-бара
function createProgressBar(current, total, width = 30) {
  const progress = Math.round((current / total) * width);
  const filled = '█'.repeat(progress);
  const empty = '░'.repeat(width - progress);
  const percentage = Math.round((current / total) * 100);
  return `[${filled}${empty}] ${percentage}%`;
}

// Функция для форматирования скорости загрузки
function formatSpeed(bytes, ms) {
  const speed = bytes / (ms / 1000);
  if (speed > 1024 * 1024) {
    return `${(speed / (1024 * 1024)).toFixed(2)} MB/s`;
  } else if (speed > 1024) {
    return `${(speed / 1024).toFixed(2)} KB/s`;
  }
  return `${speed.toFixed(2)} B/s`;
}

// Основная функция
async function processImages(jsonFilePath, outputDir) {
  try {
    console.clear();
    const spinner = ora({
      text: '📥 Загрузка данных...',
      color: 'cyan',
      spinner: 'dots'
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
        default: 42,
        validate: (value) => {
          if (value < 1 || value > 137) {
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

    // Создаем улучшенный прогресс-бар
    const progressBar = new cliProgress.SingleBar({
      clearOnComplete: false,
      hideCursor: true,
      format: '📊 {bar} {percentage}% | {value}/{total} | {speed} | {brand} | ⏱️ {eta}s | ⏭️ {skipped} | ❌ {failed} | 👥 {agents} | 📦 {batches}',
      barCompleteChar: '█',
      barIncompleteChar: '░',
      stopOnComplete: true,
      forceRedraw: true,
      barGlue: '\x1b[37m',
      formatValue: (v, options, type) => {
        return type === 'value' ? v.toString().padStart(options.valueSize) : v;
      }
    });

    // Инициализируем прогресс-бар с более короткими метками
    progressBar.start(totalImages, 0, {
      speed: '0 B/s',
      brand: 'Начало',
      skipped: 0,
      failed: 0,
      agents: concurrency,
      batches: Math.ceil(totalImages / concurrency)
    });

    let currentBrand = '';
    let brandStartTime = Date.now();
    let brandProcessed = 0;
    let lastUpdateTime = Date.now();
    let lastProcessedCount = 0;
    let activeAgents = concurrency;
    let activeBatches = Math.ceil(totalImages / concurrency);

    // Обрабатываем каждый объект
    for (const item of filteredData) {
      try {
        if (!item.imgSrc || !Array.isArray(item.imgSrc)) {
          console.warn(createBox('⚠️ Пропущен объект без imgSrc:'.yellow + '\n' + JSON.stringify(item, null, 2)));
          continue;
        }

        const { rownum = '0', title = 'unknown', imgSrc: imgSrcArray, price = '0' } = item;
        
        // Если сменился бренд, обновляем статистику
        if (title !== currentBrand) {
          currentBrand = title;
          brandStartTime = Date.now();
          brandProcessed = 0;
        }

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
        const newSkipped = results.filter(r => r.status === 'skipped').length;
        const newFailed = results.filter(r => r.status === 'failed').length;
        const newDownloaded = results.filter(r => r.status === 'downloaded').length;
        
        skippedImages += newSkipped;
        processedImages += imgSrcArray.length;
        brandProcessed += imgSrcArray.length;
        
        // Обновляем прогресс-бар
        const currentTime = Date.now();
        const elapsed = currentTime - brandStartTime;
        const timeSinceLastUpdate = currentTime - lastUpdateTime;
        
        let speed = '0 B/s';
        if (timeSinceLastUpdate >= 1000) {
          const processedSinceLastUpdate = processedImages - lastProcessedCount;
          speed = formatSpeed(processedSinceLastUpdate * 1024 * 1024, timeSinceLastUpdate);
          lastUpdateTime = currentTime;
          lastProcessedCount = processedImages;
        }
        
        // Сокращаем название бренда если оно слишком длинное
        const displayBrand = title.length > 15 ? title.substring(0, 12) + '...' : title;
        
        progressBar.update(processedImages, {
          speed,
          brand: displayBrand.cyan,
          skipped: skippedImages,
          failed: newFailed,
          agents: activeAgents,
          batches: activeBatches
        });

        // Небольшая задержка между обновлениями
        await delay(100);
      } catch (error) {
        console.error(createBox(`Ошибка при обработке бренда ${item.title}:`.red + '\n' + error.message));
        // Продолжаем с следующим брендом
        continue;
      }
    }

    progressBar.stop();
    const totalTime = Date.now() - startTime;
    
    console.log(createHeader('✨ Загрузка завершена'));
    console.log(createBox(
      `⏱️ Общее время: ${formatTime(totalTime).bold.green}\n` +
      `📥 Загружено новых изображений: ${(processedImages - skippedImages).toString().bold.green}\n` +
      `⏭️ Пропущено существующих: ${skippedImages.toString().bold.yellow}\n` +
      `⚡ Средняя скорость: ${formatSpeed(processedImages * 1024 * 1024, totalTime).bold.cyan}`
    ).cyan);

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
    console.error(createBox('❌ Критическая ошибка:'.bold.red + '\n' + error.message));
    if (error instanceof SyntaxError) {
      console.error(createBox('⚠️ Ошибка в формате JSON файла. Проверьте, что файл содержит корректный JSON массив.'.yellow));
    }
  }
}

// Использование
const jsonFilePath = './JSON/china-ready.json';
const outputDir = 'china-images';

processImages(jsonFilePath, outputDir);