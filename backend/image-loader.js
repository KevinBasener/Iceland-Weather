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

let imageUrls = {
    'Wind': await getImageSource('https://en.vedur.is/weather/forecasts/elements/#type=wind'),
    'Temperature': await getImageSource('https://en.vedur.is/weather/forecasts/elements/#type=temp'),
    'Precipitation': await getImageSource('https://en.vedur.is/weather/forecasts/elements/#type=precip')
};

let starting_time = extractTime(imageUrls['Wind']);

console.log(starting_time.getHours());

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

function extractTime(imageSource) {
    const timeMatch = imageSource.match(/_(\d{2})(\d{2})_/);

    if (timeMatch) {
        const hours = parseInt(timeMatch[1], 10)
        const minutes = parseInt(timeMatch[2], 10);
        const dateToday = new Date();

        dateToday.setHours(hours, minutes, 0, 0);

        return dateToday;
    } else {
        throw new Error('Time could not be extracted from the image source.');
    }
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

async function getWeatherImage(number, weatherParam) {
    try {
        return await fetchData(imageUrls[weatherParam].slice(0, -7) + zeroPadding(number, 3) + imageUrls[weatherParam].slice(-4));
    } catch (error) {
        console.error(`An error occurred fetching the image:`, error);
    }
}

async function loadAllWeatherImages() {
    let time = starting_time;
    await databaseOperations.init();
    for (let i = 1; i <= 186; i++) {
        console.log(`Fetching image set number: ${i}`);

        const windImage = await getWeatherImage(i, 'Wind');
        const temperatureImage = await getWeatherImage(i, 'Temperature');
        const precipitationImage = await getWeatherImage(i, 'Precipitation');

        try {
            if (windImage && temperatureImage && precipitationImage) {
                await databaseOperations.saveWeatherImages(windImage, temperatureImage, precipitationImage, time);
                time.setHours(time.getHours() + 1);
                console.log(time.getHours());
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
