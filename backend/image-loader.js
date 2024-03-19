import axios from "axios";
import random from "random";
import pg from "pg";
import dotenv from "dotenv";
import databaseOperations from "./databaseOperations.js";

dotenv.config();

const WeatherUrlPart = {
    Wind: 'thattaspa_igb_island_10uv',
    Temperature: 'thattaspa_igb_island_2t',
    Precipitation: 'thattaspa_igb_island_urk-msl-10uv'
}

const pool = new pg.Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT
});

async function fetchData(url) {
    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    const instance = axios.create({
        responseType: 'arraybuffer'
    });
    try {
        const response = await instance.get(url);
        await sleep(random.int(1000, 2000));
        return response.data;
    } catch (error) {
        console.error('Error fetching data:', error);
    }
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
    for (let i = 1; i <= 1; i++) {
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
await databaseOperations.getWeatherImage(1, databaseOperations.WeatherTypeImage.Wind);