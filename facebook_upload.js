const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');

puppeteer.use(StealthPlugin());

async function run() {
    const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });

    const page = await browser.newPage();
    const cookies = JSON.parse(process.env.FACEBOOK_COOKIES);
    await page.setCookie(...cookies);

    try {
        await page.goto('https://business.facebook.com/latest/reels_composer', { waitUntil: 'networkidle2' });
        const fileInput = await page.waitForSelector('input[type="file"]');
        await fileInput.uploadFile('./video.mp4');

        await page.waitForSelector('div[role="textbox"]');
        await page.keyboard.type('Success from Kiro Zozo! 🚀');

        const nextBtn = 'div[aria-label="التالي"], div[aria-label="Next"]';
        for(let i=0; i<2; i++) {
            await page.waitForSelector(nextBtn);
            await page.click(nextBtn);
            await new Promise(r => setTimeout(r, 4000));
        }

        const shareBtn = 'div[aria-label="نشر"], div[aria-label="Share"]';
        await page.click(shareBtn);
        await new Promise(r => setTimeout(r, 20000));
        await page.screenshot({ path: 'facebook-final-check.png', fullPage: true });
        console.log('✅ تم النشر على فيسبوك');
    } catch (e) {
        await page.screenshot({ path: 'facebook-error-log.png' });
        throw e;
    } finally {
        await browser.close();
    }
}
run();
