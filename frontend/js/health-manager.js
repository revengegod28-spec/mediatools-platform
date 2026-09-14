/**
 * ============================================
 * Server Health Manager
 * إدارة حالة السيرفر وكشف الصحوة من النوم
 * ============================================
 */

const HealthManager = {
    // الإعدادات
    config: {
        // وقت انتظار طلب الـ health قبل اعتباره فاشلاً
        healthCheckTimeout: 8000,
        // عدد المحاولات قبل اعتبار السيرفر غير متاح
        maxRetries: 3,
        // الفترة بين المحاولات (ms)
        retryDelay: 3000,
        // أطول مدة لانتظار طلب ثقيل (مثل توليد قالب)
        requestTimeout: 90000,  // 90 ثانية للسماح بصحوة Render
        // الفترة بين فحوصات تلقائية (ms)
        periodicCheckInterval: 0,  // معطّل افتراضياً
    },

    // الحالة
    state: {
        isAwake: false,
        lastCheck: 0,
        isChecking: false,
        wakeupInProgress: false,
        serverInfo: null
    },

    // المراقبون (callbacks)
    listeners: new Set(),

    /**
     * الاشتراك في تغييرات الحالة
     */
    onChange(callback) {
        this.listeners.add(callback);
        return () => this.listeners.delete(callback);
    },

    /**
     * إخطار المراقبين بتغيير الحالة
     */
    notify(event, data) {
        this.listeners.forEach(cb => {
            try {
                cb(event, data);
            } catch (e) {
                console.error('Health listener error:', e);
            }
        });
    },

    /**
     * تحديث الحالة وإخطار المراقبين
     */
    updateState(updates) {
        this.state = { ...this.state, ...updates };
        this.notify('state-changed', this.state);
    },

    /**
     * فحص سريع للسيرفر (مهلة 8 ثوانٍ)
     */
    async ping() {
        const url = `${API_BASE_URL}${API_PREFIX}/ping`;

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.config.healthCheckTimeout);

            const response = await fetch(url, {
                method: 'GET',
                signal: controller.signal,
                cache: 'no-store',
                headers: { 'Cache-Control': 'no-cache' }
            });

            clearTimeout(timeoutId);

            if (response.ok) {
                this.updateState({ isAwake: true, lastCheck: Date.now() });
                return { awake: true, responseTime: Date.now() - this.state.lastCheck };
            }

            return { awake: false, status: response.status };
        } catch (error) {
            if (error.name === 'AbortError') {
                return { awake: false, reason: 'timeout' };
            }
            return { awake: false, reason: error.message };
        }
    },

    /**
     * فحص شامل (مهلة أطول - 60 ثانية للسماح بصحوة Render)
     */
    async wakeUp(onProgress) {
        if (this.state.wakeupInProgress) {
            // انتظار الصحوة الجارية
            return new Promise((resolve) => {
                const unsubscribe = this.onChange((event, state) => {
                    if (event === 'wakeup-complete') {
                        unsubscribe();
                        resolve(state.isAwake);
                    }
                });
            });
        }

        this.updateState({ wakeupInProgress: true });
        this.notify('wakeup-started', null);

        for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
            if (onProgress) {
                onProgress({ attempt, max: this.config.maxRetries });
            }

            const result = await this.ping();

            if (result.awake) {
                // جلب معلومات إضافية
                try {
                    const infoUrl = `${API_BASE_URL}${API_PREFIX}/health`;
                    const infoResponse = await fetch(infoUrl, { cache: 'no-store' });
                    if (infoResponse.ok) {
                        this.updateState({ serverInfo: await infoResponse.json() });
                    }
                } catch (e) {
                    // ignore
                }

                this.updateState({ wakeupInProgress: false });
                this.notify('wakeup-complete', { success: true });
                return true;
            }

            // انتظار قبل المحاولة التالية
            if (attempt < this.config.maxRetries) {
                await new Promise(r => setTimeout(r, this.config.retryDelay));
            }
        }

        this.updateState({ wakeupInProgress: false });
        this.notify('wakeup-complete', { success: false });
        return false;
    },

    /**
     * إرسال طلب للسيرفر مع timeout طويل + إعادة محاولة تلقائية عند النوم
     */
    async request(endpoint, options = {}) {
        const url = `${API_BASE_URL}${API_PREFIX}${endpoint}`;

        // تكوين fetch مع timeout طويل
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.requestTimeout);

        const fetchOptions = {
            ...options,
            signal: controller.signal,
            cache: 'no-store',
            headers: {
                ...(options.headers || {}),
                'Cache-Control': 'no-cache'
            }
        };

        try {
            const response = await fetch(url, fetchOptions);
            clearTimeout(timeoutId);
            this.updateState({ isAwake: true, lastCheck: Date.now() });

            if (!response.ok) {
                let errorMsg = `خطأ ${response.status}`;
                try {
                    const errData = await response.json();
                    errorMsg = errData.detail || errData.message || errorMsg;
                } catch (e) {}
                throw new Error(errorMsg);
            }

            return response;
        } catch (error) {
            clearTimeout(timeoutId);

            // إذا كان timeout أو network error، قد يكون السيرفر نائم
            if (error.name === 'AbortError') {
                // محاولة الصحوة ثم إعادة المحاولة مرة واحدة
                this.notify('wakeup-needed', { reason: 'timeout' });

                const wokeUp = await this.wakeUp();
                if (wokeUp) {
                    // إعادة المحاولة
                    return this.request(endpoint, options);
                }
            }

            throw error;
        }
    },

    /**
     * فحص أولي عند تحميل الصفحة
     */
    async initialCheck() {
        // لا نمنع الـ UI من التحميل - نفحص في الخلفية
        this.ping().then(result => {
            if (!result.awake) {
                this.updateState({ isAwake: false });
            }
        });
    },

    /**
     * بدء الفحص الدوري (اختياري - لإبقاء السيرفر مستيقظاً)
     */
    startPeriodicCheck(intervalMinutes = 14) {
        if (this.config.periodicCheckInterval) {
            clearInterval(this.config.periodicCheckInterval);
        }
        this.config.periodicCheckInterval = setInterval(() => {
            this.ping();
        }, intervalMinutes * 60 * 1000);
    },

    /**
     * إيقاف الفحص الدوري
     */
    stopPeriodicCheck() {
        if (this.config.periodicCheckInterval) {
            clearInterval(this.config.periodicCheckInterval);
            this.config.periodicCheckInterval = null;
        }
    }
};

// تصدير للاستخدام العام
window.HealthManager = HealthManager;
