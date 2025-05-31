function cleanTitle(title) {
    // Список брендов с альтернативными написаниями и сокращениями


    const brands = [
        'Louis Vuitton', 'Armani', 'Dior', 'Prada', 'Dolce & Gabbana', 'Fendi', 'Berlut',
        'Brunello Cucinelli', 'Ermenegildo Zegna', 'Zegna', 'Santoni', 
        'Tod’s', 'Bottega Veneta', 'Balenciaga', 'Gucci', 'Versace', 
        'Hermès', 'Alexander McQueen', 'Valentino', 'Philipp Plein', 'BV',
        'Amiri', 'Off-White', 'Boss', 'BOOS', 'P-P', 'PP', 'Lv','LV', 'Salvatore Ferragamo', 'Ferragamo', 'LVLV',
        'VERACE', 'PHILIPP PIEIN', 'Brunello Cucinell', 'HK', 'G logo', 'HERMES', 'DGdg', 'D&G',
        'HERMES HERMES', 'CHANEL', 'Ferraga', 'HER MES', 'G I V E N C H Y', 'GIVENCHY', 'GIVENCHY PARFUMS',
        'HERME', 'HERMESTPR', 'DG', 'Burberry', 'HERME Bouncing', 'BURBERRY'
    ];
        

    // const brands = [
    //     { canonical: 'Burberry', variants: ['Burberry', 'Burberry London', 'Burberry London', 'BURBERRY', 'burberry', 'BURB*', 'Burb*', 'Burrberr*'] },
    //     { canonical: 'Dior', variants: ['Dior', 'Christian Dior', 'ChristianDior', 'DIOR', 'dior', 'dio', 'Dio'] },
    //     { canonical: 'Hermes', variants: ['Hermes', 'Hermès', 'Hermes Paris', 'HERMES', 'HermesParis', 'HERME', 'HERMESTPR', 'HERMES HERMES', 'HER MES', 'HERME Bouncing', 'Bouncing', 'HERME Bouncing', 'Bouncing' ] },
    //     { canonical: 'Dolce & Gabbana', variants: ['Dolce & Gabbana', 'Dolce Gabbana', 'D&G', 'DolceGabbana','DGdg', 'DG', 'dg', 'DG*', 'DG*', 'G', 'G logo',] },
    //     { canonical: 'D&G',variants: ['D&G', 'Dolce & Gabbana', 'Dolce Gabbana', 'DGdg', 'DG', 'dg', 'DG*', 'DG*', 'G', 'G logo',]},
    //     { canonical: 'Louis Vuitton', variants: ['Louis Vuitton', 'LV', 'Lv', 'LVLV', 'LouisVuitton', 'lv-', 'LOUIS VUITTON', 'louis vuitton', '*OUIS *UITTO*'] },
    //     { canonical: 'Prada', variants: ['Prada', 'Prada Milano', 'PradaMilan', 'PRADA', 'pRADA', 'P R A D A' ] },
    //     { canonical: 'Fendi', variants: ['Fendi', 'Fendi Roma', 'FendiRoma', 'FENDI', 'fendi', 'Fendi*', 'Fendi*', 'FD'] },
    //     { canonical: 'Brunello Cucinelli', variants: ['Brunello Cucinelli', 'Cucinelli', 'BrunelloCucinelli', 'BRUNELLO CUCINELLI', 'brunello cucinelli', 'BRUNELLO CUCINELLI', 'BrunelloCucinelli', 'BC'] },
    //     { canonical: 'Ermenegildo Zegna', variants: ['Ermenegildo Zegna', 'Zegna', 'ErmenegildoZegna', 'EZegna', 'ZegnaZegna', 'ZEGNA', 'zegna'] },
    //     { canonical: 'Santoni', variants: ['Santoni', 'Santoni Shoes', 'SANTONI', 'santoni'] },
    //     { canonical: 'Tod’s', variants: ['Tod’s', 'Tods', 'Tod s', 'Tod', 'TODS', 'tods'] },
    //     { canonical: 'Bottega Veneta', variants: ['Bottega Veneta', 'Bottega', 'BottegaVeneta', 'BV', 'bottega veneta', 'BOTTEGA VENETA'] },
    //     { canonical: 'Balenciaga', variants: ['Balenciaga', 'Balenci', 'Balenciaga Paris', 'BALENCIAGA', 'balenciaga', 'BALENCICGA'] },
    //     { canonical: 'Gucci', variants: ['Gucci', 'Gucci Italy', 'GUCCI', 'gucci', 'GUCC*', 'Gucc*'] },
    //     { canonical: 'Versace', variants: ['Versace', 'Gianni Versace', 'Versace Italy', 'VERACE', 'versace', 'VERACE*'] },
    //     { canonical: 'Alexander McQueen', variants: ['Alexander McQueen', 'McQueen', 'AlexanderMcQueen'] },
    //     { canonical: 'Valentino', variants: ['Valentino', 'Valentino Garavani', 'ValentinoGaravani', 'VALENTINO', 'valentino', 'VALENTIN*', 'Valentin*'] },
    //     { canonical: 'Philipp Plein', variants: ['Philipp Plein', 'Plein', 'PhilippPlein', 'PP', 'P-P', 'pp', 'Pp', 'pHILIpp pLEIN' ] },
    //     { canonical: 'Amiri', variants: ['Amiri', 'Amiri LA', 'AmiriLosAngeles', 'AMIRI', 'amiri', 'AMIR*', 'Amir*'] },
    //     { canonical: 'Armani', variants: ['Armani', 'Giorgio Armani', 'GiorgioArmani', 'ARMANI', 'armani', 'Emporio Armani', 'EMPORIO ARMANI', 'Emporio ar'] },
    //     { canonical: 'Off-White', variants: ['Off-White', 'Off White', 'OffWhite', 'OFF WHITE', 'off white'] },
    //     { canonical: 'Boss', variants: ['Boss', 'BOSS', 'Hugo Boss', 'HugoBoss', 'BOOS', 'boss', 'BOSS*', 'Boss*', 'BO', 'bo'] },
    //     { canonical: 'Givenchy', variants: ['Givenchy', 'GIVENCHY', 'Givenchy Paris', 'G I V E N C H Y', 'GIVENCHY', 'givenchy'] },
    //     { canonical: 'Ferragamo',variants: ['Ferragamo', 'Salvatore Ferragamo', 'Ferraga',]},
    //     { canonical: 'Dsquared2',variants: ['Dsquared2', 'Dsquared', 'Dsquared2', 'DSQUARED2', 'dsquared2', 'DSQUARED*', 'D2']},
    //     { canonical: 'Tom Ford',variants: ['Tom Ford', 'TOM FORD', 'Tom Ford', 'tom ford', 'TOMF ORD',]},
    //     { canonical: 'Chanel', variants: ['Chanel', 'CHANEL', 'Chanel Paris', 'Chanel', 'chanel', 'CHANEL*', 'Chanel*']},
    //     { canonical: 'Moncler', variants: ['Moncler', 'MONCLER', 'Moncler', 'moncler', 'MONCLER*', 'Moncler*']},
    //     { canonical: 'Kenzo', variants: ['Kenzo', 'KENZO', 'Kenzo Paris', 'KENZO', 'kenzo', 'KENZO*', 'Kenzo*']},
    //     { canonical: 'Loro Piana', variants: ['Loro Piana', 'LORO PIANA', 'LoroPiana', 'LORO PIANA*', 'LoroPiana*', 'LORO', 'loro']},
    //     { canonical: 'Trillionaire', variants: ['Trillionaire', 'TRILLIONAIRE', 'Trillionaire', 'trillionaire', 'TRILLION*', 'Trillion*', '3illionaire', '3illion*']},
    //     { canonical: 'Bally', variants: ['Bally', 'BALLY', 'Bally', 'bally', 'BALLY*', 'Bally*']},
    //     { canonical: 'Nike', variants: ['Nike', 'NIKE', 'Nike', 'nike', 'NIKE*', 'Nike*', 'Nike Dunk Low', 'Nike Dunk', 'Nike Dunk SB', 'Nike SB', 'Nike SB Dunk', 'Nike SB Dunk Low', 'Nike SB Dunk High', 'Nike SB Dunk Pro', 'Nike SB Dunk Pro Low', 'Nike SB Dunk Pro High']}

    // ];
    
    // Приводим заголовок к нижнему регистру для упрощения поиска
    const lowerTitle = title.toLowerCase();
    
    // Ищем первый подходящий бренд
    for (const brand of brands) {
        if (lowerTitle.includes(brand.toLowerCase())) {
            return brand; // Возвращаем бренд в оригинальном регистре
        }
    }
    
    // Если бренд не найден, возвращаем очищенную строку (только латинские буквы)
    return title.replace(/[^\w\s]/g, '').trim().replace(/\s+/g, ' ');
}

