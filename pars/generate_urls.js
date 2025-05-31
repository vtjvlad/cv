const fs = require('fs');

// Base URL template
const baseUrl = 'https://www.wsxcme.com/album/personal/all?&albumId=A202101141308200830564903&startDate=2025-05-01&endDate=2025-05-31&sourceId=&slipType=1&timestamp={timestamp}&requestDataType=';

// Function to generate URLs with sequential timestamps
function generateUrls(startTimestamp, count, interval = 32) {
    const urls = [];
    let currentTimestamp = startTimestamp;

    for (let i = 0; i < count; i++) {
        const url = baseUrl.replace('{timestamp}', currentTimestamp);
        urls.push(url);
        currentTimestamp -= interval; // Decrease timestamp by interval
    }

    return urls;
}

// Generate 10 URLs starting from the given timestamp
const startTimestamp = 1748599085466;
const urls = generateUrls(startTimestamp, 500);

// Save URLs to file
fs.writeFileSync('generated_urls.txt', urls.join('\n'));

// Print first few URLs for verification
console.log('Generated URLs:');
urls.slice(0, 5).forEach((url, index) => {
    console.log(`${index + 1}. ${url}`);
});

console.log(`\nTotal URLs generated: ${urls.length}`);
console.log('All URLs have been saved to generated_urls.txt'); 