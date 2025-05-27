function wrapPriceCode(title) {
    // Ищем конструкцию вида: p(опционально) + 3 цифры + 💰(опционально)
    // Между элементами могут быть пробелы
    const regex = /(?:p\s*)?(\d{3})(?:\s*💰)?/g;
    
    // Заменяем найденные конструкции, оборачивая их в двойные скобки
    return title.replace(regex, '(( p$1 💰 ))');
}

module.exports = {
    wrapPriceCode
};