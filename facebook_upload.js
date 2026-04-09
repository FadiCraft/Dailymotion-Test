const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const axios = require('axios');

puppeteer.use(StealthPlugin());

async function downloadVideo(url, path) {
    console.log(`📥 جاري تحميل الفيديو تجريبياً: ${url}`);
    const writer = fs.createWriteStream(path);
    const response = await axios({ url, method: 'GET', responseType: 'stream' });
    response.data.pipe(writer);
    return new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
    });
}

async function run() {
    const videoUrl = 'https://www.w3schools.com/html/mov_bbb.mp4'; 
    const videoPath = './video_temp.mp4';

    await downloadVideo(videoUrl, videoPath);

    const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });

    const page = await browser.newPage();
    // ضبط دقة الشاشة لتكون طويلة جداً لضمان ظهور كل العناصر
    await page.setViewport({ width: 1280, height: 1800 });

    console.log('1. تحميل الكوكيز...');
    const cookies = JSON.parse(process.env.FACEBOOK_COOKIES);
    await page.setCookie(...cookies);

    try {
        console.log('2. التوجه إلى Meta Business Suite...');
        await page.goto('https://business.facebook.com/latest/reels_composer', { 
            waitUntil: 'networkidle2', 
            timeout: 90000 
        });

        // تجاوز النوافذ المنبثقة
        try {
            const closeBtn = 'div[aria-label="إغلاق"], div[aria-label="Close"], div[role="button"] i.x17z845u';
            await page.waitForSelector(closeBtn, { timeout: 10000 });
            await page.click(closeBtn);
            console.log('✅ تم إغلاق النافذة المنبثقة.');
        } catch (e) { console.log('لا توجد نوافذ منبثقة.'); }

        console.log('3. رفع ملف الفيديو...');
        const fileInput = await page.waitForSelector('input[type="file"]', { timeout: 60000 });
        await fileInput.uploadFile(videoPath);
        
        console.log('⏳ انتظار معالجة الفيديو من قبل فيسبوك...');
        // ننتظر حتى يختفي نص "إضافة فيديو" لنتأكد أن الرفع بدأ
        await page.waitForFunction(() => {
            return !document.body.innerText.includes('إضافة فيديو') && 
                   !document.body.innerText.includes('Add Video');
        }, { timeout: 60000 }).catch(() => console.log('تأخرت المعالجة، سنكمل المحاولة...'));

        console.log('4. كتابة العنوان (Caption)...');
        const textboxSelector = 'div[role="textbox"]';
        await page.waitForSelector(textboxSelector, { timeout: 60000 });
        
        // سكرول لصندوق النص
        await page.evaluate((sel) => {
            document.querySelector(sel).scrollIntoView({ behavior: 'instant', block: 'center' });
        }, textboxSelector);
        
        await new Promise(r => setTimeout(r, 2000));
        await page.click(textboxSelector);
        await page.keyboard.type('تم النشر بنجاح من نظام Kiro Zozo المتطور 🚀 #FullStack #Facebook_Automation');

        console.log('5. الضغط على أزرار "التالي"...');
        const nextBtn = 'div[aria-label="التالي"], div[aria-label="Next"]';
        
        for(let i = 0; i < 2; i++) {
            await page.waitForSelector(nextBtn, { visible: true });
            await page.evaluate((sel) => {
                document.querySelector(sel).scrollIntoView({ block: 'center' });
            }, nextBtn);
            await page.click(nextBtn);
            console.log(`تم ضغط زر التالي ${i+1}`);
            await new Promise(r => setTimeout(r, 5000));
        }

        console.log('6. النشر النهائي...');
        const shareBtn = 'div[aria-label="نشر"], div[aria-label="Share"], div[aria-label="نشر الآن"]';
        await page.waitForSelector(shareBtn, { visible: true });
        await page.click(shareBtn);

        console.log('7. انتظار اكتمال المهمة...');
        await new Promise(r => setTimeout(r, 30000)); 
        
        await page.screenshot({ path: 'facebook-final-check.png', fullPage: true });
        console.log('✅ تم النشر بنجاح!');

    } catch (error) {
        console.error('❌ حدث خطأ:', error);
        await page.screenshot({ path: 'facebook-error-log.png' });
        throw error;
    } finally {
        if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath);
        await browser.close();
    }
}

run().catch(err => { console.error(err); process.exit(1); });
