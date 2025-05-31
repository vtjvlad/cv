function prepareTitle(title) {
    // Ищем текст в обычных квадратных скобках [ ] или китайских скобках 【 】
    const match = title.match(/[\[【]([^\]】]+)[\]】]/);
    return match ? match[1].trim() : '';
}

function foundBrand(title) {
    // Список брендов с вариантами написания
    const brands = [
        { canonical: 'Louis Vuitton', variants: ['Louis Vuitton', 'LV', 'Lv', 'LVLV', 'LouisVuitton'] },
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
        { canonical: 'Boss', variants: ['Boss', 'BOSS', 'Hugo Boss', 'HugoBoss'] },
        { canonical: 'GIVENCHY', variants: ['GIVENCHY', 'Givenchy', 'Givenchy Paris', 'G I V E N C H Y',] }
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

