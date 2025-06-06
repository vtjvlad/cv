function prepareTitle(title) {
    // Ищем текст в обычных квадратных скобках [ ] или китайских скобках 【 】 или《 》 или 「 」
    const match = title.match(/[\[【《「]([^\]】》」]+)[\]】》」]/); 
    return match ? match[1].trim() : '';
}

function foundBrand(title) {
    // Список брендов с вариантами написания
    const brands = [
        { canonical:
            'Christian Louboutin', variants:
            ['Christian Louboutin', ] },
        { canonical:
            'Brunello Cucinelli', variants:
            ['Brunello Cucinelli'] },
        { canonical:
            'Ermenegildo Zegna', variants:
            ['Ermenegildo Zegna'] },
        { canonical:
            'Alexander McQueen', variants:
            ['Alexander McQueen'] },
        { canonical:
            'Giuseppe Zanotti', variants:
            ['Giuseppe Zanotti'] },
        { canonical:
            'Village Garavani', variants:
            ['Village Garavani'] },
        { canonical:
            'Dolce & Gabbana', variants:
            ['Dolce & Gabbana'] },
        { canonical:
            'Common Projects', variants:
            ['Common Projects'] },
        { canonical:
            'Bottega Veneta', variants:
            ['Bottega Veneta'] },
        { canonical:
            'Karl Lagerfeld', variants:
            ['Karl Lagerfeld'] },
        { canonical:
            'Philipp Plein', variants:
            ['Philipp Plein'] },
        { canonical:
            'Louis Vuitton', variants:
            ['Louis Vuitton', 'LV路易威登', 'LOUIS VUITTON', '路易威登', 'LV路', '路易威登LV', '登LV', 'Lv～' ] },
        { canonical:
            'Stefano Ricci', variants:
            ['Stefano Ricci'] },
        { canonical:
            'Trillionaire', variants:
            ['Trillionaire'] },
        { canonical:
            'Thom Browne', variants:
            ['Thom Browne'] },
        { canonical:
            'Balenciaga', variants:
            ['Balenciaga'] },
        { canonical:
            'Loro Piana', variants:
            ['Loro Piana'] },
        { canonical:
            'Balenciaga', variants:
            ['Balenciaga'] },
        { canonical:
            'Rick Owens', variants:
            ['Rick Owens'] },
        { canonical:
            'Valentino', variants:
            ['Valentino'] },
        { canonical:
            'Off-White', variants:
            ['Off-White'] },
        { canonical:
            'Valentino', variants:
            ['Valentino'] },
        { canonical:
            'Dsquared2',variants:
            ['Dsquared2'] },
        { canonical:
            'Ferragamo',variants:
            ['Ferragamo'] },
        { canonical:
            'Burberry', variants:
            ['Burberry'] },
        { canonical:
            'Givenchy', variants:
            ['Givenchy', 'GIVENCHY', 'G I V E N C H Y', ] },
        { canonical:
            'Tom Ford',variants:
            ['Tom Ford'] },
        { canonical:
            'Premiata', variants:
            ['Premiata'] },
        { canonical:
            'Versace', variants:
            ['Versace'] },
        { canonical:
            'Moncler', variants:
            ['Moncler'] },
        { canonical:
            'Balmain', variants:
            ['Balmain'] },
        { canonical:
            'Olympia', variants:
            ['Olympia'] },
        { canonical:
            'Santoni', variants:
            ['Santoni'] },
        { canonical:
            'Armani', variants:
            ['Armani'] },
        { canonical:
            'MIUMIU', variants:
            ['MIUMIU'] },
        { canonical:
            'Chanel', variants:
            ['Chanel'] },
        { canonical:
            'COACH', variants:
            ['COACH'] },
        { canonical:
            'Amiri', variants:
            ['Amiri'] },
        { canonical:
            'Gucci', variants:
            ['Gucci'] },
        { canonical:
            'Boss', variants:
            ['Boss'] },
        { canonical:
            'Dior', variants:
            ['Dior'] },
        { canonical:
            'Kenzo', variants:
            ['Kenzo'] },
        { canonical:
            'Bally', variants:
            ['Bally'] },
        { canonical:
            'Nike', variants:
            ['Nike'] },
        { canonical:
            'Hogan', variants:
            ['HOGAN'] },
        { canonical:
            'Fendi', variants:
            ['Fendi'] },
        { canonical:
            'Tod’s', variants:
            ['Tod’s'] },
        { canonical:
            'Hermes', variants:
            ['Hermes'] },
        { canonical:
            'Berluti', variants:
            ['Berluti'] },
        { canonical:
            'Lacoste', variants:
            ['Lacoste'] },
        { canonical:
            'Converse', variants:
            ['Converse'] },
        { canonical:
            'Prada', variants:
            ['Prada'] },
        { canonical:
            'Zara', variants:
            ['Zara'] },
        { canonical:
            'Y-3', variants:
        ['Y-3'] },
    ];
    // { canonical: 'D&G',variants: ['D&G', 'Dolce & Gabbana', 'Dolce Gabbana', 'DGdg', 'DG', 'dg',     'G', 'G logo',]},
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
    // если бренд не найден, подставляем результат prepareTitle
    return prepareTitle(title);
}
module.exports = {
    foundBrand,
    prepareTitle
};

