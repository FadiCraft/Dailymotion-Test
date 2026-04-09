const { execSync } = require('child_process');

/**
 * وظيفة لاستخراج رابط الفيديو المباشر
 */
function getDirectLink(videoUrl) {
    try {
        console.log(`جارِ تحليل الرابط: ${videoUrl}`);
        
        // تشغيل yt-dlp لجلب الرابط المباشر
        // -g تعني جلب الرابط فقط
        const command = `yt-dlp -g -f "best" ${videoUrl}`;
        const directLink = execSync(command).toString().trim();
        
        return directLink;
    } catch (error) {
        console.error("خطأ في استخراج الرابط:", error.message);
        return null;
    }
}

// الرابط المراد اختباره (يمكنك تغييره أو جعله متغيراً)
const videoUrl = 'https://www.dailymotion.com/video/xa14x8k'; 

const result = getDirectLink(videoUrl);

if (result) {
    console.log("-----------------------------------------");
    console.log("✅ تم العثور على رابط التحميل المباشر:");
    console.log(result);
    console.log("-----------------------------------------");
}
