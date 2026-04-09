const { execSync } = require('child_process');
const fs = require('fs');

function downloadVideo(videoUrl) {
    try {
        console.log(`🚀 جاري محاولة معالجة الفيديو: ${videoUrl}`);
        const outputFilename = 'video_to_upload.mp4';

        /**
         * --user-agent: تجعل الطلب يبدو وكأنه من متصفح عادي.
         * --referer: تخبر الموقع أننا نفتح الفيديو من داخل موقعهم.
         * --no-check-certificate: لتجنب مشاكل شهادات SSL في بيئة GitHub.
         */
        const userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36";
        const command = `yt-dlp --user-agent "${userAgent}" --referer "https://www.dailymotion.com/" -f "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best" --no-check-certificate --merge-output-format mp4 -o "${outputFilename}" ${videoUrl}`;
        
        console.log("⏳ بدأت عملية التحميل... إذا استمر الخطأ 404 فالموقع يحظر خوادم جيت هاب.");
        execSync(command, { stdio: 'inherit' }); // ستظهر التفاصيل مباشرة في الـ Logs

        if (fs.existsSync(outputFilename)) {
            console.log(`✅ تم التحميل بنجاح: ${outputFilename}`);
            return outputFilename;
        }
    } catch (error) {
        console.error("❌ فشل التحميل. قد يكون الموقع حظر الـ IP الخاص بـ GitHub.");
        return null;
    }
}

const videoUrl = 'https://www.dailymotion.com/video/xa14x8k'; 
downloadVideo(videoUrl);
