const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const axios = require('axios');

puppeteer.use(StealthPlugin());

// دالة لتحميل الفيديو من الرابط المباشر
async function downloadVideo(url, path) {
    console.log(`📥 جاري تحميل الفيديو من: ${url}`);
    const writer = fs.createWriteStream(path);
    const response = await axios({
        url,
        method: 'GET',
        responseType: 'stream'
    });
    response.data.pipe(writer);
    return new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
    });
}

async function run() {
    const videoUrl = 'https://www.w3schools.com/html/mov_bbb.mp4'; // رابط فيديو تجريبي مباشر
    const videoPath = './video_temp.mp4';

    console.log('1. البدء في تجهيز الفيديو...');
    await downloadVideo(videoUrl, videoPath);

    console.log('2. تشغيل المتصفح...');
    const browser = await puppeteer.launch({
        headless: "new",
        args: [
            '--no-sandbox', 
            '--disable-setuid-sandbox', 
            '--disable-dev-shm-usage',
            '--disable-blink-features=AutomationControlled'
        ]
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 1024 });

    console.log('3. تحميل كوكيز فيسبوك...');
    if (!process.env.FACEBOOK_COOKIES) throw new Error("FACEBOOK_COOKIES secret is missing!");
    const cookies = JSON.parse(process.env.FACEBOOK_COOKIES);
    await page.setCookie(...cookies);

    try {
        console.log('4. التوجه إلى Meta Business Suite (Reels)...');
        await page.goto('https://business.facebook.com/latest/reels_composer', { 
            waitUntil: 'networkidle2', 
            timeout: 90000 
        });

        console.log('5. رفع ملف الفيديو المحمل...');
        const fileInput = await page.waitForSelector('input[type="file"]', { timeout: 60000 });
        await fileInput.uploadFile(videoPath);

        console.log('6. كتابة الوصف...');
        const textboxSelector = 'div[role="textbox"]';
        await page.waitForSelector(textboxSelector, { timeout: 60000 });
        await page.click(textboxSelector);
        await page.keyboard.type('تجربة النشر التلقائي عبر نظام Kiro Zozo 🚀 #Facebook_Automation');

        console.log('7. تجاوز مراحل الإعداد (التالي)...');
        const nextBtn = 'div[aria-label="التالي"], div[aria-label="Next"]';
        for(let i=0; i<2; i++) {
            await page.waitForSelector(nextBtn, { visible: true });
            await page.click(nextBtn);
            await new Promise(r => setTimeout(r, 4000)); // انتظار بسيط لمعالجة الواجهة
        }

        console.log('8. الضغط على زر النشر النهائي...');
        const shareBtn = 'div[aria-label="نشر"], div[aria-label="Share"], div[aria-label="نشر الآن"]';
        await page.waitForSelector(shareBtn, { visible: true });
        await page.click(shareBtn);

        console.log('9. انتظار التأكيد النهائي...');
        await new Promise(r => setTimeout(r, 25000)); // وقت كافٍ للرفع الفعلي
        
        await page.screenshot({ path: 'facebook-final-check.png', fullPage: true });
        console.log('📸 تم حفظ لقطة شاشة للنتيجة النهائية.');
        console.log('✅ اكتملت العملية بنجاح!');

    } catch (error) {
        console.error('❌ حدث خطأ أثناء التنفيذ:', error);
        await page.screenshot({ path: 'facebook-error-log.png' });
        throw error;
    } finally {
        // حذف الفيديو المؤقت لتوفير المساحة
        if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath);
        await browser.close();
    }
}

run().catch(err => {
    console.error(err);
    process.exit(1);
});
