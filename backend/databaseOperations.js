import pg from 'pg';
import dotenv from 'dotenv';
import { convertToBlurHash, trimImage } from "./image-manipulation.js";

dotenv.config();

export class DatabaseOperations {
    static instance;

    constructor(weatherType) {
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
        this.weatherType = weatherType;
    }

    async saveWeatherImage(image, imageId, time) {
        try {
            if (this.client) {
                await this.client.query('BEGIN');

                if(image && imageId && time){
                    const trimmedImage = await trimImage(image, 15, 0, 30, 0);
                    console.log(trimmedImage);

                    const insertImageText = `INSERT INTO ${this.weatherType}_images(image_id, image, time)
                                         VALUES ($1, $2, $3) RETURNING id`;
                    const insertResult = await this.client.query(insertImageText, [imageId, trimmedImage, time]);
                    await this.client.query('COMMIT');

                    await this.encodeAndSaveBlurHashes(trimmedImage, insertResult.rows[0].id);
                } else {
                    console.error('$weatherType missing values');
                }
            }
        } catch (error) {
            await this.client.query('ROLLBACK');
            console.error('Error saving image to the database:', error);
        }
    }

    async encodeAndSaveBlurHashes(image, imageId) {
        try {
            if (this.client) {
                await this.client.query('BEGIN');

                const blurHash = await convertToBlurHash(image);

                const insertBlurHashText = `INSERT INTO ${this.weatherType}_blur_hashes(${this.weatherType}_id, blur_hash)
                                            VALUES ($1, $2)`;
                await this.client.query(insertBlurHashText, [imageId, blurHash]);

                await this.client.query('COMMIT');
            }
        } catch (error) {
            await this.client.query('ROLLBACK');
            console.error('Error encoding images to BlurHash or saving to the database:', error);
        }
    }

    async getBlurHash(imageId, weatherType) {
        await this.init();

        const query = `SELECT wind, temperature, precipitation FROM weather_blurhashes WHERE image_id = $1`;
        const result = await this.client.query(query, [imageId]);

        if (result.rows.length > 0) {
            return result.rows[0][weatherType];
        } else {
            return null;
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
            this.client = null;
        }
    }

    async init() {
        if (!this.client) {
            this.client = await this.pool.connect();
            console.log('Database client connected successfully');
        }
    }
}
