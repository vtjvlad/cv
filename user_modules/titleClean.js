function cleanTitle(title) {
    // Удаляем китайские символы (Unicode: \u4E00-\u9FFF), эмодзи (Unicode: \uD800-\uDFFF) и другие ненужные символы
    // Сохраняем латинские буквы, цифры, пробелы, дефис и апостроф
    return title.replace(/[^\w\s-'’]/g, '').trim();
}

module.exports = {
    cleanTitle,
};
