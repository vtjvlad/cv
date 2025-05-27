const { convertPrice } = require('../user_modules/convPrice');   
// const { prepareTitle } = require('./user_modules/foundBrand');
// const { addSequentialNumbers } = require('./legacy/user_modules/numering');    


function processJson(jsonData) {
    // Проверяем, является ли jsonData массивом
    if (!Array.isArray(jsonData)) {
        throw new Error('Входные данные должны быть массивом объектов');
    }

    return jsonData.map(item => {
        // Проверяем наличие необходимых полей
        if (!item.title || !item.imgSrc) {
            console.warn('Пропущено поле title или imgsSrc в объекте:', item);
            return item; // Возвращаем объект без изменений, если поля отсутствуют
        }
        return {
            ...item,
         price: convertPrice(item.title),
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

// Пример использования
const fs = require('fs');

fs.readFile('./JSON/prePrice.json', 'utf8', (err, data) => {
    if (err) {
        console.error('Ошибка чтения файла:', err);
        return;
    }

    try {
        const jsonData = JSON.parse(data);
        const cleanedData = processJson(jsonData);
        const stats = analyzeResults(cleanedData);

        // Сохранение результата в новый файл
        fs.writeFile('./JSON/china-almost.json', JSON.stringify(cleanedData, null, 2), 'utf8', err => {
            if (err) {
                console.error('Ошибка записи файла:', err);
                return;
            }
           
    
        });
    } catch (err) {
        console.error('Ошибка парсинга JSON или обработки данных:', err);
    }
});
