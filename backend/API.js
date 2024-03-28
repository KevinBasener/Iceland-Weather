import express from 'express';
import dotenv from 'dotenv';
import databaseOperations from "./databaseOperations.js";

dotenv.config();

const app = express();
const port = 8080;

app.get('/blurhash/wind/:id', async (req, res) => {
    const imageId = req.params.id;
    const weatherType = 'wind';

    try {
        const blurHash = await databaseOperations.getBlurHash(imageId, weatherType);

        if (blurHash) {
            res.json({ blurHash });
        } else {
            res.status(404).send('Wind BlurHash not found for the given image ID');
        }
    } catch (error) {
        console.error('Error fetching Wind BlurHash:', error);
        res.status(500).send('Server error');
    }
});

app.get('/blurhash/temperature/:id', async (req, res) => {
    const imageId = req.params.id;
    const weatherType = 'temperature';

    try {
        const blurHash = await databaseOperations.getBlurHash(imageId, weatherType);

        if (blurHash) {
            res.json({ blurHash });
        } else {
            res.status(404).send('Temperature BlurHash not found for the given image ID');
        }
    } catch (error) {
        console.error('Error fetching Temperature BlurHash:', error);
        res.status(500).send('Server error');
    }
});

app.get('/blurhash/precipitation/:id', async (req, res) => {
    const imageId = req.params.id;
    const weatherType = 'precipitation';

    try {
        const blurHash = await databaseOperations.getBlurHash(imageId, weatherType);

        if (blurHash) {
            res.json({ blurHash });
        } else {
            res.status(404).send('Precipitation BlurHash not found for the given image ID');
        }
    } catch (error) {
        console.error('Error fetching Precipitation BlurHash:', error);
        res.status(500).send('Server error');
    }
});

app.get('/image/wind/:id', async (req, res) => {
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

app.get('/image/temperature/:id', async (req, res) => {
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

app.get('/image/precipitation/:id', async (req, res) => {
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