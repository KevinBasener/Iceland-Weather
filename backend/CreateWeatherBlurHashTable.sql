CREATE TABLE weather_blurhashes (
    id SERIAL PRIMARY KEY,
    image_id INT REFERENCES weather_images(image_id), -- Assuming you have an 'id' in weather_images
    wind VARCHAR NOT NULL,
    temperature VARCHAR NOT NULL,
    precipitation VARCHAR NOT NULL
);