const fs = require('fs');
const axios = require('axios');
const path = require('path');
const colors = require('colors');
const cliProgress = require('cli-progress');

// Function to read URLs from file
async function readUrlsFromFile(filePath) {
    try {
        const content = await fs.promises.readFile(filePath, 'utf8');
        const urls = content.split('\n')
            .map(url => url.trim())
            .filter(url => url !== '');
        
        console.log(colors.green(`✓ Successfully read ${urls.length} URLs from file`));
        return urls;
    } catch (error) {
        console.error(colors.red(`✗ Error reading file: ${error.message}`));
        throw error;
    }
}

// Function to fetch data from a single URL
async function fetchData(url) {
    try {
        const response = await axios({
            method: 'post',
            url: url,
            headers: {
                'authority': 'www.wsxcme.com',
                'accept': 'application/json, text/plain, */*',
                'accept-encoding': 'gzip, deflate, br, zstd',
                'accept-language': 'uk-UA,uk;q=0.9,en-US;q=0.8,en;q=0.7',
                'cache-control': 'no-cache',
                'content-type': 'application/json;charset=UTF-8',
                'cookie': 'token=Mzk4MDk3Q0E5RTZCN0I1MkYwMTYwNDlCQUNFNkQ5QzVFOEZCOTI1OEEwOTA2MDc0QzUzRTVCNDVDMTg1RTgzRTZBNTY1MTZDQTNFNDFCRkI2ODZGRTgxRjQxRDU3MEZD; sensorsdata2015jssdkcross=%7B%22distinct_id%22%3A%221970541cb4b565-09c29dbe66f63d-19525636-1405320-1970541cb4c187b%22%2C%22first_id%22%3A%22%22%2C%22props%22%3A%7B%22%24latest_traffic_source_type%22%3A%22%E7%9B%B4%E6%8E%A5%E6%B5%81%E9%87%8F%22%2C%22%24latest_search_keyword%22%3A%22%E6%9C%AA%E5%8F%96%E5%88%B0%E5%80%BC_%E7%9B%B4%E6%8E%A5%E6%89%93%E5%BC%80%22%2C%22%24latest_referrer%22%3A%22%22%7D%2C%22identities%22%3A%22eyIkaWRlbnRpdHlfY29va2llX2lkIjoiMTk3MDU0MWNiNGI1NjUtMDljMjlkYmU2NmY2M2QtMTk1MjU2MzYtMTQwNTMyMC0xOTcwNTQxY2I0YzE4N2IifQ%3D%3D%22%2C%22history_login_id%22%3A%7B%22name%22%3A%22%22%2C%22value%22%3A%22%22%7D%2C%22%24device_id%22%3A%221970541cb4b565-09c29dbe66f63d-19525636-1405320-1970541cb4c187b%22%7D; googtrans=/zh-CN/en; googtrans=/zh-CN/en; JSESSIONID=B04DF5E5B2EBADD6A1592A5B7EA89205',
                'origin': 'https://www.wsxcme.com',
                'pragma': 'no-cache',
                'priority': 'u=1, i',
                'referer': 'https://www.wsxcme.com/weshop/store/A202101141308200830564903?groupIds=',
                'sec-ch-ua': '"Chromium";v="136", "Google Chrome";v="136", "Not.A/Brand";v="99"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"macOS"',
                'sec-fetch-dest': 'empty',
                'sec-fetch-mode': 'cors',
                'sec-fetch-site': 'same-origin',
                'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36',
                'wego-albumid': '',
                'wego-channel': '',
                'wego-staging': '0',
                'wego-uuid': '',
                'wego-version': '',
                'x-wg-language': 'zh',
                'x-wg-module': 'indsite',
                'x-wg-track-staff-id': ''
            },
            data: {}, // Empty JSON body as content-length is 2
            timeout: 10000 // 10 second timeout
        });
        
        return {
            url,
            status: response.status,
            data: response.data,
            success: true
        };
    } catch (error) {
        console.error(colors.yellow(`⚠ Warning for URL ${url}: ${error.message}`));
        return {
            url,
            status: error.response?.status || 'ERROR',
            error: error.message,
            success: false
        };
    }
}

// Main function to process all URLs
async function processUrls() {
    try {
        console.log(colors.blue('Starting URL processing...'));
        
        const urls = await readUrlsFromFile('fff.txt');
        if (urls.length === 0) {
            throw new Error('No URLs found in the file');
        }

        const results = [];
        const batchSize = 3; // Reduced batch size for better stability
        const progressBar = new cliProgress.SingleBar({
            format: 'Progress |' + colors.cyan('{bar}') + '| {percentage}% || {value}/{total} URLs',
            barCompleteChar: '\u2588',
            barIncompleteChar: '\u2591'
        });

        progressBar.start(urls.length, 0);

        for (let i = 0; i < urls.length; i += batchSize) {
            const batch = urls.slice(i, i + batchSize);
            const batchResults = await Promise.all(batch.map(url => fetchData(url)));
            results.push(...batchResults);
            
            progressBar.update(i + batch.length);

            // Add a delay between batches
            if (i + batchSize < urls.length) {
                await new Promise(resolve => setTimeout(resolve, 2000)); // Increased delay to 2 seconds
            }
        }

        progressBar.stop();

        // Save results to a file
        const outputPath = path.join(__dirname, 'album.json');
        await fs.promises.writeFile(outputPath, JSON.stringify(results, null, 2));
        
        // Print summary
        const successful = results.filter(r => r.success).length;
        const failed = results.filter(r => !r.success).length;
        
        console.log(colors.green('\n✓ Processing completed!'));
        console.log(colors.blue(`Total URLs processed: ${results.length}`));
        console.log(colors.green(`Successful requests: ${successful}`));
        console.log(colors.red(`Failed requests: ${failed}`));
        console.log(colors.blue(`Results saved to: ${outputPath}`));

    } catch (error) {
        console.error(colors.red(`\n✗ Fatal error: ${error.message}`));
        process.exit(1);
    }
}

// Run the script
processUrls().catch(error => {
    console.error(colors.red(`\n✗ Unhandled error: ${error.message}`));
    process.exit(1);
}); 
