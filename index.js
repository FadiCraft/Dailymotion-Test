const { execSync } = require('child_process');
const fs = require('fs');

function downloadVideo(videoUrl) {
    try {
        console.log(`🚀 محاولة التحميل باستخدام Headers متقدمة: ${videoUrl}`);
        const outputFilename = 'video_to_upload.mp4';

        // محاولة جلب الفيديو بجودة متوسطة لتجنب قيود الباندويث العالي على السيرفرات
        // أحياناً 'mp4' المباشر يعمل أفضل من 'hls' في بيئة السيرفرات
        const command = `yt-dlp \
            --no-check-certificate \
            --user-agent "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" \
            --add-header "Accept:text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8" \
            --add-header "Accept-Language:en-US,en;q=0.9" \
            -f "best[ext=mp4]/best" \
            -o "${outputFilename}" \
            ${videoUrl}`;
        
        console.log("⏳ جاري التحميل... إذا فشل هذا، فالموقع يحظر بروتوكول HLS عن GitHub تماماً.");
        
        execSync(command, { stdio: 'inherit' });

        if (fs.existsSync(outputFilename)) {
            console.log(`✅ نجح التحميل! الملف جاهز: ${outputFilename}`);
            return outputFilename;
        }
    } catch (error) {
        console.error("❌ لا يزال الموقع يرفض الاتصال من خادم GitHub.");
        return null;
    }
}

const videoUrl = 'https://www.dailymotion.com/video/xa14x8k'; 
downloadVideo(videoUrl);
