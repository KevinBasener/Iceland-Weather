import axios from "axios";
import random from "random";
import dotenv from "dotenv";
import databaseOperations from "./databaseOperations.js";
import puppeteer from "puppeteer";

dotenv.config();

let imageUrls = await buildUrls();
let starting_time = extractTime(imageUrls['wind']);
let currentIndex = 86;
let haveUrlsChanged = false;

async function getImageSource(targetUrl) {
    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
    await sleep(random.int(1000, 2000));

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

async function haveUrlsChangedFunc(weatherType){
    const windImageSource = await getImageSource(`https://en.vedur.is/weather/forecasts/elements/#type=${weatherType}`);
    console.log('No new URL found.', windImageSource, imageUrls[weatherType]);
    if(imageUrls[weatherType] === windImageSource){
        haveUrlsChanged = false;
        return haveUrlsChanged;
    }
    console.log('New URL found:' + await buildUrls());
    haveUrlsChanged = true;
    currentIndex -= 1;
    return await buildUrls();
}

async function buildUrls(){
    return {
        'wind': await getImageSource('https://en.vedur.is/weather/forecasts/elements/#type=wind'),
        'temperature': await getImageSource('https://en.vedur.is/weather/forecasts/elements/#type=temp'),
        'precipitation': await getImageSource('https://en.vedur.is/weather/forecasts/elements/#type=precip')
    };
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

async function fetchData(url, weatherType) {
    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    const instance = axios.create({
        responseType: 'arraybuffer',
    });

    await sleep(random.int(1000, 2000));

    const response = await instance.get(url).catch(async function(error) {
        if(error.response && error.response.status === 404){
            const result = await haveUrlsChangedFunc(weatherType);
            if(result instanceof Object){
                imageUrls = result;
            }
        }
        return null;
    });
    if(response === null){
        return null;
    }
    return response.data;
}

async function getWeatherImage(number, weatherType) {
    try {
        return await fetchData(imageUrls[weatherType].slice(0, -7) + zeroPadding(number, 3) + imageUrls[weatherType].slice(-4), weatherType);
    } catch (error) {
        console.error(`An error occurred fetching the image:`, error);
    }
}

async function loadAllWeatherImages() {
    let time = starting_time;
    await databaseOperations.init();
    for (currentIndex; currentIndex <= 186; currentIndex++) {
        console.log(`Fetching image set number: ${currentIndex}`);

        const windImage = await getWeatherImage(currentIndex, 'wind');
        const temperatureImage = await getWeatherImage(currentIndex, 'temperature');
        const precipitationImage = await getWeatherImage(currentIndex, 'precipitation');


        try {
            if(haveUrlsChanged){
                haveUrlsChanged = false;
            }

            await databaseOperations.saveWeatherImages(windImage, temperatureImage, precipitationImage, time);
            time.setHours(time.getHours() + 1);

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
