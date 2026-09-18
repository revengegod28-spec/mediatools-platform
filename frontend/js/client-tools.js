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
    },


    // ============================================
    // 4. تحسين جودة الصور (Client-Side Canvas Filter)
    // ============================================

    /**
     * Gaussian Blur على بيانات الصورة (لـ Unsharp Masking)
     */
    _gaussianBlur(imageData, radius) {
        const data = imageData.data;
        const w = imageData.width;
        const h = imageData.height;
        const out = new Uint8ClampedArray(data.length);

        // إنشاء Gaussian Kernel
        const ksize = Math.max(3, Math.ceil(radius * 3) | 1);
        const sigma = radius;
        const kernel = [];
        let sum = 0;
        const halfK = ksize >> 1;
        for (let i = 0; i < ksize; i++) {
            const x = i - halfK;
            const v = Math.exp(-(x * x) / (2 * sigma * sigma));
            kernel.push(v);
            sum += v;
        }
        for (let i = 0; i < ksize; i++) kernel[i] /= sum;

        // تمرير أفقي
        const temp = new Uint8ClampedArray(data.length);
        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                let r = 0, g = 0, b = 0, a = 0;
                for (let k = -halfK; k <= halfK; k++) {
                    const px = Math.min(w - 1, Math.max(0, x + k));
                    const idx = (y * w + px) * 4;
                    const wgt = kernel[k + halfK];
                    r += data[idx] * wgt;
                    g += data[idx + 1] * wgt;
                    b += data[idx + 2] * wgt;
                    a += data[idx + 3] * wgt;
                }
                const oi = (y * w + x) * 4;
                temp[oi] = r;
                temp[oi + 1] = g;
                temp[oi + 2] = b;
                temp[oi + 3] = a;
            }
        }
        // تمرير عمودي
        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                let r = 0, g = 0, b = 0, a = 0;
                for (let k = -halfK; k <= halfK; k++) {
                    const py = Math.min(h - 1, Math.max(0, y + k));
                    const idx = (py * w + x) * 4;
                    const wgt = kernel[k + halfK];
                    r += temp[idx] * wgt;
                    g += temp[idx + 1] * wgt;
                    b += temp[idx + 2] * wgt;
                    a += temp[idx + 3] * wgt;
                }
                const oi = (y * w + x) * 4;
                out[oi] = r;
                out[oi + 1] = g;
                out[oi + 2] = b;
                out[oi + 3] = a;
            }
        }
        return new ImageData(out, w, h);
    },

    /**
     * Unsharp Masking - زيادة حدة التفاصيل
     * @param {ImageData} imageData - بيانات الصورة
     * @param {number} amount - قوة التوضيح (0.5 - 3.0)
     * @param {number} radius - نصف القطر (0.5 - 3.0)
     */
    _unsharpMask(imageData, amount = 1.5, radius = 1.0) {
        const blurred = this._gaussianBlur(imageData, radius);
        const src = imageData.data;
        const blur = blurred.data;
        const out = new Uint8ClampedArray(src.length);

        for (let i = 0; i < src.length; i += 4) {
            // المعادلة: sharpened = original + (original - blurred) * amount
            out[i]     = Math.max(0, Math.min(255, src[i]     + (src[i]     - blur[i])     * amount));
            out[i + 1] = Math.max(0, Math.min(255, src[i + 1] + (src[i + 1] - blur[i + 1]) * amount));
            out[i + 2] = Math.max(0, Math.min(255, src[i + 2] + (src[i + 2] - blur[i + 2]) * amount));
            out[i + 3] = src[i + 3]; // Alpha
        }
        return new ImageData(out, imageData.width, imageData.height);
    },

    /**
     * Denoising بسيط عبر Median Filter (لتقليل الضوضاء مع الحفاظ على الحواف)
     */
    _denoise(imageData, strength = 2) {
        const src = imageData.data;
        const w = imageData.width;
        const h = imageData.height;
        const out = new Uint8ClampedArray(src.length);
        const r = Math.min(2, Math.max(1, Math.round(strength)));

        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                const channels = [[], [], []];
                for (let dy = -r; dy <= r; dy++) {
                    for (let dx = -r; dx <= r; dx++) {
                        const px = Math.min(w - 1, Math.max(0, x + dx));
                        const py = Math.min(h - 1, Math.max(0, y + dy));
                        const idx = (py * w + px) * 4;
                        channels[0].push(src[idx]);
                        channels[1].push(src[idx + 1]);
                        channels[2].push(src[idx + 2]);
                    }
                }
                const oi = (y * w + x) * 4;
                for (let c = 0; c < 3; c++) {
                    channels[c].sort((a, b) => a - b);
                    out[oi + c] = channels[c][channels[c].length >> 1];
                }
                out[oi + 3] = src[oi + 3];
            }
        }
        return new ImageData(out, w, h);
    },

    /**
     * تحسين جودة الصورة بالكامل (Client-Side)
     */
    async enhanceImage(file, options = {}) {
        const {
            sharpenAmount = 1.5,   // قوة التوضيح (0.5 - 3.0)
            sharpenRadius = 1.0,    // نصف القطر (0.5 - 3.0)
            denoiseStrength = 0,    // 0 = بدون، 1-2 = خفيف، 3 = قوي
            scale = 2,              // معامل التكبير (1, 2)
            outputFormat = 'PNG',   // PNG أو JPEG
            quality = 95            // للجودة عند JPEG
        } = options;

        const originalSize = file.size;
        const img = await this.loadImage(file);

        // 1. تطبيق التوضيح وإزالة الضوضاء على الصورة الأصلية
        const workCanvas = document.createElement('canvas');
        workCanvas.width = img.width;
        workCanvas.height = img.height;
        const workCtx = workCanvas.getContext('2d');
        workCtx.drawImage(img, 0, 0);
        let workData = workCtx.getImageData(0, 0, img.width, img.height);

        // إزالة الضوضاء أولاً (إن لزم)
        if (denoiseStrength > 0) {
            workData = this._denoise(workData, denoiseStrength);
        }

        // تطبيق التوضيح
        workData = this._unsharpMask(workData, sharpenAmount, sharpenRadius);

        // وضع النتيجة على canvas
        workCtx.putImageData(workData, 0, 0);

        // 2. التكبير (إن لزم)
        const finalCanvas = document.createElement('canvas');
        const finalCtx = finalCanvas.getContext('2d');

        if (scale > 1) {
            finalCanvas.width = img.width * scale;
            finalCanvas.height = img.height * scale;
            finalCtx.imageSmoothingEnabled = true;
            finalCtx.imageSmoothingQuality = 'high';
            finalCtx.drawImage(workCanvas, 0, 0, finalCanvas.width, finalCanvas.height);
        } else {
            finalCanvas.width = img.width;
            finalCanvas.height = img.height;
            finalCtx.drawImage(workCanvas, 0, 0);
        }

        // 3. تصدير
        const mimeType = outputFormat.toUpperCase() === 'JPEG' ? 'image/jpeg' : 'image/png';
        const ext = outputFormat.toUpperCase() === 'JPEG' ? 'jpg' : 'png';
        const blob = await this.canvasToBlob(finalCanvas, mimeType, quality / 100);

        return {
            blob,
            filename: `enhanced_${scale}x.${ext}`,
            stats: {
                originalSize,
                enhancedSize: blob.size,
                originalDims: { width: img.width, height: img.height },
                enhancedDims: { width: finalCanvas.width, height: finalCanvas.height }
            }
        };
    }
};

// تصدير للاستخدام العام
window.ClientTools = ClientTools;
