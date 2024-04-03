import pg from 'pg';
import dotenv from 'dotenv';
import {convertToBlurHash, trimImage} from "./image-manipulation.js";

dotenv.config();

export class DatabaseOperations {

    constructor(weatherType) {
        this.pool = new pg.Pool({
            user: process.env.DB_USER,
            host: process.env.DB_HOST,
            database: process.env.DB_NAME,
            password: process.env.DB_PASSWORD,
            port: process.env.DB_PORT,
        });

        this.client = null;
        this.weatherType = weatherType;
    }

    async saveWeatherImage(image, imageId, time) {
        try {
            if (this.client) {
                await this.client.query('BEGIN');

                if (image && imageId && time) {
                    const trimmedImage = await trimImage(image, 15, 0, 30, 0);
                    const insertImageText = `INSERT INTO ${this.weatherType}_images(image_id, image, time)
                                             VALUES ($1, $2, $3)
                                             RETURNING image_id`;

                    await this.client.query(insertImageText, [imageId, trimmedImage, time]);
                    await this.client.query('COMMIT');
                    await this.encodeAndSaveBlurHashes(trimmedImage, imageId);

                    console.log('Save image ', imageId);
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

                const insertBlurHashText = `INSERT INTO ${this.weatherType}_blur_hashes(image_id, blur_hash)
                                            VALUES ($1, $2)`;
                await this.client.query(insertBlurHashText, [imageId, blurHash]);

                await this.client.query('COMMIT');
            }
        } catch (error) {
            await this.client.query('ROLLBACK');
            console.error('Error encoding images to BlurHash or saving to the database:', error);
        }
    }

    async getBlurHash(imageId) {
        await this.init();

        let result;
        if (this.client) {
            const query = `SELECT blur_hash
                           FROM ${this.weatherType}_blur_hashes
                           WHERE image_id = $1`;
            result = await this.client.query(query, [imageId]);
            console.log(result);
        }

        await this.closeConnection();

        if (result.rows.length > 0) {
            return result.rows[0]['blur_hash'];
        } else {
            return null;
        }
    }

    async getWeatherImage(imageId) {
        try {
            await this.init();
            if (this.client) {
                const query = `SELECT image
                               FROM ${this.weatherType}_images
                               WHERE image_id = $1`;
                const result = await this.client.query(query, [imageId]);
                await this.closeConnection();
                if (result.rows.length > 0) {
                    return result.rows[0]['image'];
                } else {
                    console.log(`No ${this.weatherType} image found in the database for ID ${imageId}.`);
                    return null;
                }
            }
        } catch (error) {
            console.error('Error fetching image from the database:', error);
        }
    }

    async getTime(imageId) {
        try {
            await this.init();
            let result;
            if (this.client) {
                const query = `SELECT time
                               FROM ${this.weatherType}_images
                               WHERE image_id = $1`;
                result = await this.client.query(query, [imageId]);
            }
            await this.closeConnection();
            if (result.rows.length > 0) {
                return result.rows[0]['time'];
            } else {
                return null;
            }

        } catch(e) {
            console.error('Error fetching time from the database:', e);
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
