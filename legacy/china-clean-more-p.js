function convertPrice(code) {
    // Извлекаем pXXX из строки
const match =  code.match(/\bp\s*(\d{3})\w*/) || code.match(/\bpp\s*(\d{3})\w*/) || code.match(/\bp\s*(\d{3})\s*💰/);
    if (!match) {
        return null; // Если pXXX не найден, возвращаем null
    }
    
    const num = parseInt(match[1], 10); // Получаем число XXX
    
    // Пример диапазонов для преобразования
    const priceRanges = [
        { min: 102, max: 131, value: 2000 },  
        { min: 132, max: 141, value: 2000 },
        { min: 142, max: 151, value: 2100 },
        { min: 152, max: 171, value: 2200 },
        { min: 172, max: 181, value: 2200 },
        { min: 182, max: 191, value: 2500 },
        { min: 192, max: 201, value: 2600 },
        { min: 202, max: 211, value: 2700 },
        { min: 202, max: 221, value: 2800 },
        { min: 222, max: 231, value: 2800 },
        { min: 232, max: 241, value: 2900 },
        { min: 242, max: 251, value: 3000 },
        { min: 252, max: 261, value: 3000 },
        { min: 262, max: 271, value: 3200 },
        { min: 272, max: 281, value: 3500 },
        { min: 282, max: 351, value: 3800 },
        { min: 352, max: 361, value: 3500 },
        { min: 362, max: 401, value: 3800 } 
        // Добавьте свои диапазоны здесь
    ];
    
    // Ищем подходящий диапазон
    for (const range of priceRanges) {
        if (num >= range.min && num <= range.max) {
            return range.value;
        }
    }
    
    // Если число не попадает в диапазон, возвращаем null (или можно задать формулу, например, num * 10)
    return null;
}

function cleanTitle(title) {
    // Список брендов с вариантами написания
    const brands = [
        { canonical: 'Louis Vuitton', variants: ['Louis Vuitton', 'LV', 'LouisVuitton'] },
        { canonical: 'Dior', variants: ['Dior', 'Christian Dior', 'ChristianDior'] },
        { canonical: 'Prada', variants: ['Prada', 'Prada Milano', 'PradaMilan'] },
        { canonical: 'Dolce & Gabbana', variants: ['Dolce & Gabbana', 'Dolce Gabbana', 'D&G', 'DolceGabbana'] },
        { canonical: 'Fendi', variants: ['Fendi', 'Fendi Roma', 'FendiRoma'] },
        { canonical: 'Brunello Cucinelli', variants: ['Brunello Cucinelli', 'Cucinelli', 'BrunelloCucinelli'] },
        { canonical: 'Ermenegildo Zegna', variants: ['Ermenegildo Zegna', 'Zegna', 'ErmenegildoZegna', 'EZegna'] },
        { canonical: 'Santoni', variants: ['Santoni', 'Santoni Shoes'] },
        { canonical: 'Tod’s', variants: ['Tod’s', 'Tods', 'Tod s', 'Tod'] },
        { canonical: 'Bottega Veneta', variants: ['Bottega Veneta', 'Bottega', 'BottegaVeneta', 'BV'] },
        { canonical: 'Balenciaga', variants: ['Balenciaga', 'Balenci'] },
        { canonical: 'Gucci', variants: ['Gucci', 'Gucci Italy'] },
        { canonical: 'Versace', variants: ['Versace', 'Gianni Versace', 'Versace Italy'] },
        { canonical: 'Hermès', variants: ['Hermès', 'Hermes', 'Hermes Paris'] },
        { canonical: 'Alexander McQueen', variants: ['Alexander McQueen', 'McQueen', 'AlexanderMcQueen'] },
        { canonical: 'Valentino', variants: ['Valentino', 'Valentino Garavani', 'ValentinoGaravani'] },
        { canonical: 'Philipp Plein', variants: ['Philipp Plein', 'Plein', 'PhilippPlein'] },
        { canonical: 'Amiri', variants: ['Amiri', 'Amiri LA'] },
        { canonical: 'Off-White', variants: ['Off-White', 'Off White', 'OffWhite'] },
        { canonical: 'Boss', variants: ['Boss', 'Hugo Boss', 'HugoBoss'] }
    ];
    
    // Приводим заголовок к нижнему регистру для поиска
    const lowerTitle = title.toLowerCase();
    
    // Ищем бренд
    for (const brand of brands) {
        for (const variant of brand.variants) {
            if (lowerTitle.includes(variant.toLowerCase())) {
                return brand.canonical; // Возвращаем каноническое написание бренда
            }
        }
    }
    
    // Если бренд не найден, очищаем строку: оставляем латинские буквы, цифры, пробелы, дефис и апостроф
    return title.replace(/[^\w\s-'’]/g, '').trim().replace(/\s+/g, ' ');
}

function processJson(jsonData) {
    // Проверяем, является ли jsonData массивом
    if (!Array.isArray(jsonData)) {
        throw new Error('Входные данные должны быть массивом объектов');
    }

    return jsonData.map(item => {
        // Проверяем наличие поля title
        if (!item.title) {
            console.warn('Пропущено поле title в объекте:', item);
            return item;
        }
        
        // Извлекаем цену
        const price = convertPrice(item.title);
        
        return {
            ...item, // Сохраняем все поля объекта, включая imgsSrc
            title: cleanTitle(item.title), // Обрабатываем title
            prc: price // Добавляем новый ключ prc
        };
    });
}

// Чтение и запись файла
const fs = require('fs');


fs.readFile('output.json', 'utf8', (err, data) => {
    // fs.readFile('./china_extracted.json', 'utf8', (err, data) => {
    if (err) {
        console.error('Ошибка чтения файла:', err);
        return;
    }

    try {
        const jsonData = JSON.parse(data);
        const cleanedData = processJson(jsonData);

        // Сохранение результата
        fs.writeFile('input.json', JSON.stringify(cleanedData, null, 2), 'utf8', err => {
            if (err) {
                console.error('Ошибка записи файла:', err);
                return;
            }
            console.log('Файл успешно обработан и сохранен как output.json');
        });
    } catch (err) {
        console.error('Ошибка парсинга JSON или обработки данных:', err);
    }
});
