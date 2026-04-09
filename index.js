const { execSync } = require('child_process');
const fs = require('fs');

function downloadVideo(videoUrl) {
    try {
        console.log(`🚀 جاري معالجة الفيديو: ${videoUrl}`);
        
        // اسم الملف الذي سيتم حفظه
        const outputFilename = 'video_to_upload.mp4';

        // استخدام yt-dlp لتحميل ودمج الفيديو في ملف mp4 واحد
        // --merge-output-format mp4 تضمن أن النتيجة ملف واحد قابل للرفع
        const command = `yt-dlp -f "bestvideo+bestaudio/best" --merge-output-format mp4 -o "${outputFilename}" ${videoUrl}`;
        
        console.log("⏳ بدأت عملية التحميل والدمج (قد تستغرق دقيقة)...");
        execSync(command);

        if (fs.existsSync(outputFilename)) {
            console.log(`✅ تم التحميل بنجاح! اسم الملف: ${outputFilename}`);
            return outputFilename;
        }
    } catch (error) {
        console.error("❌ فشل التحميل:", error.message);
        return null;
    }
}

const videoUrl = 'https://www.dailymotion.com/video/xa14x8k'; 
downloadVideo(videoUrl);
