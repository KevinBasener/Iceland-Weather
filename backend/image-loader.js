import axios from "axios";
import tunnel from "tunnel";
import dotenv from "dotenv"

const date = new Date();
const formattedDate = date.toISOString().slice(2,10).replace(/-/g, '').slice(0, 6);
const imageUrl = `https://en.vedur.is/photos/thattaspa_igb_island_10uv/${formattedDate}_0600_008.gif`;

console.log(imageUrl);

async function fetchData(url) {
    const tunnelAgent = tunnel.httpsOverHttp({
        proxy: {
            host: process.env.PROXY_HOST,
            port: process.env.PROXY_PORT,
            proxyAuth: process.env.PROXY_AUTH,
        },
    });

    const instance = axios.create({
        httpsAgent: tunnelAgent,
    });
    try {
        const response = await instance.get(url);
        console.log(response.data);
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

fetchData(imageUrl);
