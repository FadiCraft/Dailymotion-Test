const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const axios = require('axios');

puppeteer.use(StealthPlugin());

async function downloadVideo(url, path) {
    const writer = fs.createWriteStream(path);
    const response = await axios({ url, method: 'GET', responseType: 'stream' });
    response.data.pipe(writer);
    return new Promise((resolve) => writer.on('finish', resolve));
}

async function run() {
    const videoUrl = 'https://www.w3schools.com/html/mov_bbb.mp4'; 
    const videoPath = './video_temp.mp4';
    await downloadVideo(videoUrl, videoPath);

    const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 1800 });

    const cookies = JSON.parse(process.env.FACEBOOK_COOKIES);
    await page.setCookie(...cookies);

    try {
        console.log('1. التوجه للموقع...');
        await page.goto('https://business.facebook.com/latest/reels_composer', { waitUntil: 'networkidle2' });

        try { await page.click('div[aria-label="إغلاق"], div[aria-label="Close"]'); } catch (e) {}

        console.log('2. فتح قائمة الرفع واختيار "تحميل من كمبيوتر"...');
        // بناءً على الـ HTML اللي بعته، رح نستخدم FileChooser ونضغط على القائمة برمجياً
        const [fileChooser] = await Promise.all([
            page.waitForFileChooser({ timeout: 60000 }),
            page.evaluate(async () => {
                // 1. نضغط على زر "إضافة فيديو" لفتح القائمة
                const buttons = Array.from(document.querySelectorAll('div[role="button"]'));
                const addBtn = buttons.find(el => el.innerText.includes('إضافة فيديو'));
                if (addBtn) addBtn.click();
                
                // انتظار ثانية لفتح الـ menu
                await new Promise(r => setTimeout(r, 1000));
                
                // 2. نبحث عن عنصر "تحميل من كمبيوتر" بناءً على الكود تبعك
                const menuItems = Array.from(document.querySelectorAll('[role="menuitem"]'));
                const uploadItem = menuItems.find(el => el.innerText.includes('تحميل من كمبيوتر'));
                if (uploadItem) uploadItem.click();
            })
        ]);
        await fileChooser.accept([videoPath]);

        console.log('3. كتابة الوصف...');
        const textbox = 'div[role="textbox"], [contenteditable="true"]';
        await page.waitForSelector(textbox, { timeout: 60000 });
        await page.evaluate((el) => document.querySelector(el).scrollIntoView(), textbox);
        await page.click(textbox);
        await page.keyboard.type('تم النشر بنجاح عبر نظام Kiro Zozo 🚀');

        console.log('4. التنقل عبر أزرار التالي (Next)...');
        for (let i = 0; i < 2; i++) {
            await page.waitForTimeout(5000); 
            await page.evaluate(() => {
                const buttons = Array.from(document.querySelectorAll('div[role="button"]'));
                const next = buttons.find(b => b.innerText.includes('التالي'));
                // نتأكد إن زر التالي مش disabled
                if (next && next.getAttribute('aria-disabled') !== 'true') next.click();
            });
        }

        console.log('5. انتظار تفعيل زر النشر (aria-disabled="false")...');
        // بناءً على كودك، يجب أن ننتظر حتى يختفي aria-disabled="true"
        await page.waitForFunction(() => {
            const buttons = Array.from(document.querySelectorAll('div[role="button"]'));
            const shareBtn = buttons.find(b => b.innerText === 'نشر' || b.innerText.includes('نشر'));
            if (!shareBtn) return false;
            
            // نتحقق إذا كان الزر لا يزال معطلاً
            const isDisabled = shareBtn.getAttribute('aria-disabled') === 'true';
            return !isDisabled; // نرجع true فقط لما يصير الزر مفعل
        }, { timeout: 120000 }); // أعطيناه وقت إضافي (دقيقتين) لمعالجة الفيديو

        console.log('6. الضغط على زر النشر النهائي...');
        await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('div[role="button"]'));
            const shareBtn = buttons.find(b => b.innerText === 'نشر' || b.innerText.includes('نشر'));
            if (shareBtn) shareBtn.click();
        });

        await new Promise(r => setTimeout(r, 20000));
        await page.screenshot({ path: 'facebook-final-check.png', fullPage: true });
        console.log('✅ اكتملت العملية بنجاح!');

    } catch (error) {
        await page.screenshot({ path: 'facebook-error-log.png', fullPage: true });
        console.error('❌ خطأ:', error);
    } finally {
        if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath);
        await browser.close();
    }
}

run();
