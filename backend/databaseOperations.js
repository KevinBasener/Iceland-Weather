import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

class DatabaseOperations {
    static instance;
    WeatherTypeImage = {
        Wind: 'wind',
        Temperature: 'temperature',
        Precipitation: 'precipitation'
    };

    constructor() {
        if (DatabaseOperations.instance) {
            return DatabaseOperations.instance;
        }
        this.pool = new pg.Pool({
            user: process.env.DB_USER,
            host: process.env.DB_HOST,
            database: process.env.DB_NAME,
            password: process.env.DB_PASSWORD,
            port: process.env.DB_PORT,
        });
        DatabaseOperations.instance = this;
        this.client = null;
    }

    async saveWeatherImages(windImage, temperatureImage, precipitationImage) {
        try {
            if (this.client) {
                await this.client.query('BEGIN');
                const insertImageText = `INSERT INTO weather_images(wind, temperature, precipitation)
                                         VALUES ($1, $2, $3)`;
                await this.client.query(insertImageText, [windImage, temperatureImage, precipitationImage]);
                await this.client.query('COMMIT');
            }
        } catch (error) {
            await this.client.query('ROLLBACK');
            console.error('Error saving image to the database:', error);
        }
    }

    async getWeatherImage(imageId, imageType) {
        try {
            if (this.client) {
                const query = `SELECT ${imageType}
                               FROM weather_images
                               WHERE image_id = $1`;
                const result = await this.client.query(query, [imageId]);
                if (result.rows.length > 0) {
                    return result.rows[0][imageType];
                } else {
                    console.log(`No ${imageType} image found in the database for ID ${imageId}.`);
                    return null;
                }
            }
        } catch (error) {
            console.error('Error fetching image from the database:', error);
        }
    }

    async closeConnection() {
        if (this.client) {
            await this.client.release();
        }
    }

    async init() {
        if (!this.client) {
            this.client = await this.pool.connect();
            console.log('Database client connected successfully');
        }
    }
}

const databaseOperations = new DatabaseOperations();

export default databaseOperations;
