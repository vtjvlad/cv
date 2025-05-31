function prepareTitle(title) {
    // Ищем текст в обычных квадратных скобках [ ] или китайских скобках 【 】
    const match = title.match(/[\[【]([^\]】]+)[\]】]/);
    return match ? match[1].trim() : '';
}

function foundBrand(title) {
    // Список брендов с вариантами написания
    const brands = [
        { canonical: 'Hermès', variants: ['Hermès', 'Hermes', 'Hermes Paris', 'HERMES', 'HermesParis', 'HERME', 'HERMESTPR', 'HERMES HERMES', 'HER MES', 'HERME Bouncing', 'Bouncing', 'HERME Bouncing', 'Bouncing' ] },
        { canonical: 'Dolce & Gabbana', variants: ['Dolce & Gabbana', 'Dolce Gabbana', 'D&G', 'DolceGabbana','DGdg', 'DG', 'dg'] },
        { canonical: 'Louis Vuitton', variants: ['Louis Vuitton', 'LV', 'Lv', 'LVLV', 'LouisVuitton', 'lv-', 'LOUIS VUITTON', 'louis vuitton'] },
        { canonical: 'Dior', variants: ['Dior', 'Christian Dior', 'ChristianDior', 'DIOR', 'dior'] },
        { canonical: 'Prada', variants: ['Prada', 'Prada Milano', 'PradaMilan', 'PRADA', 'pRADA', 'P R A D A' ] },
        { canonical: 'Fendi', variants: ['Fendi', 'Fendi Roma', 'FendiRoma', 'FENDI', 'fendi'] },
        { canonical: 'Brunello Cucinelli', variants: ['Brunello Cucinelli', 'Cucinelli', 'BrunelloCucinelli', 'BRUNELLO CUCINELLI', 'brunello cucinelli', 'BRUNELLO CUCINELLI', 'BrunelloCucinelli', 'BC'] },
        { canonical: 'Ermenegildo Zegna', variants: ['Ermenegildo Zegna', 'Zegna', 'ErmenegildoZegna', 'EZegna', 'ZegnaZegna', 'ZEGNA', 'zegna'] },
        { canonical: 'Santoni', variants: ['Santoni', 'Santoni Shoes', 'SANTONI', 'santoni'] },
        { canonical: 'Tod’s', variants: ['Tod’s', 'Tods', 'Tod s', 'Tod', 'TODS', 'tods'] },
        { canonical: 'Bottega Veneta', variants: ['Bottega Veneta', 'Bottega', 'BottegaVeneta', 'BV', 'bottega veneta'] },
        { canonical: 'Balenciaga', variants: ['Balenciaga', 'Balenci', 'Balenciaga Paris', 'BALENCIAGA', 'balenciaga'] },
        { canonical: 'Gucci', variants: ['Gucci', 'Gucci Italy', 'GUCCI', 'gucci'] },
        { canonical: 'Versace', variants: ['Versace', 'Gianni Versace', 'Versace Italy', 'VERACE', 'versace'] },
        { canonical: 'Alexander McQueen', variants: ['Alexander McQueen', 'McQueen', 'AlexanderMcQueen'] },
        { canonical: 'Valentino', variants: ['Valentino', 'Valentino Garavani', 'ValentinoGaravani', 'VALENTINO', 'valentino'] },
        { canonical: 'Philipp Plein', variants: ['Philipp Plein', 'Plein', 'PhilippPlein', 'PP', 'P-P', 'pp', 'Pp' ] },
        { canonical: 'Amiri', variants: ['Amiri', 'Amiri LA', 'AmiriLosAngeles', 'AMIRI', 'amiri'] },
        { canonical: 'Armani', variants: ['Armani', 'Giorgio Armani', 'GiorgioArmani', 'ARMANI', 'armani'] },
        { canonical: 'Off-White', variants: ['Off-White', 'Off White', 'OffWhite', 'OFF WHITE', 'off white'] },
        { canonical: 'Boss', variants: ['Boss', 'BOSS', 'Hugo Boss', 'HugoBoss', 'BOOS', 'boss'] },
        { canonical: 'GIVENCHY', variants: ['GIVENCHY', 'Givenchy', 'Givenchy Paris', 'G I V E N C H Y'] }
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

