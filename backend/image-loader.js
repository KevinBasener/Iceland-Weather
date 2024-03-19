import axios from "axios";
import random from "random";
import pg from "pg";
import dotenv from "dotenv";
import fs from "fs";

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

async function saveWeatherImages(windImage, temperatureImage, precipitationImage) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const insertImageText = `INSERT INTO weather_images(wind, temperature, precipitation)
                                 VALUES ($1, $2, $3)`;
        const res = await client.query(insertImageText, [windImage, temperatureImage, precipitationImage]);
        await client.query('COMMIT');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error saving image to the database:', error);
        throw error;
    } finally {
        client.release();
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

    for (let i = 1; i <= 1; i++) {
        console.log(`Fetching image set number: ${i}`);

        const windImage = await getWeatherImage(i, WeatherUrlPart.Wind);
        const temperatureImage = await getWeatherImage(i, WeatherUrlPart.Temperature);
        const precipitationImage = await getWeatherImage(i, WeatherUrlPart.Precipitation);

        try {
            if (windImage && temperatureImage && precipitationImage) {
                await saveWeatherImages(windImage, temperatureImage, precipitationImage);
            }
        } catch (error) {
            console.error('Error saving images to the database:', error);
        }
    }
}

async function fetchAndSaveFirstWindImage() {
    const client = await pool.connect();
    try {
        const result = await client.query('SELECT * FROM weather_images ORDER BY image_id ASC LIMIT 1');
        if (result.rows.length > 0) {
            const windImage = result.rows[0].wind;
            const temperatureImage = result.rows[0].temperature;
            const precipitationImage = result.rows[0].precipitation;

            fs.writeFileSync('windImage.gif', windImage);
            fs.writeFileSync('temperatureImage.gif', temperatureImage);
            fs.writeFileSync('precipitationImage.gif', precipitationImage);
        } else {
            console.log('No images found in the database.');
        }
    } catch (error) {
        console.error('Error fetching image from the database:', error);
    } finally {
        client.release();
    }
}