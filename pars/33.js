const { convertPrice } = require('../user_modules/convPrice');


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
            // Добавляем другие необходимые поля, если нужно				
        };
    });
}


// Пример использования
const fs = require('fs');

fs.readFile('../JSON/prePrice.json', 'utf8', (err, data) => {
    if (err) {
        console.error('Ошибка чтения файла:', err);
        return;
    }

    try {
        const jsonData = JSON.parse(data);
        const cleanedData = processJson(jsonData);

        // Сохранение результата в новый файл
        fs.writeFile('../JSON/pear.json', JSON.stringify(cleanedData, null, 2), 'utf8', err => {
            if (err) {
                console.error('Ошибка записи файла:', err);
                return;
            }
        });
    } catch (err) {
        console.error('Ошибка парсинга JSON или обработки данных:', err);
    }
});
