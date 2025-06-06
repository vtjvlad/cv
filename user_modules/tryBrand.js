function prepareTitle(title) {
    // Ищем текст в обычных квадратных скобках [ ] или китайских скобках 【 】
    const match = title.match(/[\[【]([^\]】]+)[\]】]/);
    return match ? match[1].trim() : '';
}

function foundBrand(title) {
    // Список брендов с вариантами написания
    const brands = [
        'Louis Vuitton', 'Armani', 'Dior', 'Prada', 'Dolce & Gabbana', 'Fendi', 'Berlut',
        'Brunello Cucinelli', 'Ermenegildo Zegna', 'Zegna', 'Santoni', 
        'Tod`s', 'Bottega Veneta', 'Balenciaga', 'Gucci', 'Versace', 
        'Hermès', 'Alexander McQueen', 'Valentino', 'Philipp Plein', 'BV',
        'Amiri', 'Off-White', 'Boss', 'BOOS', 'P-P', 'PP', 'Lv','LV', 'Salvatore Ferragamo', 'Ferragamo', 'LVLV',
        'VERACE', 'PHILIPP PIEIN', 'Brunello Cucinell', 'HK', 'G logo', 'HERMES', 'DGdg', 'D&G',
        'HERMES HERMES', 'CHANEL', 'Ferraga', 'HER MES', 'G I V E N C H Y', 'GIVENCHY', 'GIVENCHY PARFUMS',
        'HERME', 'HERMESTPR', 'DG', 'Burberry', 'HERME Bouncing', 'BURBERRY'
    ];



    
    // Приводим заголовок к нижнему регистру для поиска
    const lowerTitle = title.toLowerCase();
  
    for (const brand of brands) {
        if (lowerTitle.includes(brand.toLowerCase())) {
            return brand; // Возвращаем каноническое написание бренда
        }
    }
    
    // Если бренд не найден, очищаем строку: оставляем латинские буквы, цифры, пробелы, дефис и апостроф
    return title.replace(/[^\w\s-'']/g, '').trim().replace(/\s+/g, ' ');
}

function addDashesToWords2(text) {
    // Находим все английские слова длиннее 3 символов
    return text.replace(/\b[a-zA-Z]{3,}\b/g, match => `🫸 ${match} 🫷`);
}
function addDashesToWords(text) {
    // Находим все английские слова длиннее 3 символов кроме logo и size
    // // Добавляем тире до и после каждого слова
    const excluded = ['Logo', 'logo', 'Size', 'size'];
    return text.replace(/\b[a-zA-Z]{3,}\b/g, match => { 
     return excluded.includes(match) ? match : `--- ${match} ---`;
    });
}

module.exports = {
    foundBrand,
    prepareTitle, 
    addDashesToWords,
    addDashesToWords2
};

