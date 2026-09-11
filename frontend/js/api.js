/**
 * ============================================
 * API Client - العميل للتواصل مع الـ Backend
 * ============================================
 */

const API_BASE_URL = window.API_BASE_URL || (
    window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:8000'
        : 'https://revengegod28-mediatools-api.onrender.com'
);

const API_PREFIX = '/api/v1';

class ApiClient {
    constructor(baseUrl = API_BASE_URL) {
        this.baseUrl = baseUrl;
        this.prefix = API_PREFIX;
    }

    /**
     * دالة عامة لإرسال طلب ومعالجة الاستجابة
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${this.prefix}${endpoint}`;
        try {
            const response = await fetch(url, options);

            if (!response.ok) {
                let errorMessage = `خطأ ${response.status}`;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.detail || errorData.message || errorMessage;
                } catch (e) {
                    errorMessage = response.statusText || errorMessage;
                }
                throw new ApiError(errorMessage, response.status);
            }

            // التحقق من نوع الاستجابة
            const contentType = response.headers.get('content-type') || '';

            if (contentType.includes('application/json')) {
                return await response.json();
            }

            // إرجاع blob للصور
            return {
                blob: await response.blob(),
                headers: this._extractHeaders(response)
            };
        } catch (error) {
            if (error instanceof ApiError) throw error;
            throw new ApiError(
                'تعذر الاتصال بالخادم. تحقق من اتصال الإنترنت وحاول مجدداً.',
                0
            );
        }
    }

    _extractHeaders(response) {
        const headers = {};
        ['X-Original-Size', 'X-Compressed-Size', 'X-Compression-Ratio',
         'X-Savings-KB', 'X-Platform', 'X-Width', 'X-Height',
         'X-Method', 'X-Template-ID'].forEach(name => {
            const value = response.headers.get(name);
            if (value) headers[name] = value;
        });
        return headers;
    }

    /**
     * ضغط وتحويل الصور
     */
    async compressImage(file, options = {}) {
        const {
            quality = 85,
            outputFormat = 'JPEG',
            maxWidth,
            maxHeight
        } = options;

        const formData = new FormData();
        formData.append('file', file);

        const params = new URLSearchParams({
            quality,
            output_format: outputFormat
        });
        if (maxWidth) params.append('max_width', maxWidth);
        if (maxHeight) params.append('max_height', maxHeight);

        return this.request(`/compress?${params}`, {
            method: 'POST',
            body: formData
        });
    }

    /**
     * تعديل المقاس لمنصة معينة
     */
    async resizeForPlatform(file, platform, options = {}) {
        const {
            fitMode = 'cover',
            backgroundColor = '#FFFFFF'
        } = options;

        const formData = new FormData();
        formData.append('file', file);

        const params = new URLSearchParams({
            platform,
            fit_mode: fitMode,
            background_color: backgroundColor
        });

        return this.request(`/resize?${params}`, {
            method: 'POST',
            body: formData
        });
    }

    /**
     * تعديل مقاس مخصص
     */
    async resizeCustom(file, width, height, options = {}) {
        const {
            fitMode = 'cover',
            backgroundColor = '#FFFFFF'
        } = options;

        const formData = new FormData();
        formData.append('file', file);

        const params = new URLSearchParams({
            width,
            height,
            fit_mode: fitMode,
            background_color: backgroundColor
        });

        return this.request(`/resize/custom?${params}`, {
            method: 'POST',
            body: formData
        });
    }

    /**
     * توليد قالب إخباري
     */
    async generateTemplate(templateId, headline, options = {}) {
        const {
            subheadline = '',
            logoFile = null,
            backgroundFile = null
        } = options;

        const formData = new FormData();
        formData.append('headline', headline);
        formData.append('subheadline', subheadline);
        if (logoFile) formData.append('logo', logoFile);
        if (backgroundFile) formData.append('background_image', backgroundFile);

        return this.request(`/template?template_id=${templateId}`, {
            method: 'POST',
            body: formData
        });
    }

    /**
     * إضافة علامة مائية
     */
    async addWatermark(file, options = {}) {
        const {
            text = '',
            imageFile = null,
            position = 'bottom-right',
            opacity = 0.5,
            scale = 0.15,
            color = '#FFFFFF'
        } = options;

        const formData = new FormData();
        formData.append('file', file);
        if (text) formData.append('watermark_text', text);
        if (imageFile) formData.append('watermark_image', imageFile);

        const params = new URLSearchParams({
            position,
            opacity,
            scale,
            color
        });

        return this.request(`/watermark?${params}`, {
            method: 'POST',
            body: formData
        });
    }

    /**
     * تفريغ الخلفية
     */
    async removeBackground(file, options = {}) {
        const {
            method = 'auto',
            threshold = 240
        } = options;

        const formData = new FormData();
        formData.append('file', file);

        const params = new URLSearchParams({
            method,
            threshold
        });

        return this.request(`/background/remove?${params}`, {
            method: 'POST',
            body: formData
        });
    }

    /**
     * جلب البيانات الوصفية
     */
    async getPlatforms() {
        return this.request('/resize/platforms');
    }

    async getTemplates() {
        return this.request('/template/list');
    }

    async getFormats() {
        return this.request('/compress/formats');
    }

    async getWatermarkPositions() {
        return this.request('/watermark/positions');
    }

    async getBackgroundMethods() {
        return this.request('/background/methods');
    }

    /**
     * تحميل Blob كملف
     */
    static downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 100);
    }
}

class ApiError extends Error {
    constructor(message, status) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
    }
}

// تصدير للاستخدام العام
window.apiClient = new ApiClient();
window.ApiClient = ApiClient;
window.ApiError = ApiError;
