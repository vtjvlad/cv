const fs = require('fs');

// Читаем данные из JSON файла
try {
    const jsonData = fs.readFileSync('./JSON/china-ready.json', 'utf8');
    const data = JSON.parse(jsonData);

    // Функция для подсчета уникальных заголовков
    function countUniqueTitles(array) {
        // Создаем объект для подсчета
        const titleCount = {};
        
        // Проходим по массиву и считаем заголовки
        array.forEach(item => {
            if (item.title) {
                titleCount[item.title] = (titleCount[item.title] || 0) + 1;
            }
        });
        
        // Выводим результаты
        console.log('Уникальные заголовки и их количество:');
        for (const [title, count] of Object.entries(titleCount)) {
            console.log(`${title} (${count})`);
        }
    }

    // Запускаем функцию
    countUniqueTitles(data);
} catch (error) {
    console.error('Ошибка при чтении файла:', error.message);
} 