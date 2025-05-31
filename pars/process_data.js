const fs = require('fs');

// Function to process the JSON data
function processData(inputFile, outputFile) {
    try {
        // Read the JSON file
        const rawData = fs.readFileSync(inputFile, 'utf8');
        const jsonData = JSON.parse(rawData);

        // Extract data field from each object and create new array
        const processedData = jsonData.map(item => {
            if (item.data && typeof item.data === 'object') {
                return item.data;
            }
            return null;
        }).filter(item => item !== null); // Remove any null items

        // Save processed data to new file
        fs.writeFileSync(outputFile, JSON.stringify(processedData, null, 2));

        console.log(`Successfully processed ${processedData.length} items`);
        console.log(`Data saved to ${outputFile}`);

        // Print first item as example
        if (processedData.length > 0) {
            console.log('\nExample of processed data:');
            console.log(JSON.stringify(processedData[0], null, 2));
        }

    } catch (error) {
        console.error('Error processing data:', error.message);
    }
}

// Process the data
const inputFile = 'album_data.json';  // Your input JSON file
const outputFile = 'processed_data.json';     // Output file name

processData(inputFile, outputFile); 