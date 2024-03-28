import {encode} from 'blurhash';
import sharp from 'sharp';

async function convertToBlurHash(imageBuffer) {
    const { data, info } = await sharp(imageBuffer)
        .raw()
        .ensureAlpha()
        .toBuffer({ resolveWithObject: true });

    return encode(data, info.width, info.height, 4, 4);
}

async function trimImage(imageBuffer, top, right, bottom, left) {
    const metadata = await sharp(imageBuffer).metadata();

    const trimWidth = metadata.width - left - right;
    const trimHeight = metadata.height - top - bottom;

    const { data, info } = await sharp(imageBuffer)
        .extract({ left, top, width: trimWidth, height: trimHeight })
        .toBuffer({ resolveWithObject: true });

    return data;
}
export { convertToBlurHash, trimImage };