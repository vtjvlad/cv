function convertPrice(code) {
    // Извлекаем pXXX из строки
const match =  code.match(/\bp\s*(\d{3})\w*/);
    if (!match) {
        return null; // Если pXXX не найден, возвращаем null
    }
    // /\bp\s*(\d{3})\w*/)
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
        { min: 362, max: 401, value: 3800 },
        { min: 402, max: 431, value: 4000 } 
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

module.exports = {
    convertPrice
};