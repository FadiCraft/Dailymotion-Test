const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');

puppeteer.use(StealthPlugin());

async function run() {
    console.log('1. تشغيل المتصفح...');
    const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 1024 });

    console.log('2. تحميل كوكيز فيسبوك...');
    if (!process.env.FACEBOOK_COOKIES) throw new Error("FACEBOOK_COOKIES secret is missing!");
    const cookies = JSON.parse(process.env.FACEBOOK_COOKIES);
    await page.setCookie(...cookies);

    try {
        console.log('3. التوجه إلى رابط Reels في Business Suite...');
        // هذا الرابط يفتح مباشرة نافذة إنشاء Reel
        await page.goto('https://business.facebook.com/latest/reels_composer', { waitUntil: 'networkidle2', timeout: 90000 });

        console.log('4. اختيار ملف الفيديو...');
        const fileInput = await page.waitForSelector('input[type="file"]', { timeout: 60000 });
        await fileInput.uploadFile('./video.mp4'); // سكريبت التحميل يجب أن يوفر هذا الملف

        console.log('5. كتابة الوصف (Caption)...');
        const textboxSelector = 'div[role="textbox"]';
        await page.waitForSelector(textboxSelector, { timeout: 60000 });
        await page.click(textboxSelector);
        await page.keyboard.type('تحية من نظام Kiro Zozo الذكي! 🚀 #Automation #FullStack');

        console.log('6. الضغط على "التالي" (Next) لتجاوز إعدادات التعديل...');
        const nextBtn = 'div[aria-label="التالي"], div[aria-label="Next"]';
        for(let i=0; i<2; i++) {
            await page.waitForSelector(nextBtn);
            await page.click(nextBtn);
            await new Promise(r => setTimeout(r, 3000));
        }

        console.log('7. الضغط على زر "نشر" (Share)...');
        const shareBtn = 'div[aria-label="نشر"], div[aria-label="Share"], div[aria-label="نشر الآن"]';
        await page.waitForSelector(shareBtn);
        await page.click(shareBtn);

        console.log('8. انتظار 20 ثانية لضمان إتمام الرفع...');
        await new Promise(r => setTimeout(r, 20000));
        await page.screenshot({ path: 'facebook-result.png', fullPage: true });
        console.log('✅ تمت المهمة بنجاح!');

    } catch (error) {
        console.error('❌ حدث خطأ:', error);
        await page.screenshot({ path: 'facebook-error.png' });
        throw error;
    } finally {
        await browser.close();
    }
}

run();
