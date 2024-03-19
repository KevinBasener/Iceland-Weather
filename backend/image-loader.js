import axios from "axios";
import random from "random";
import pg from "pg";
import dotenv from "dotenv";
import databaseOperations from "./databaseOperations.js";
import fs from "fs";
import pkg from 'https-proxy-agent';

dotenv.config();

const WeatherUrlPart = {
    Wind: 'thattaspa_igb_island_10uv',
    Temperature: 'thattaspa_igb_island_2t',
    Precipitation: 'thattaspa_igb_island_urk-msl-10uv'
}

async function fetchData(url) {
    const proxy_ips = await readProxyIpsFromFile('proxy_ips.txt');
    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
    const proxyIp = proxy_ips[random.int(0, proxy_ips.length - 1)];
    const httpsAgent = new pkg.HttpsProxyAgent(`http://${proxyIp}`);

    const instance = axios.create({
        httpsAgent: httpsAgent,
        responseType: 'arraybuffer',
    });
    try {
        const response = await instance.get(url);
        await sleep(random.int(1000, 2000));
        return response.data;
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

async function readProxyIpsFromFile(filePath) {
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, { encoding: 'utf-8' }, (err, data) => {
            if (err) {
                reject(err);
                return;
            }
            const ips = data.split('\n').filter(line => line.trim() !== '');
            resolve(ips);
        });
    });
}

async function getWeatherImage(number, weatherUrlPart) {
    const date = new Date();
    const formattedDate = date.toISOString().slice(2, 10).replace(/-/g, '').slice(0, 6);
    const imageUrl = `https://en.vedur.is/photos/${weatherUrlPart}/${formattedDate}_0600_00${number}.gif`;

    try {
        return await fetchData(imageUrl);
    } catch (error) {
        console.error(`An error occurred fetching the image:`, error);
    }
}

async function loadAllWeatherImages() {
    await databaseOperations.init();
    for (let i = 1; i <= 186; i++) {
        console.log(`Fetching image set number: ${i}`);

        const windImage = await getWeatherImage(i, WeatherUrlPart.Wind);
        const temperatureImage = await getWeatherImage(i, WeatherUrlPart.Temperature);
        const precipitationImage = await getWeatherImage(i, WeatherUrlPart.Precipitation);

        try {
            if (windImage && temperatureImage && precipitationImage) {
                await databaseOperations.saveWeatherImages(windImage, temperatureImage, precipitationImage);
            }
        } catch (error) {
            console.error('Error saving images to the database:', error);
        }
    }
    await databaseOperations.closeConnection();
}

await loadAllWeatherImages();

async function saveImageToFile(imageId, imageType) {
    try {
        await databaseOperations.init();
        const imageData = await databaseOperations.getWeatherImage(imageId, imageType);
        if (imageData) {
            const fileName = `${imageType.toLowerCase()}_image_${imageId}.gif`;

            fs.writeFileSync(fileName, imageData);
            console.log(`${imageType} image has been saved as ${fileName}`);
        }
    } catch (error) {
        console.error(`Failed to fetch and save ${imageType} image:`, error);
    }
    await databaseOperations.closeConnection();
}