import express from 'express';
import dotenv from 'dotenv';
import databaseOperations from "./databaseOperations.js";

dotenv.config();

const app = express();
const port = 8080;

app.get('/images/wind/:id', async (req, res) => {
    await databaseOperations.init();
    try {
        const image = await databaseOperations.getWeatherImage(req.params.id, databaseOperations.WeatherTypeImage.Wind);
        if (image) {
            res.contentType('image/jpeg');
            res.send(image);
        } else {
            res.status(404).send('Image not found');
        }
    } catch (error) {
        res.status(500).send('Server error');
    }
    await databaseOperations.closeConnection();
});

app.get('/images/temperature/:id', async (req, res) => {
    await databaseOperations.init();
    try {
        const image = await databaseOperations.getWeatherImage(req.params.id, databaseOperations.WeatherTypeImage.Temperature);
        if (image) {
            res.contentType('image/jpeg');
            res.send(image);
        } else {
            res.status(404).send('Image not found');
        }
    } catch (error) {
        res.status(500).send('Server error');
    }
    await databaseOperations.closeConnection();
});

app.get('/images/precipitation/:id', async (req, res) => {
    await databaseOperations.init();
    try {
        const image = await databaseOperations.getWeatherImage(req.params.id, databaseOperations.WeatherTypeImage.Precipitation);
        if (image) {
            res.contentType('image/jpeg');
            res.send(image);
        } else {
            res.status(404).send('Image not found');
        }
    } catch (error) {
        res.status(500).send('Server error');
    }
    await databaseOperations.closeConnection();
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});