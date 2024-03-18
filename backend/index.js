import puppeteer from "puppeteer-core";
import dotenv from "dotenv"

async function run(){
    let browser;

    try {
        browser = await puppeteer.connect({
            browserWSEndpoint: `wss://${process.env.SCRAPING_BROWSER_AUTH}@${process.env.PROXY_HOST}:${process.env.SCRAPING_BROWSER_PORT}`
        });

        const page = await browser.newPage();
        page.setDefaultNavigationTimeout(2 * 60 * 1000);

        const date = new Date();
        const formattedDate = date.toISOString().slice(2,10).replace(/-/g, '').slice(0, 6);
        const imageUrl = `https://en.vedur.is/photos/thattaspa_igb_island_10uv/${formattedDate}_0600_008.gif`;

        console.log(imageUrl);
    } catch(e){
        console.error("Browser experienced error", e);
    } finally{
        await browser?.close();
    }
}

run()