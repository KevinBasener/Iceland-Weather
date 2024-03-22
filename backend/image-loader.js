import axios from "axios";
import random from "random";
import pg from "pg";
import dotenv from "dotenv";
import databaseOperations from "./databaseOperations.js";
import fs from "fs";
import puppeteer from "puppeteer";
import pkg from 'https-proxy-agent';
import * as cheerio from "cheerio";

dotenv.config();

let imageUrls = {};
await buildImagesUrls();

async function getImageSource(targetUrl) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await page.goto(targetUrl, {waitUntil: 'networkidle2'});

    const imgUrl = await page.evaluate((selector) => {
        const imgElement = document.querySelector(selector);
        if (imgElement) {
            return imgElement.src;
        }
        return null;
    }, '#img1');

    await browser.close();

    return imgUrl;
}

async function buildImagesUrls() {
    imageUrls = {
        'Wind': await getImageSource('https://en.vedur.is/weather/forecasts/elements/#type=wind'),
        'Temperature': await getImageSource('https://en.vedur.is/weather/forecasts/elements/#type=temp'),
        'Precipitation': await getImageSource('https://en.vedur.is/weather/forecasts/elements/#type=precip')
    };
}

async function fetchData(url) {
    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    const instance = axios.create({
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
        fs.readFile(filePath, {encoding: 'utf-8'}, (err, data) => {
            if (err) {
                reject(err);
                return;
            }
            const ips = data.split('\n').filter(line => line.trim() !== '');
            resolve(ips);
        });
    });
}

async function getWeatherImage(number, weatherParam) {
    try {
        return await fetchData(imageUrls[weatherParam].slice(0, -7) + zeroPadding(number, 3) + imageUrls[weatherParam].slice(-4));
    } catch (error) {
        console.error(`An error occurred fetching the image:`, error);
    }
}

async function loadAllWeatherImages() {
    await databaseOperations.init();
    for (let i = 1; i <= 186; i++) {
        console.log(`Fetching image set number: ${i}`);

        const windImage = await getWeatherImage(i, 'Wind');
        const temperatureImage = await getWeatherImage(i, 'Temperature');
        const precipitationImage = await getWeatherImage(i, 'Precipitation');

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

function zeroPadding(num, size) {
    var s = "000" + num;
    return s.substring(s.length - size);
}