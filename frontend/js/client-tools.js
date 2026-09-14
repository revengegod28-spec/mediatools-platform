/**
 * ============================================
 * Client-Side Image Tools
 * أدوات معالجة الصور داخل المتصفح باستخدام Canvas API
 *
 * المزايا:
 * - بدون أي طلب للسيرفر (لا تأخير، لا نوم)
 * - معالجة فورية (أقل من ثانية)
 * - تحكم كامل بالجودة والمقاسات
 * - يعمل حتى بدون اتصال بالإنترنت
 * ============================================
 */

const ClientTools = {

    // ============================================
    // أدوات مساعدة
    // ============================================

    /**
     * تحميل ملف كصورة HTMLImageElement
     */
    loadImage(file) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const url = URL.createObjectURL(file);

            img.onload = () => {
                URL.revokeObjectURL(url);
                resolve(img);
            };

            img.onerror = () => {
                URL.revokeObjectURL(url);
                reject(new Error('فشل تحميل الصورة'));
            };

            img.src = url;
        });
    },

    /**
     * تحويل canvas إلى Blob
     */
    canvasToBlob(canvas, type = 'image/jpeg', quality = 0.85) {
        return new Promise((resolve, reject) => {
            canvas.toBlob(
                (blob) => {
                    if (blob) resolve(blob);
                    else reject(new Error('فشل تحويل الصورة'));
                },
                type,
                quality
            );
        });
    },

    /**
     * تحميل blob كملف
     */
    downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 100);
    },

    /**
     * تنسيق حجم الملف
     */
    formatBytes(bytes) {
        if (bytes === 0) return '0 بايت';
        const k = 1024;
        const sizes = ['بايت', 'كيلوبايت', 'ميجابايت'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },


    // ============================================
    // 1. ضغط وتحويل الصور (Canvas API)
    // ============================================
    async compressImage(file, options = {}) {
        const {
            quality = 85,           // 1-100
            outputFormat = 'JPEG',  // JPEG, PNG, WEBP
            maxWidth = null,
            maxHeight = null,
            preserveTransparency = false
        } = options;

        const originalSize = file.size;
        const img = await this.loadImage(file);

        // إنشاء canvas
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // حساب الأبعاد الجديدة
        let { width, height } = img;

        if (maxWidth || maxHeight) {
            const ratio = width / height;
            if (maxWidth && width > maxWidth) {
                width = maxWidth;
                height = Math.round(width / ratio);
            }
            if (maxHeight && height > maxHeight) {
                height = maxHeight;
                width = Math.round(height * ratio);
            }
        }

        canvas.width = width;
        canvas.height = height;

        // رسم الصورة
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // تحديد MIME type
        let mimeType, ext;
        const normalizedFormat = outputFormat.toUpperCase();

        if (normalizedFormat === 'PNG') {
            mimeType = 'image/png';
            ext = 'png';
        } else if (normalizedFormat === 'WEBP') {
            // التحقق من دعم WebP في المتصفح
            const canvasWebP = document.createElement('canvas');
            canvasWebP.width = 1;
            canvasWebP.height = 1;
            const isWebPSupported = canvasWebP.toDataURL('image/webp').indexOf('data:image/webp') === 0;

            if (isWebPSupported) {
                mimeType = 'image/webp';
                ext = 'webp';
            } else {
                // fallback إلى JPEG
                mimeType = 'image/jpeg';
                ext = 'jpg';
            }
        } else {
            // JPEG
            // إذا كانت الصورة شفافة، أضف خلفية بيضاء
            if (!preserveTransparency && this.hasTransparency(img)) {
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = canvas.width;
                tempCanvas.height = canvas.height;
                const tempCtx = tempCanvas.getContext('2d');
                tempCtx.fillStyle = '#FFFFFF';
                tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
                tempCtx.drawImage(canvas, 0, 0);
                canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
                canvas.getContext('2d').drawImage(tempCanvas, 0, 0);
            }
            mimeType = 'image/jpeg';
            ext = 'jpg';
        }

        const qualityNormalized = quality / 100;
        const blob = await this.canvasToBlob(canvas, mimeType, qualityNormalized);

        return {
            blob,
            filename: `compressed_${quality}q.${ext}`,
            stats: {
                originalSize,
                compressedSize: blob.size,
                compressionRatio: ((1 - blob.size / originalSize) * 100).toFixed(2),
                savingsKB: ((originalSize - blob.size) / 1024).toFixed(2),
                originalFormat: file.type.split('/')[1].toUpperCase(),
                outputFormat: mimeType.split('/')[1].toUpperCase(),
                dimensions: { width, height }
            }
        };
    },

    /**
     * فحص ما إذا كانت الصورة تحتوي على شفافية
     */
    hasTransparency(img) {
        if (img.naturalWidth === 0) return false;
        // طريقة مبسطة: افحص الزوايا
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        try {
            const data = ctx.getImageData(0, 0, 1, 1).data;
            return data[3] < 255;
        } catch {
            return false;
        }
    },


    // ============================================
    // 2. تعديل المقاسات (Canvas API)
    // ============================================

    /**
     * تعديل المقاس لمقاس منصة تواصل
     */
    async resizeForPlatform(file, platform, options = {}) {
        const {
            fitMode = 'cover',       // cover, contain, stretch
            backgroundColor = '#FFFFFF'
        } = options;

        const PLATFORM_SIZES = {
            // Instagram
            instagram_square: { width: 1080, height: 1080, name: 'Instagram Post' },
            instagram_portrait: { width: 1080, height: 1350, name: 'Instagram Portrait' },
            instagram_story: { width: 1080, height: 1920, name: 'Instagram Story/Reels' },
            // Facebook
            facebook_post: { width: 1200, height: 630, name: 'Facebook Post' },
            facebook_story: { width: 1080, height: 1920, name: 'Facebook Story' },
            facebook_cover: { width: 820, height: 312, name: 'Facebook Cover' },
            // Twitter
            twitter_post: { width: 1200, height: 675, name: 'Twitter Post' },
            twitter_header: { width: 1500, height: 500, name: 'Twitter Header' },
            // YouTube
            youtube_thumbnail: { width: 1280, height: 720, name: 'YouTube Thumbnail' },
            // LinkedIn
            linkedin_post: { width: 1200, height: 627, name: 'LinkedIn Post' },
            linkedin_cover: { width: 1584, height: 396, name: 'LinkedIn Cover' },
            // TikTok
            tiktok_video: { width: 1080, height: 1920, name: 'TikTok Video' },
            // Pinterest
            pinterest_pin: { width: 1000, height: 1500, name: 'Pinterest Pin' },
            // WhatsApp
            whatsapp_status: { width: 1080, height: 1920, name: 'WhatsApp Status' },
        };

        const target = PLATFORM_SIZES[platform];
        if (!target) throw new Error('منصة غير مدعومة');

        return await this.resizeCustom(file, target.width, target.height, {
            fitMode,
            backgroundColor,
            filename: `${platform}.jpg`
        });
    },

    /**
     * تعديل مقاس مخصص
     */
    async resizeCustom(file, width, height, options = {}) {
        const {
            fitMode = 'cover',
            backgroundColor = '#FFFFFF',
            filename = `${width}x${height}.jpg`,
            outputFormat = 'JPEG',
            quality = 92
        } = options;

        const img = await this.loadImage(file);
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        // ملء الخلفية
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, width, height);

        // حساب الأبعاد
        let drawW, drawH, offsetX = 0, offsetY = 0;
        const srcRatio = img.width / img.height;
        const dstRatio = width / height;

        if (fitMode === 'stretch') {
            drawW = width;
            drawH = height;
        } else if (fitMode === 'contain') {
            if (srcRatio > dstRatio) {
                drawW = width;
                drawH = Math.round(width / srcRatio);
            } else {
                drawH = height;
                drawW = Math.round(height * srcRatio);
            }
            offsetX = (width - drawW) / 2;
            offsetY = (height - drawH) / 2;
        } else {
            // cover (الافتراضي)
            if (srcRatio > dstRatio) {
                drawH = height;
                drawW = Math.round(height * srcRatio);
            } else {
                drawW = width;
                drawH = Math.round(width / srcRatio);
            }
            offsetX = (width - drawW) / 2;
            offsetY = (height - drawH) / 2;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, offsetX, offsetY, drawW, drawH);

        const mimeType = outputFormat === 'PNG' ? 'image/png' :
                        outputFormat === 'WEBP' ? 'image/webp' : 'image/jpeg';
        const blob = await this.canvasToBlob(canvas, mimeType, quality / 100);

        return {
            blob,
            filename,
            dimensions: { width, height }
        };
    },


    // ============================================
    // 3. العلامة المائية (Canvas API)
    // ============================================

    /**
     * إضافة علامة مائية نصية
     */
    async addTextWatermark(file, options = {}) {
        const {
            text = '© MediaTools',
            position = 'bottom-right',  // top-left, top-right, bottom-left, bottom-right, center
            opacity = 0.5,                // 0.1 - 1.0
            fontSizeRatio = 0.05,         // نسبة لارتفاع الصورة
            color = '#FFFFFF',
            shadowColor = '#000000',
            useShadow = true
        } = options;

        const img = await this.loadImage(file);
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');

        // رسم الصورة
        ctx.drawImage(img, 0, 0);

        // إعداد النص
        const fontSize = Math.max(20, Math.round(img.height * fontSizeRatio));
        ctx.font = `bold ${fontSize}px Arial, sans-serif`;
        ctx.textBaseline = 'middle';
        ctx.globalAlpha = opacity;

        // قياس النص
        const metrics = ctx.measureText(text);
        const textWidth = metrics.width;
        const textHeight = fontSize;

        // تحديد الموقع
        const margin = Math.max(20, Math.round(img.height * 0.02));
        const positions = {
            'top-left': { x: margin, y: margin + textHeight / 2 },
            'top-right': { x: img.width - textWidth - margin, y: margin + textHeight / 2 },
            'bottom-left': { x: margin, y: img.height - margin - textHeight / 2 },
            'bottom-right': { x: img.width - textWidth - margin, y: img.height - margin - textHeight / 2 },
            'center': { x: (img.width - textWidth) / 2, y: img.height / 2 }
        };
        const pos = positions[position] || positions['bottom-right'];

        // رسم الظل أولاً
        if (useShadow) {
            ctx.fillStyle = shadowColor;
            ctx.fillText(text, pos.x + 2, pos.y + 2);
        }

        // رسم النص
        ctx.fillStyle = color;
        ctx.fillText(text, pos.x, pos.y);

        ctx.globalAlpha = 1.0;

        const blob = await this.canvasToBlob(canvas, 'image/jpeg', 0.92);

        return {
            blob,
            filename: 'watermarked.jpg'
        };
    },

    /**
     * إضافة علامة مائية صورية (شعار)
     */
    async addImageWatermark(file, watermarkFile, options = {}) {
        const {
            position = 'bottom-right',
            opacity = 0.5,
            scale = 0.15    // نسبة لعرض الصورة
        } = options;

        const [img, wmImg] = await Promise.all([
            this.loadImage(file),
            this.loadImage(watermarkFile)
        ]);

        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');

        // رسم الصورة الأساسية
        ctx.drawImage(img, 0, 0);

        // حساب حجم العلامة المائية
        const wmWidth = Math.round(img.width * scale);
        const wmHeight = Math.round(wmImg.height * (wmWidth / wmImg.width));

        // رسم العلامة المائية مع الشفافية
        ctx.globalAlpha = opacity;

        const margin = Math.max(20, Math.round(img.height * 0.02));
        const positions = {
            'top-left': { x: margin, y: margin },
            'top-right': { x: img.width - wmWidth - margin, y: margin },
            'bottom-left': { x: margin, y: img.height - wmHeight - margin },
            'bottom-right': { x: img.width - wmWidth - margin, y: img.height - wmHeight - margin },
            'center': { x: (img.width - wmWidth) / 2, y: (img.height - wmHeight) / 2 }
        };
        const pos = positions[position] || positions['bottom-right'];

        ctx.drawImage(wmImg, pos.x, pos.y, wmWidth, wmHeight);
        ctx.globalAlpha = 1.0;

        // إذا كانت العلامة المائية PNG شفافة، نحفظ كـ PNG
        const outputFormat = watermarkFile.type === 'image/png' ? 'image/png' : 'image/jpeg';
        const quality = outputFormat === 'image/png' ? undefined : 0.92;
        const blob = await this.canvasToBlob(canvas, outputFormat, quality);

        return {
            blob,
            filename: 'watermarked.' + (outputFormat === 'image/png' ? 'png' : 'jpg')
        };
    }
};

// تصدير للاستخدام العام
window.ClientTools = ClientTools;
