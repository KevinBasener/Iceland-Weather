import axios from "axios";
import random from "random";
import {DatabaseOperations} from "./database-operations.js";
import puppeteer from "puppeteer";

class ImageLoader {
    constructor(weatherType) {
        this.weatherType = weatherType;
        this.databaseOperations = new DatabaseOperations(weatherType);
    }

    convertTimeToTodayDate(url) {
        const timeMatch = url.match(/_(\d{2})(\d{2})_\d+\.gif$/);
        if (timeMatch && timeMatch.length > 2) {
            const hours = parseInt(timeMatch[1], 10);
            const minutes = parseInt(timeMatch[2], 10);

            const dateToday = new Date();
            dateToday.setHours(hours, minutes, 0, 0);

            return dateToday;
        } else {
            throw new Error('Time could not be extracted from the URL.');
        }
    }

    async loadWeatherImageUrls() {
        const browser = await puppeteer.launch({headless: true});
        const page = await browser.newPage();
        let imageUrls = [];
        const weatherTypeMapping = {
            'wind': 'wind',
            'temperature': 'temp',
            'precipitation': 'precip'
        }
        await page.goto(`https://en.vedur.is/weather/forecasts/elements/#type=${weatherTypeMapping[this.weatherType]}`);

        page.on('request', async (request) => {
            if (request.url().includes('photos')) {
                imageUrls.push(request.url());
            }
        });

        await page.waitForSelector('#img1_getall');
        await page.click('#img1_getall');
        await browser.close();
        await this.databaseOperations.init();

        for (const imageUrl of imageUrls) {
            try {
                const imageId = this.extractImageId(imageUrl);
                const image = await this.fetchImage(imageUrl);
                const time = this.convertTimeToTodayDate(imageUrl);

                if (time) {
                    time.setHours(time.getHours() + imageId);
                }

                await this.databaseOperations.saveWeatherImage(image, imageId, time);
            } catch (error) {
                console.error('Error while fetching image:', error);
            }
        };

        await this.databaseOperations.closeConnection();
    }

    extractImageId(url) {
        const match = url.match(/_(\d+)\.gif$/);
        if (match && match.length > 1) {
            return parseInt(match[1], 10); // Convert the captured string to an integer
        } else {
            throw new Error('No matching number found in the URL.');
        }
    }

    async fetchImage(imageUrl) {
        const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
        const instance = axios.create({
            responseType: 'arraybuffer',
        });

        await sleep(random.int(1000, 2000));

        const response = await instance.get(imageUrl).catch(async function (error) {
            if (error.response) {
                console.log('Error while fetching' + error.response);
            }
        });

        return response.data;
    }
}

const imageLoader1 = new ImageLoader('wind');
await imageLoader1.loadWeatherImageUrls();
const imageLoader2 = new ImageLoader('temperature');
await imageLoader2.loadWeatherImageUrls();
const imageLoader3 = new ImageLoader('precipitation');
await imageLoader3.loadWeatherImageUrls();