function countUniqueTitles(items) {
    const titleCount = {};
    items.forEach(item => {
        if (item.title) {
            titleCount[item.title] = (titleCount[item.title] || 0) + 1;
        }
    });
    return titleCount;
}

function processJson(jsonData) {
    // Проверяем, является ли jsonData массивом
    if (!Array.isArray(jsonData)) {
        throw new Error('Входные данные должны быть массивом объектов');
    }

    const processedItems = jsonData.map(item => {
        // Проверяем наличие поля title
        if (!item.title) {
            console.warn('Пропущено поле title в объекте:', item);
            return item;
        }
        return {
            ...item, // Сохраняем все поля объекта, включая imgsSrc
            title: cleanTitle(item.title) // Обрабатываем только title
        };
    });

    // Статистика
    console.log('=== Статистика обработки ===');
    console.log(`Общее количество объектов: ${processedItems.length}`);

    // Подсчет уникальных тайтлов
    const titleCount = countUniqueTitles(processedItems);
    const brandTitles = {};
    const brands = ['Louis Vuitton', 'Armani', 'Dior', 'Prada', 'Dolce & Gabbana', 'Fendi', 'Berlut',
        'Brunello Cucinelli', 'Ermenegildo Zegna', 'Zegna', 'Santoni', 
        'Tod’s', 'Bottega Veneta', 'Balenciaga', 'Gucci', 'Versace', 
        'Hermès', 'Alexander McQueen', 'Valentino', 'Philipp Plein', 'BV',
        'Amiri', 'Off-White', 'Boss', 'BOOS', 'P-P', 'PP', 'Lv','LV', 'Salvatore Ferragamo', 'Ferragamo', 'LVLV',
        'VERACE', 'PHILIPP PIEIN', 'Brunello Cucinell', 'HK', 'G logo', 'HERMES', 'DGdg', 'D&G',
        'HERMES HERMES', 'CHANEL', 'Ferraga', 'HER MES', 'G I V E N C H Y', 'GIVENCHY', 'GIVENCHY PARFUMS',
        'HERME', 'HERMESTPR', 'DG', 'Burberry', 'HERME Bouncing', 'BURBERRY'];


        // const brands = [
        //     { canonical: 'Burberry', variants: ['Burberry', 'Burberry London', 'Burberry London', 'BURBERRY', 'burberry', 'BURB*', 'Burb*', 'Burrberr*'] },
        //     { canonical: 'Dior', variants: ['Dior', 'Christian Dior', 'ChristianDior', 'DIOR', 'dior', 'dio', 'Dio'] },
        //     { canonical: 'Hermes', variants: ['Hermes', 'Hermès', 'Hermes Paris', 'HERMES', 'HermesParis', 'HERME', 'HERMESTPR', 'HERMES HERMES', 'HER MES', 'HERME Bouncing', 'Bouncing', 'HERME Bouncing', 'Bouncing' ] },
        //     { canonical: 'Dolce & Gabbana', variants: ['Dolce & Gabbana', 'Dolce Gabbana', 'D&G', 'DolceGabbana','DGdg', 'DG', 'dg', 'DG*', 'DG*', 'G', 'G logo',] },
        //     { canonical: 'D&G',variants: ['D&G', 'Dolce & Gabbana', 'Dolce Gabbana', 'DGdg', 'DG', 'dg', 'DG*', 'DG*', 'G', 'G logo',]},
        //     { canonical: 'Louis Vuitton', variants: ['Louis Vuitton', 'LV', 'Lv', 'LVLV', 'LouisVuitton', 'lv-', 'LOUIS VUITTON', 'louis vuitton', '*OUIS *UITTO*'] },
        //     { canonical: 'Prada', variants: ['Prada', 'Prada Milano', 'PradaMilan', 'PRADA', 'pRADA', 'P R A D A' ] },
        //     { canonical: 'Fendi', variants: ['Fendi', 'Fendi Roma', 'FendiRoma', 'FENDI', 'fendi', 'Fendi*', 'Fendi*', 'FD'] },
        //     { canonical: 'Brunello Cucinelli', variants: ['Brunello Cucinelli', 'Cucinelli', 'BrunelloCucinelli', 'BRUNELLO CUCINELLI', 'brunello cucinelli', 'BRUNELLO CUCINELLI', 'BrunelloCucinelli', 'BC'] },
        //     { canonical: 'Ermenegildo Zegna', variants: ['Ermenegildo Zegna', 'Zegna', 'ErmenegildoZegna', 'EZegna', 'ZegnaZegna', 'ZEGNA', 'zegna'] },
        //     { canonical: 'Santoni', variants: ['Santoni', 'Santoni Shoes', 'SANTONI', 'santoni'] },
        //     { canonical: 'Tod’s', variants: ['Tod’s', 'Tods', 'Tod s', 'Tod', 'TODS', 'tods'] },
        //     { canonical: 'Bottega Veneta', variants: ['Bottega Veneta', 'Bottega', 'BottegaVeneta', 'BV', 'bottega veneta', 'BOTTEGA VENETA'] },
        //     { canonical: 'Balenciaga', variants: ['Balenciaga', 'Balenci', 'Balenciaga Paris', 'BALENCIAGA', 'balenciaga', 'BALENCICGA'] },
        //     { canonical: 'Gucci', variants: ['Gucci', 'Gucci Italy', 'GUCCI', 'gucci', 'GUCC*', 'Gucc*'] },
        //     { canonical: 'Versace', variants: ['Versace', 'Gianni Versace', 'Versace Italy', 'VERACE', 'versace', 'VERACE*'] },
        //     { canonical: 'Alexander McQueen', variants: ['Alexander McQueen', 'McQueen', 'AlexanderMcQueen'] },
        //     { canonical: 'Valentino', variants: ['Valentino', 'Valentino Garavani', 'ValentinoGaravani', 'VALENTINO', 'valentino', 'VALENTIN*', 'Valentin*'] },
        //     { canonical: 'Philipp Plein', variants: ['Philipp Plein', 'Plein', 'PhilippPlein', 'PP', 'P-P', 'pp', 'Pp', 'pHILIpp pLEIN' ] },
        //     { canonical: 'Amiri', variants: ['Amiri', 'Amiri LA', 'AmiriLosAngeles', 'AMIRI', 'amiri', 'AMIR*', 'Amir*'] },
        //     { canonical: 'Armani', variants: ['Armani', 'Giorgio Armani', 'GiorgioArmani', 'ARMANI', 'armani', 'Emporio Armani', 'EMPORIO ARMANI', 'Emporio ar'] },
        //     { canonical: 'Off-White', variants: ['Off-White', 'Off White', 'OffWhite', 'OFF WHITE', 'off white'] },
        //     { canonical: 'Boss', variants: ['Boss', 'BOSS', 'Hugo Boss', 'HugoBoss', 'BOOS', 'boss', 'BOSS*', 'Boss*', 'BO', 'bo'] },
        //     { canonical: 'Givenchy', variants: ['Givenchy', 'GIVENCHY', 'Givenchy Paris', 'G I V E N C H Y', 'GIVENCHY', 'givenchy'] },
        //     { canonical: 'Ferragamo',variants: ['Ferragamo', 'Salvatore Ferragamo', 'Ferraga',]},
        //     { canonical: 'Dsquared2',variants: ['Dsquared2', 'Dsquared', 'Dsquared2', 'DSQUARED2', 'dsquared2', 'DSQUARED*', 'D2']},
        //     { canonical: 'Tom Ford',variants: ['Tom Ford', 'TOM FORD', 'Tom Ford', 'tom ford', 'TOMF ORD',]},
        //     { canonical: 'Chanel', variants: ['Chanel', 'CHANEL', 'Chanel Paris', 'Chanel', 'chanel', 'CHANEL*', 'Chanel*']},
        //     { canonical: 'Moncler', variants: ['Moncler', 'MONCLER', 'Moncler', 'moncler', 'MONCLER*', 'Moncler*']},
        //     { canonical: 'Kenzo', variants: ['Kenzo', 'KENZO', 'Kenzo Paris', 'KENZO', 'kenzo', 'KENZO*', 'Kenzo*']},
        //     { canonical: 'Loro Piana', variants: ['Loro Piana', 'LORO PIANA', 'LoroPiana', 'LORO PIANA*', 'LoroPiana*', 'LORO', 'loro']},
        //     { canonical: 'Trillionaire', variants: ['Trillionaire', 'TRILLIONAIRE', 'Trillionaire', 'trillionaire', 'TRILLION*', 'Trillion*', '3illionaire', '3illion*']},
        //     { canonical: 'Bally', variants: ['Bally', 'BALLY', 'Bally', 'bally', 'BALLY*', 'Bally*']},
        //     { canonical: 'Nike', variants: ['Nike', 'NIKE', 'Nike', 'nike', 'NIKE*', 'Nike*', 'Nike Dunk Low', 'Nike Dunk', 'Nike Dunk SB', 'Nike SB', 'Nike SB Dunk', 'Nike SB Dunk Low', 'Nike SB Dunk High', 'Nike SB Dunk Pro', 'Nike SB Dunk Pro Low', 'Nike SB Dunk Pro High']}
    
        // ];

    // Считаем только тайтлы, которые содержат известные бренды
    let unnamedCount = 0;
    for (const [title, count] of Object.entries(titleCount)) {
        const isBrandTitle = brands.some(brand => title.toLowerCase().includes(brand.toLowerCase()));
        if (isBrandTitle) {
            brandTitles[title] = count;
        } else {
            unnamedCount++;
        }
    }

    console.log('\nУникальные тайтлы с брендами:');
    for (const [title, count] of Object.entries(brandTitles)) {
        console.log(`${title} (${count})`);
    }

    console.log(`\nКоличество "не названных" объектов: ${unnamedCount}`);

    return processedItems;
}

// Чтение и запись файла
const fs = require('fs');

fs.readFile('../JSON/china_extracted.json', 'utf8', (err, data) => {
    if (err) {
        console.error('Ошибка чтения файла:', err);
        return;
    }

    try {
        const jsonData = JSON.parse(data);
        const cleanedData = processJson(jsonData);

        // Сохранение результата
        fs.writeFile('china-223.json', JSON.stringify(cleanedData, null, 2), 'utf8', err => {
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
