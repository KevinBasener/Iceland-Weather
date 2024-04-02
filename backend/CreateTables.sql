CREATE TABLE wind_images
(
    id       SERIAL PRIMARY KEY,
    image_id INTEGER   NOT NULL,
    image    bytea     NOT NULL,
    time     TIMESTAMP NOT NULL
);

CREATE TABLE temperature_images
(
    id       SERIAL PRIMARY KEY,
    image_id INTEGER   NOT NULL,
    image    bytea     NOT NULL,
    time     TIMESTAMP NOT NULL
);

CREATE TABLE precipitation_images
(
    id       SERIAL PRIMARY KEY,
    image_id INTEGER   NOT NULL,
    image    bytea     NOT NULL,
    time     TIMESTAMP NOT NULL
);

CREATE TABLE wind_blur_hashes
(
    id       SERIAL PRIMARY KEY,
    image_id  INT REFERENCES wind_images (id),
    blur_hash VARCHAR NOT NULL
);

CREATE TABLE temperature_blur_hashes
(
    id             SERIAL PRIMARY KEY,
    image_id INT REFERENCES temperature_images (id),
    blur_hash       VARCHAR NOT NULL
);

CREATE TABLE precipitation_blur_hashes
(
    id               SERIAL PRIMARY KEY,
    image_id INT REFERENCES precipitation_images (id),
    blur_hash         VARCHAR NOT NULL
);