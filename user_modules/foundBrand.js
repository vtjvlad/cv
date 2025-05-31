function prepareTitle(title) {
    // Ищем текст в обычных квадратных скобках [ ] или китайских скобках 【 】
    const match = title.match(/[\[【]([^\]】]+)[\]】]/);
    return match ? match[1].trim() : '';
}

function foundBrand(title) {
    // Список брендов с вариантами написания
    const brands = [
        { canonical: 'Burberry', variants: ['Burberry', 'Burberry London', 'Burberry London', 'BURBERRY', 'burberry', 'BURB*', 'Burb*', 'Burrberr*'] },
        { canonical: 'Dior', variants: ['Dior', 'Christian Dior', 'ChristianDior', 'DIOR', 'dior', 'dio', 'Dio'] },
        { canonical: 'Hermes', variants: ['Hermes', 'Hermès', 'Hermes Paris', 'HERMES', 'HermesParis', 'HERME', 'HERMESTPR', 'HERMES HERMES', 'HER MES', 'HERME Bouncing', 'Bouncing', 'HERME Bouncing', 'Bouncing' ] },
        { canonical: 'Dolce & Gabbana', variants: ['Dolce & Gabbana', 'Dolce Gabbana', 'D&G', 'DolceGabbana','DGdg', 'DG', 'dg', 'DG*', 'DG*', 'G', 'G logo',] },
        { canonical: 'D&G',variants: ['D&G', 'Dolce & Gabbana', 'Dolce Gabbana', 'DGdg', 'DG', 'dg', 'DG*', 'DG*', 'G', 'G logo',]},
        { canonical: 'Louis Vuitton', variants: ['Louis Vuitton', 'LV', 'Lv', 'LVLV', 'LouisVuitton', 'lv-', 'LOUIS VUITTON', 'louis vuitton', '*OUIS *UITTO*'] },
        { canonical: 'Prada', variants: ['Prada', 'Prada Milano', 'PradaMilan', 'PRADA', 'pRADA', 'P R A D A' ] },
        { canonical: 'Fendi', variants: ['Fendi', 'Fendi Roma', 'FendiRoma', 'FENDI', 'fendi', 'Fendi*', 'Fendi*', 'FD'] },
        { canonical: 'Brunello Cucinelli', variants: ['Brunello Cucinelli', 'Cucinelli', 'BrunelloCucinelli', 'BRUNELLO CUCINELLI', 'brunello cucinelli', 'BRUNELLO CUCINELLI', 'BrunelloCucinelli', 'BC'] },
        { canonical: 'Ermenegildo Zegna', variants: ['Ermenegildo Zegna', 'Zegna', 'ErmenegildoZegna', 'EZegna', 'ZegnaZegna', 'ZEGNA', 'zegna'] },
        { canonical: 'Santoni', variants: ['Santoni', 'Santoni Shoes', 'SANTONI', 'santoni'] },
        { canonical: 'Tod’s', variants: ['Tod’s', 'Tods', 'Tod s', 'Tod', 'TODS', 'tods'] },
        { canonical: 'Bottega Veneta', variants: ['Bottega Veneta', 'Bottega', 'BottegaVeneta', 'BV', 'bottega veneta', 'BOTTEGA VENETA'] },
        { canonical: 'Balenciaga', variants: ['Balenciaga', 'Balenci', 'Balenciaga Paris', 'BALENCIAGA', 'balenciaga', 'BALENCICGA'] },
        { canonical: 'Gucci', variants: ['Gucci', 'Gucci Italy', 'GUCCI', 'gucci', 'GUCC*', 'Gucc*'] },
        { canonical: 'Versace', variants: ['Versace', 'Gianni Versace', 'Versace Italy', 'VERACE', 'versace', 'VERACE*'] },
        { canonical: 'Alexander McQueen', variants: ['Alexander McQueen', 'McQueen', 'AlexanderMcQueen'] },
        { canonical: 'Valentino', variants: ['Valentino', 'Valentino Garavani', 'ValentinoGaravani', 'VALENTINO', 'valentino', 'VALENTIN*', 'Valentin*'] },
        { canonical: 'Philipp Plein', variants: ['Philipp Plein', 'Plein', 'PhilippPlein', 'PP', 'P-P', 'pp', 'Pp', 'pHILIpp pLEIN' ] },
        { canonical: 'Amiri', variants: ['Amiri', 'Amiri LA', 'AmiriLosAngeles', 'AMIRI', 'amiri', 'AMIR*', 'Amir*'] },
        { canonical: 'Armani', variants: ['Armani', 'Giorgio Armani', 'GiorgioArmani', 'ARMANI', 'armani', 'Emporio Armani', 'EMPORIO ARMANI', 'Emporio ar'] },
        { canonical: 'Off-White', variants: ['Off-White', 'Off White', 'OffWhite', 'OFF WHITE', 'off white'] },
        { canonical: 'Boss', variants: ['Boss', 'BOSS', 'Hugo Boss', 'HugoBoss', 'BOOS', 'boss', 'BOSS*', 'Boss*', 'BO', 'bo'] },
        { canonical: 'Givenchy', variants: ['Givenchy', 'GIVENCHY', 'Givenchy Paris', 'G I V E N C H Y', 'GIVENCHY', 'givenchy'] },
        { canonical: 'Ferragamo',variants: ['Ferragamo', 'Salvatore Ferragamo', 'Ferraga',]},
        { canonical: 'Dsquared2',variants: ['Dsquared2', 'Dsquared', 'Dsquared2', 'DSQUARED2', 'dsquared2', 'DSQUARED*', 'D2']},
        { canonical: 'Tom Ford',variants: ['Tom Ford', 'TOM FORD', 'Tom Ford', 'tom ford', 'TOMF ORD',]},
        { canonical: 'Chanel', variants: ['Chanel', 'CHANEL', 'Chanel Paris', 'Chanel', 'chanel', 'CHANEL*', 'Chanel*']},
        { canonical: 'Moncler', variants: ['Moncler', 'MONCLER', 'Moncler', 'moncler', 'MONCLER*', 'Moncler*']},
        { canonical: 'Kenzo', variants: ['Kenzo', 'KENZO', 'Kenzo Paris', 'KENZO', 'kenzo', 'KENZO*', 'Kenzo*']},
        { canonical: 'Loro Piana', variants: ['Loro Piana', 'LORO PIANA', 'LoroPiana', 'LORO PIANA*', 'LoroPiana*', 'LORO', 'loro']},
        { canonical: 'Trillionaire', variants: ['Trillionaire', 'TRILLIONAIRE', 'Trillionaire', 'trillionaire', 'TRILLION*', 'Trillion*', '3illionaire', '3illion*']},
        { canonical: 'Bally', variants: ['Bally', 'BALLY', 'Bally', 'bally', 'BALLY*', 'Bally*']},
        { canonical: 'Nike', variants: ['Nike', 'NIKE', 'Nike', 'nike', 'NIKE*', 'Nike*', 'Nike Dunk Low', 'Nike Dunk', 'Nike Dunk SB', 'Nike SB', 'Nike SB Dunk', 'Nike SB Dunk Low', 'Nike SB Dunk High', 'Nike SB Dunk Pro', 'Nike SB Dunk Pro Low', 'Nike SB Dunk Pro High']}

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
module.exports = {
    foundBrand,
    prepareTitle
};

