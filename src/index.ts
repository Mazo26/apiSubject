import express from 'express';
import axios from 'axios';
import NodeCache from 'node-cache';

const app = express();
const port = 3000;

const cache = new NodeCache({ stdTTL: 600, checkperiod: 120 });

app.get('/api/files', async (req, res) => {
    try {
        const cachedData = cache.get('filesData');
        if (cachedData) {
            return res.json(cachedData);
        }

        const response = await axios.get('https://rest-test-eight.vercel.app/api/test');
        const urls: string[] = response.data.items.map((item: any) => item.fileUrl);

        const transformedData = transformData(urls);

        cache.set('filesData', transformedData);

        res.json(transformedData);
    } catch (error) {
        console.error('Error fetching or transforming data:', error);
        res.status(500).send('Internal Server Error');
    }
});

function transformData(urls: string[]) {
    const data: { [key: string]: any } = {};

    urls.forEach(url => {
        const urlParts = url.split('/');
        const ipPort = urlParts[2];
        const directories = urlParts.slice(3, -1);
        const fileName = urlParts[urlParts.length - 1];

        if (!data[ipPort]) {
            data[ipPort] = [];
        }

        let currentLevel = data[ipPort];

        directories.forEach((dir, index) => {
            let dirObj = currentLevel.find((obj: any) => typeof obj === 'object' && obj[dir]);
            if (!dirObj) {
                dirObj = { [dir]: [] };
                currentLevel.push(dirObj);
            }
            if (index === directories.length - 1) {
                dirObj[dir].push(fileName);
            } else {
                currentLevel = dirObj[dir];
            }
        });

        if (directories.length === 0) {
            currentLevel.push(fileName);
        }
    });

    return data;
}

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});