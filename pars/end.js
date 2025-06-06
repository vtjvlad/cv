const { cleanTitle } = require('../user_modules/titleClean');
// const { cleanTitle } = require('./user_modules/titleClean');
// const { wrapPriceCode } = require('./user_modules/warpPrice');
// const { convertPrice } = require('./user_modules/convPrice');
function processJson(jsonData) {
    // Проверяем, является ли jsonData массивом
    if (!Array.isArray(jsonData)) {
        throw new Error('Входные данные должны быть массивом объектов');
    }

    return jsonData.map(item => {
        // Проверяем наличие необходимых полей
        if (!item.nm || !item.imgSrc) {
            console.warn('Пропущено поле title или imgsSrc в объекте:', item);
            return item; // Возвращаем объект без изменений, если поля отсутствуют
        }
        return {
            ...item,
            // title: wrapPriceCode(item.title), // Обрабатываем title
            nm: cleanTitle(item.title), // Добавляем новое поле ctrsname
            // title: cleanTitle(item.title), // Обрабатываем title
            // price: convertPrice(item.title) // Добавляем новое поле ctrsname
        };
    });
}

function analyzeResults(data) {
    const stats = {
        empty: 0,
        mixed: 0,
        chineseOnly: 0,
        englishOnly: 0
    };

    data.forEach(item => {
        const text = item.ctrsname;
        
        if (!text) {
            stats.empty++;
            return;
        }

        // Проверяем наличие китайских символов
        const hasChinese = /[\u4E00-\u9FFF]/.test(text);
        // Проверяем наличие английских символов
        const hasEnglish = /[a-zA-Z]/.test(text);

        if (hasChinese && hasEnglish) {
            stats.mixed++;
        } else if (hasChinese) {
            stats.chineseOnly++;
        } else if (hasEnglish) {
            stats.englishOnly++;
        }
    });

    return stats;
}


// function countUniqueTitles(items) {
//     const titleCount = {};
//     items.forEach(item => {
//         if (item.title) {
//             titleCount[item.title] = (titleCount[item.title] || 0) + 1;
//         }
//     });
//     return titleCount;
// }


// const titleCount = countUniqueTitles();
// const brandTitles = {};
// const barands = ['Dior','COACH','MIUMIU','Santoni','Olympia','Burberry','Valentino','Balenciaga','Thom Browne','Stefano Ricci','Philipp Plein','Louis Vuitton','Bottega Veneta','Dolce & Gabbana','Village Garavani','Ermenegildo Zegna','Brunello Cucinelli','Alexander McQueen','Christian Louboutin','Common Projects','Giuseppe Zanotti','Lacoste','Karl Lagerfeld','Converse','Hermes','Valentino','Trillionaire','Loro Piana','Balenciaga','Dsquared2','Moncler','Ferragamo','Givenchy','Tom Ford','Versace','Armani','Gucci','Off-White','Chanel','Kenzo','Bally','Balmain','Nike','Hogan','Y-3','Berluti','Zara','Premiata','Fendi','Tod’s','Prada','Amiri','Boss','Rick Owens']

//  // Считаем только тайтлы, которые содержат известные бренды
//  let unnamedCount = 0;
//  for (const [title, count] of Object.entries(titleCount)) {
//      const isBrandTitle = brands.some(brand => title.toLowerCase().includes(brand.toLowerCase()));
//      if (isBrandTitle) {
//          brandTitles[title] = count;
//      } else {
//          unnamedCount++;
//      }
//  }

//  console.log('\nУникальные тайтлы с брендами:');
//     for (const [title, count] of Object.entries(brandTitles)) {
//         console.log(`${title} (${count})`);
//     }



// Пример использования


const fs = require('fs');

fs.readFile('../JSON/pear.json', 'utf8', (err, data) => {
    if (err) {
        console.error('Ошибка чтения файла:', err);
        return;
    }

    try {
        const jsonData = JSON.parse(data);
        const cleanedData = processJson(jsonData);
        const stats = analyzeResults(cleanedData);

        // Сохранение результата в новый файл
        fs.writeFile('../JSON/china-complete.json', JSON.stringify(cleanedData, null, 2), 'utf8', err => {
            if (err) {
                console.error('Ошибка записи файла:', err);
                return;
            }
            console.log('Файл успешно обработан и сохранен как output3.json');
            console.log('\nСтатистика по полю ctrsname:');
            console.log('------------------------');
            console.log(`Пустые значения: ${stats.empty}`);
            console.log(`Смешанные (китайские + английские): ${stats.mixed}`);
            console.log(`Только китайские символы: ${stats.chineseOnly}`);
            console.log(`Только английские символы: ${stats.englishOnly}`);
            console.log(`Всего обработано объектов: ${cleanedData.length}`);
        });
    } catch (err) {
        console.error('Ошибка парсинга JSON или обработки данных:', err);
    }
});
