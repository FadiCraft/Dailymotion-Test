const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const axios = require('axios');

puppeteer.use(StealthPlugin());

// دالة تحميل الفيديو من رابط مباشر
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
    // يمكنك تغيير الرابط هنا لأي فيديو مباشر (Direct Link)
    const videoUrl = 'https://www.w3schools.com/html/mov_bbb.mp4'; 
    const videoPath = './video_temp.mp4';

    console.log('1. تجهيز الفيديو...');
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
    // ضبط الشاشة لتكون طويلة لضمان رؤية العناصر بالأسفل
    await page.setViewport({ width: 1280, height: 1600 });

    console.log('3. تحميل الكوكيز...');
    if (!process.env.FACEBOOK_COOKIES) throw new Error("FACEBOOK_COOKIES secret is missing!");
    const cookies = JSON.parse(process.env.FACEBOOK_COOKIES);
    await page.setCookie(...cookies);

    try {
        console.log('4. التوجه إلى Meta Business Suite...');
        await page.goto('https://business.facebook.com/latest/reels_composer', { 
            waitUntil: 'networkidle2', 
            timeout: 90000 
        });

        // --- تجاوز النوافذ المنبثقة الإرشادية ---
        try {
            console.log('فحص وجود نوافذ منبثقة...');
            const closeBtn = 'div[aria-label="إغلاق"], div[aria-label="Close"]';
            await page.waitForSelector(closeBtn, { timeout: 8000 });
            await page.click(closeBtn);
            console.log('✅ تم إغلاق النافذة المنبثقة.');
        } catch (e) {
            console.log('لا توجد نوافذ منبثقة، متابعة العمل...');
        }

        console.log('5. رفع ملف الفيديو...');
        const fileInput = await page.waitForSelector('input[type="file"]', { timeout: 60000 });
        await fileInput.uploadFile(videoPath);

        console.log('6. النزول وكتابة العنوان (Caption)...');
        const textboxSelector = 'div[role="textbox"]';
        await page.waitForSelector(textboxSelector, { timeout: 60000 });
        
        // سكرول للوصول لصندوق النص
        await page.evaluate((sel) => {
            const el = document.querySelector(sel);
            if(el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, textboxSelector);
        
        await new Promise(r => setTimeout(r, 2000));
        await page.click(textboxSelector);
        await page.keyboard.type('تم النشر آلياً بواسطة نظام Kiro Zozo 🚀 #Automation #Meta');

        console.log('7. الضغط على "التالي" (Next)...');
        const nextBtn = 'div[aria-label="التالي"], div[aria-label="Next"]';
        
        for(let i = 0; i < 2; i++) {
            await page.waitForSelector(nextBtn, { visible: true });
            // سكرول لزر التالي لضمان ظهوره
            await page.evaluate((sel) => {
                document.querySelector(sel).scrollIntoView({ block: 'center' });
            }, nextBtn);
            await page.click(nextBtn);
            await new Promise(r => setTimeout(r, 4000));
        }

        console.log('8. النشر النهائي...');
        const shareBtn = 'div[aria-label="نشر"], div[aria-label="Share"], div[aria-label="نشر الآن"]';
        await page.waitForSelector(shareBtn, { visible: true });
        await page.click(shareBtn);

        console.log('9. انتظار الرفع والتقاط صورة للنتيجة...');
        await new Promise(r => setTimeout(r, 30000)); // وقت إضافي للرفع
        
        await page.screenshot({ path: 'facebook-final-check.png', fullPage: true });
        console.log('✅ اكتملت المهمة بنجاح!');

    } catch (error) {
        console.error('❌ خطأ:', error);
        await page.screenshot({ path: 'facebook-error-log.png' });
        throw error;
    } finally {
        if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath);
        await browser.close();
    }
}

run().catch(err => {
    console.error(err);
    process.exit(1);
});
