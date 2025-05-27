    const fs = require('fs');

// Функция для добавления порядковых номеров к объектам
function addSequentialNumbers(items) {
    return items.map((item, index) => ({
        ...item,
        rownum: index + 1  // Нумерация начинается с 1
    }));
}

module.exports = {
    addSequentialNumbers
};
