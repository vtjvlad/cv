const readline = require('readline');
const colors = require('colors');

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

// Тестовые данные
const testBrands = [
  'Apple iPhone',
  'Samsung Galaxy', 
  'Xiaomi Redmi',
  'Huawei P Series',
  'OnePlus Nord'
];

const testBrandStats = {
  'Apple iPhone': { totalGroups: 15, totalPhotos: 150, downloadedPhotos: 75 },
  'Samsung Galaxy': { totalGroups: 20, totalPhotos: 200, downloadedPhotos: 100 },
  'Xiaomi Redmi': { totalGroups: 25, totalPhotos: 250, downloadedPhotos: 200 },
  'Huawei P Series': { totalGroups: 10, totalPhotos: 100, downloadedPhotos: 50 },
  'OnePlus Nord': { totalGroups: 8, totalPhotos: 80, downloadedPhotos: 80 }
};

// Тестовая функция интерактивного списка
async function testInteractiveList() {
  let listCheckboxes = {};
  let currentIndex = 0;
  
  // Инициализируем чекбоксы
  testBrands.forEach(brand => {
    listCheckboxes[brand] = false;
  });

  const showList = () => {
    console.clear();
    console.log(createHeader('🧪 ТЕСТ: Интерактивный список брендов'));
    
    console.log(createBox(
      'Управление:\n' +
      '↑/↓ - Навигация по списку\n' +
      'Space - Переключить чекбокс\n' +
      'Enter - Выход из списка\n' +
      'a - Выбрать все\n' +
      'n - Снять все выделения'
    ).cyan);
    
    // Выводим список с чекбоксами
    testBrands.forEach((brand, index) => {
      const stats = testBrandStats[brand];
      const progress = Math.round((stats.downloadedPhotos / stats.totalPhotos) * 100);
      const isChecked = listCheckboxes[brand] || false;
      const isCurrent = index === currentIndex;
      
      // Определяем цвет прогресса
      let progressColor = 'white';
      if (progress === 100) progressColor = 'green';
      else if (progress >= 75) progressColor = 'cyan';
      else if (progress >= 50) progressColor = 'yellow';
      else if (progress >= 25) progressColor = 'magenta';
      else progressColor = 'red';

      // Создаем визуальный чекбокс
      const checkbox = isChecked ? '☑️ '.green : '☐ '.gray;
      const filledBlocks = Math.floor(progress / 10);
      const emptyBlocks = 10 - filledBlocks;
      const progressBar = '█'.repeat(filledBlocks)[progressColor] + '░'.repeat(emptyBlocks).gray;
      
      // Подсветка текущего элемента
      const line = `${checkbox}${(index + 1).toString().padStart(2, ' ')}. ` +
        `${brand.padEnd(20).cyan} ` +
        `📁 ${stats.totalGroups.toString().padStart(3, ' ').yellow} групп ` +
        `[${progressBar}] ` +
        `${progress}%`.bold[progressColor] + ' ' +
        `(${stats.downloadedPhotos}/${stats.totalPhotos} фото)`.gray;
      
      if (isCurrent) {
        console.log(`➤ ${line}`.bold.white);
      } else {
        console.log(`  ${line}`);
      }
    });

    // Показываем статистику выбранных чекбоксов
    const checkedCount = Object.values(listCheckboxes).filter(Boolean).length;
    console.log(createSubHeader(`Отмечено чекбоксов: ${checkedCount}/${testBrands.length} | Текущий: ${currentIndex + 1}`));
  };

  return new Promise((resolve) => {
    readline.emitKeypressEvents(process.stdin);
    process.stdin.setRawMode(true);

    const onKeypress = (str, key) => {
      if (key.ctrl && key.name === 'c') {
        process.stdin.setRawMode(false);
        process.exit();
      }

      switch (key.name) {
        case 'up':
          currentIndex = Math.max(0, currentIndex - 1);
          showList();
          break;
        case 'down':
          currentIndex = Math.min(testBrands.length - 1, currentIndex + 1);
          showList();
          break;
        case 'space':
          const currentBrand = testBrands[currentIndex];
          if (currentBrand) {
            listCheckboxes[currentBrand] = !listCheckboxes[currentBrand];
            showList();
          }
          break;
        case 'a':
          // Выбрать все
          testBrands.forEach(brand => {
            listCheckboxes[brand] = true;
          });
          showList();
          break;
        case 'n':
          // Снять все выделения
          testBrands.forEach(brand => {
            listCheckboxes[brand] = false;
          });
          showList();
          break;
        case 'return':
        case 'enter':
          process.stdin.setRawMode(false);
          process.stdin.removeListener('keypress', onKeypress);
          console.log('\n✅ Тест завершен!'.green);
          console.log('Состояние чекбоксов:');
          Object.entries(listCheckboxes).forEach(([brand, checked]) => {
            console.log(`  ${checked ? '☑️' : '☐'} ${brand}`);
          });
          resolve();
          break;
      }
    };

    process.stdin.on('keypress', onKeypress);
    showList(); // Показываем начальное состояние
  });
}

// Запускаем тест
console.log('🚀 Запуск теста интерактивного списка...'.bold.green);
testInteractiveList().then(() => {
  process.exit(0);
}); 