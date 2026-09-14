/**
 * ============================================
 * Tools Module - واجهات الأدوات (محدّث)
 * يستخدم Client-Side للأدوات الخفيفة
 * و Server-Side للأدوات الثقيلة
 * ============================================
 */

const Tools = {

    /**
     * هل الأداة تُعالج client-side أم server-side؟
     */
    CLIENT_SIDE_TOOLS: ['compress', 'resize', 'watermark'],
    SERVER_SIDE_TOOLS: ['template', 'background'],

    isClientSide(toolId) {
        return this.CLIENT_SIDE_TOOLS.includes(toolId);
    },

    /**
     * عرض Loading Spinner لعمليات السيرفر (للتعامل مع الصحوة)
     */
    showServerLoading(message = 'جاري تهيئة السيرفر، يرجى الانتظار...') {
        const overlay = document.createElement('div');
        overlay.id = 'serverLoadingOverlay';
        overlay.className = 'fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center';
        overlay.innerHTML = `
            <div class="bg-white rounded-3xl p-8 max-w-md mx-4 text-center shadow-2xl">
                <div class="w-16 h-16 mx-auto mb-4">
                    <div class="spinner mx-auto"></div>
                </div>
                <h3 class="text-xl font-black text-gray-800 mb-2">${message}</h3>
                <p class="text-sm text-gray-500">قد يستغرق 30-60 ثانية في أول استخدام</p>
                <div class="mt-4 w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div id="loadingProgress" class="bg-gradient-to-r from-brand-600 to-purple-600 h-full rounded-full transition-all duration-1000" style="width: 10%"></div>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
        return overlay;
    },

    hideServerLoading() {
        const overlay = document.getElementById('serverLoadingOverlay');
        if (overlay) overlay.remove();
    },

    /**
     * فتح نافذة الأداة
     */
    async open(toolId) {
        const modal = document.getElementById('toolModal');
        const content = document.getElementById('modalContent');

        content.innerHTML = '<div class="flex items-center justify-center py-12"><div class="spinner"></div></div>';
        modal.classList.remove('hidden');
        modal.classList.add('flex');

        const isClient = this.isClientSide(toolId);
        const banner = isClient
            ? '<div class="bg-green-50 border border-green-200 text-green-800 px-4 py-2 rounded-xl text-xs font-bold mb-4">⚡ معالجة فورية في المتصفح - بدون سيرفر</div>'
            : '<div class="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-2 rounded-xl text-xs font-bold mb-4">☁️ معالجة على السيرفر - قد تستغرق 30-60 ثانية في أول استخدام</div>';

        try {
            content.innerHTML = banner;
            const formContainer = document.createElement('div');
            content.appendChild(formContainer);

            const renderers = {
                compress: () => this.renderCompressTool(formContainer),
                resize: () => this.renderResizeTool(formContainer),
                template: () => this.renderTemplateTool(formContainer),
                watermark: () => this.renderWatermarkTool(formContainer),
                background: () => this.renderBackgroundTool(formContainer),
            };

            await renderers[toolId]();
        } catch (error) {
            content.innerHTML = `
                <div class="text-center py-12">
                    <div class="text-5xl mb-3">⚠️</div>
                    <p class="text-red-600 font-bold">${error.message}</p>
                </div>
            `;
        }
    },

    close() {
        const modal = document.getElementById('toolModal');
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        this.hideServerLoading();
    },

    /**
     * Tool 1: Compress (Client-Side)
     */
    async renderCompressTool(container) {
        container.innerHTML = `
            <div class="flex justify-between items-start mb-6">
                <div>
                    <div class="text-3xl mb-2">📦</div>
                    <h2 class="text-2xl font-black mb-1">ضغط وتحويل الصور</h2>
                    <p class="text-gray-600">معالجة فورية داخل المتصفح - بدون رفع للسيرفر</p>
                </div>
                <button onclick="Tools.close()" class="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
            </div>

            <form id="compressForm" class="space-y-5">
                <div>
                    <label class="block text-sm font-bold mb-2">📁 اختر الصورة</label>
                    <input type="file" id="compressFile" accept="image/*" required
                           class="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-brand-500 outline-none">
                    <div id="compressPreview" class="mt-3 hidden">
                        <img id="compressPreviewImg" class="max-h-40 mx-auto rounded-lg shadow">
                    </div>
                </div>

                <div>
                    <label class="block text-sm font-bold mb-2">
                        🎯 مستوى الجودة: <span id="qualityValue">85</span>%
                    </label>
                    <input type="range" id="quality" min="1" max="100" value="85"
                           class="w-full accent-brand-600">
                    <div class="flex justify-between text-xs text-gray-500 mt-1">
                        <span>أصغر حجماً</span>
                        <span>أعلى جودة</span>
                    </div>
                </div>

                <div>
                    <label class="block text-sm font-bold mb-2">📋 صيغة الإخراج</label>
                    <select id="outputFormat" class="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-brand-500 outline-none">
                        <option value="JPEG">JPG - أصغر حجماً</option>
                        <option value="WEBP">WebP - أحدث وأفضل</option>
                        <option value="PNG">PNG - شفافية كاملة</option>
                    </select>
                </div>

                <button type="submit" id="compressBtn"
                        class="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-4 rounded-xl transition-all">
                    ⚡ ضغط الآن
                </button>

                <div id="compressResult" class="hidden"></div>
            </form>
        `;

        document.getElementById('compressFile').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
                document.getElementById('compressPreviewImg').src = ev.target.result;
                document.getElementById('compressPreview').classList.remove('hidden');
            };
            reader.readAsDataURL(file);
        });

        document.getElementById('quality').addEventListener('input', (e) => {
            document.getElementById('qualityValue').textContent = e.target.value;
        });

        document.getElementById('compressForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleCompress();
        });
    },

    async handleCompress() {
        const file = document.getElementById('compressFile').files[0];
        const quality = parseInt(document.getElementById('quality').value);
        const outputFormat = document.getElementById('outputFormat').value;
        const resultDiv = document.getElementById('compressResult');
        const btn = document.getElementById('compressBtn');

        if (!file) return;

        btn.disabled = true;
        btn.innerHTML = '<div class="spinner mx-auto"></div>';
        resultDiv.classList.add('hidden');

        try {
            // ✅ معالجة في المتصفح مباشرة - بدون سيرفر!
            const result = await ClientTools.compressImage(file, {
                quality,
                outputFormat
            });

            ClientTools.downloadBlob(result.blob, result.filename);

            resultDiv.innerHTML = `
                <div class="bg-green-50 border-2 border-green-200 rounded-xl p-5">
                    <div class="text-2xl mb-2">✅ تم بنجاح!</div>
                    <div class="grid grid-cols-2 gap-3 text-sm">
                        <div><strong>الحجم الأصلي:</strong><br>${ClientTools.formatBytes(result.stats.originalSize)}</div>
                        <div><strong>الحجم الجديد:</strong><br>${ClientTools.formatBytes(result.stats.compressedSize)}</div>
                        <div class="col-span-2 text-center bg-white rounded-lg p-3 mt-2">
                            <span class="text-2xl font-black text-green-600">${result.stats.compressionRatio}%</span>
                            <span class="text-sm text-gray-600">نسبة التخفيض</span>
                        </div>
                        <div class="col-span-2 text-xs text-center text-gray-500">
                            الأبعاد: ${result.stats.dimensions.width}×${result.stats.dimensions.height}
                        </div>
                    </div>
                </div>
            `;
            resultDiv.classList.remove('hidden');
            UI.showToast('🎉 تم تحميل الصورة المضغوطة', 'success');
        } catch (error) {
            resultDiv.innerHTML = `
                <div class="bg-red-50 border-2 border-red-200 rounded-xl p-5 text-red-700">
                    ❌ ${error.message}
                </div>
            `;
            resultDiv.classList.remove('hidden');
        } finally {
            btn.disabled = false;
            btn.innerHTML = '⚡ ضغط الآن';
        }
    },

    /**
     * Tool 2: Resize (Client-Side)
     */
    async renderResizeTool(container) {
        const PLATFORMS = {
            instagram_square: { name: 'Instagram - مربع', width: 1080, height: 1080 },
            instagram_portrait: { name: 'Instagram - طولي', width: 1080, height: 1350 },
            instagram_story: { name: 'Instagram - Story/Reels', width: 1080, height: 1920 },
            facebook_post: { name: 'Facebook - Post', width: 1200, height: 630 },
            facebook_story: { name: 'Facebook - Story', width: 1080, height: 1920 },
            facebook_cover: { name: 'Facebook - Cover', width: 820, height: 312 },
            twitter_post: { name: 'Twitter - Post', width: 1200, height: 675 },
            twitter_header: { name: 'Twitter - Header', width: 1500, height: 500 },
            youtube_thumbnail: { name: 'YouTube - Thumbnail', width: 1280, height: 720 },
            linkedin_post: { name: 'LinkedIn - Post', width: 1200, height: 627 },
            tiktok_video: { name: 'TikTok - Video', width: 1080, height: 1920 },
            pinterest_pin: { name: 'Pinterest - Pin', width: 1000, height: 1500 },
            whatsapp_status: { name: 'WhatsApp - Status', width: 1080, height: 1920 },
        };

        const platformOptions = Object.entries(PLATFORMS)
            .map(([id, p]) => `<option value="${id}">${p.name} (${p.width}×${p.height})</option>`)
            .join('');

        container.innerHTML += `
            <form id="resizeForm" class="space-y-5">
                <div>
                    <label class="block text-sm font-bold mb-2">📁 اختر الصورة</label>
                    <input type="file" id="resizeFile" accept="image/*" required
                           class="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-brand-500 outline-none">
                </div>

                <div>
                    <label class="block text-sm font-bold mb-2">📱 اختر المنصة</label>
                    <select id="platformSelect" required
                            class="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-brand-500 outline-none">
                        ${platformOptions}
                    </select>
                </div>

                <div>
                    <label class="block text-sm font-bold mb-2">🎯 طريقة الملاءمة</label>
                    <select id="fitMode"
                            class="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-brand-500 outline-none">
                        <option value="cover">قص وتغطية (Cover) - الافتراضي</option>
                        <option value="contain">احتواء مع فراغات (Contain)</option>
                        <option value="stretch">تمدد (Stretch)</option>
                    </select>
                </div>

                <button type="submit" id="resizeBtn"
                        class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-all">
                    ⚡ تعديل المقاس الآن
                </button>

                <div id="resizeResult" class="hidden"></div>
            </form>
        `;

        document.getElementById('resizeForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleResize(PLATFORMS);
        });
    },

    async handleResize(PLATFORMS) {
        const file = document.getElementById('resizeFile').files[0];
        const platform = document.getElementById('platformSelect').value;
        const fitMode = document.getElementById('fitMode').value;
        const resultDiv = document.getElementById('resizeResult');
        const btn = document.getElementById('resizeBtn');

        if (!file) return;

        btn.disabled = true;
        btn.innerHTML = '<div class="spinner mx-auto"></div>';
        resultDiv.classList.add('hidden');

        try {
            const result = await ClientTools.resizeForPlatform(file, platform, {
                fitMode,
                filename: `${platform}.jpg`
            });

            ClientTools.downloadBlob(result.blob, result.filename);

            const target = PLATFORMS[platform];
            resultDiv.innerHTML = `
                <div class="bg-green-50 border-2 border-green-200 rounded-xl p-5 text-center">
                    <div class="text-2xl mb-2">✅ تم بنجاح!</div>
                    <p class="text-sm text-gray-700">تم تحميل الصورة بأبعاد ${target.width}×${target.height}</p>
                </div>
            `;
            resultDiv.classList.remove('hidden');
            UI.showToast('🎉 تم تحميل الصورة', 'success');
        } catch (error) {
            resultDiv.innerHTML = `
                <div class="bg-red-50 border-2 border-red-200 rounded-xl p-5 text-red-700">❌ ${error.message}</div>
            `;
            resultDiv.classList.remove('hidden');
        } finally {
            btn.disabled = false;
            btn.innerHTML = '⚡ تعديل المقاس الآن';
        }
    },

    /**
     * Tool 3: Template (Server-Side)
     */
    async renderTemplateTool(container) {
        container.innerHTML += `
            <form id="templateForm" class="space-y-5">
                <div>
                    <label class="block text-sm font-bold mb-2">🎨 اختر القالب</label>
                    <select id="templateSelect" required
                            class="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-brand-500 outline-none">
                        <option value="breaking_news">🔴 Breaking News - عاجل</option>
                        <option value="daily_news">📰 Daily News - أخبار يومية</option>
                        <option value="sports">⚽ Sports - رياضة</option>
                        <option value="tech_news">💻 Tech News - تكنولوجيا</option>
                        <option value="promo">📢 Promo - ترويجي</option>
                        <option value="business">💼 Business - أعمال</option>
                        <option value="entertainment">🎬 Entertainment - ترفيه</option>
                        <option value="health">🏥 Health - صحة</option>
                    </select>
                </div>

                <div>
                    <label class="block text-sm font-bold mb-2">📝 العنوان الرئيسي</label>
                    <input type="text" id="headline" required maxlength="200" placeholder="اكتب عنوان الخبر هنا..."
                           class="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-brand-500 outline-none">
                </div>

                <div>
                    <label class="block text-sm font-bold mb-2">📄 العنوان الفرعي (اختياري)</label>
                    <input type="text" id="subheadline" maxlength="200" placeholder="تفاصيل إضافية..."
                           class="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-brand-500 outline-none">
                </div>

                <button type="submit" id="templateBtn"
                        class="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-xl transition-all">
                    🎨 ولّد القالب
                </button>

                <div id="templateResult" class="hidden"></div>
            </form>
        `;

        document.getElementById('templateForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleTemplate();
        });
    },

    async handleTemplate() {
        const templateId = document.getElementById('templateSelect').value;
        const headline = document.getElementById('headline').value;
        const subheadline = document.getElementById('subheadline').value;
        const resultDiv = document.getElementById('templateResult');
        const btn = document.getElementById('templateBtn');

        btn.disabled = true;
        resultDiv.classList.add('hidden');

        this.showServerLoading('جاري توليد القالب الإخباري...');

        try {
            await HealthManager.wakeUp((progress) => {
                const progBar = document.getElementById('loadingProgress');
                if (progBar) {
                    const pct = Math.min(95, (progress.attempt / progress.max) * 95);
                    progBar.style.width = pct + '%';
                }
            });

            const formData = new FormData();
            formData.append('headline', headline);
            formData.append('subheadline', subheadline);

            const url = `${API_BASE_URL}${API_PREFIX}/template?template_id=${templateId}`;
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 120000);

            const response = await fetch(url, {
                method: 'POST',
                body: formData,
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.detail || `خطأ ${response.status}`);
            }

            const blob = await response.blob();
            ClientTools.downloadBlob(blob, `template_${templateId}.jpg`);

            this.hideServerLoading();
            resultDiv.innerHTML = `
                <div class="bg-green-50 border-2 border-green-200 rounded-xl p-5 text-center">
                    <div class="text-2xl mb-2">✅ تم بنجاح!</div>
                    <p class="text-sm text-gray-700">تم تحميل القالب الإخباري</p>
                </div>
            `;
            resultDiv.classList.remove('hidden');
            UI.showToast('🎉 تم تحميل القالب', 'success');
        } catch (error) {
            this.hideServerLoading();
            resultDiv.innerHTML = `
                <div class="bg-red-50 border-2 border-red-200 rounded-xl p-5 text-red-700">❌ ${error.message}</div>
            `;
            resultDiv.classList.remove('hidden');
        } finally {
            btn.disabled = false;
            btn.innerHTML = '🎨 ولّد القالب';
        }
    },

    /**
     * Tool 4: Watermark (Client-Side)
     */
    async renderWatermarkTool(container) {
        container.innerHTML += `
            <form id="watermarkForm" class="space-y-5">
                <div>
                    <label class="block text-sm font-bold mb-2">📁 الصورة الأصلية</label>
                    <input type="file" id="watermarkFile" accept="image/*" required
                           class="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-brand-500 outline-none">
                </div>

                <div class="bg-gray-50 p-4 rounded-xl space-y-4">
                    <div>
                        <label class="block text-sm font-bold mb-2">📝 نص العلامة المائية</label>
                        <input type="text" id="watermarkText" placeholder="© اسمك أو علامتك التجارية"
                               class="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-brand-500 outline-none">
                    </div>
                    <div class="text-center text-gray-400 text-sm">— أو —</div>
                    <div>
                        <label class="block text-sm font-bold mb-2">🖼️ شعار (PNG شفاف أفضل)</label>
                        <input type="file" id="watermarkImage" accept="image/*"
                               class="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-brand-500 outline-none">
                    </div>
                </div>

                <div>
                    <label class="block text-sm font-bold mb-2">📍 الموقع</label>
                    <select id="watermarkPosition"
                            class="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-brand-500 outline-none">
                        <option value="bottom-right">أسفل يمين (الافتراضي)</option>
                        <option value="bottom-left">أسفل يسار</option>
                        <option value="top-right">أعلى يمين</option>
                        <option value="top-left">أعلى يسار</option>
                        <option value="center">وسط الصورة</option>
                    </select>
                </div>

                <div>
                    <label class="block text-sm font-bold mb-2">
                        👁️ الشفافية: <span id="opacityValue">50</span>%
                    </label>
                    <input type="range" id="opacity" min="10" max="100" value="50"
                           class="w-full accent-brand-600">
                </div>

                <button type="submit" id="watermarkBtn"
                        class="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl transition-all">
                    💧 أضف العلامة
                </button>

                <div id="watermarkResult" class="hidden"></div>
            </form>
        `;

        document.getElementById('opacity').addEventListener('input', (e) => {
            document.getElementById('opacityValue').textContent = e.target.value;
        });

        document.getElementById('watermarkForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleWatermark();
        });
    },

    async handleWatermark() {
        const file = document.getElementById('watermarkFile').files[0];
        const text = document.getElementById('watermarkText').value;
        const imageFile = document.getElementById('watermarkImage').files[0];
        const position = document.getElementById('watermarkPosition').value;
        const opacity = parseInt(document.getElementById('opacity').value) / 100;
        const resultDiv = document.getElementById('watermarkResult');
        const btn = document.getElementById('watermarkBtn');

        if (!file || (!text && !imageFile)) {
            UI.showToast('⚠️ يجب إدخال نص أو رفع شعار', 'error');
            return;
        }

        btn.disabled = true;
        btn.innerHTML = '<div class="spinner mx-auto"></div>';
        resultDiv.classList.add('hidden');

        try {
            let result;
            if (imageFile) {
                result = await ClientTools.addImageWatermark(file, imageFile, {
                    position,
                    opacity
                });
            } else {
                result = await ClientTools.addTextWatermark(file, {
                    text,
                    position,
                    opacity
                });
            }

            ClientTools.downloadBlob(result.blob, result.filename);

            resultDiv.innerHTML = `
                <div class="bg-green-50 border-2 border-green-200 rounded-xl p-5 text-center">
                    <div class="text-2xl mb-2">✅ تم بنجاح!</div>
                    <p class="text-sm text-gray-700">تم تحميل الصورة بعلامة مائية</p>
                </div>
            `;
            resultDiv.classList.remove('hidden');
            UI.showToast('🎉 تم تحميل الصورة', 'success');
        } catch (error) {
            resultDiv.innerHTML = `
                <div class="bg-red-50 border-2 border-red-200 rounded-xl p-5 text-red-700">❌ ${error.message}</div>
            `;
            resultDiv.classList.remove('hidden');
        } finally {
            btn.disabled = false;
            btn.innerHTML = '💧 أضف العلامة';
        }
    },

    /**
     * Tool 5: Background Removal (Server-Side)
     */
    async renderBackgroundTool(container) {
        container.innerHTML += `
            <form id="bgForm" class="space-y-5">
                <div>
                    <label class="block text-sm font-bold mb-2">📁 اختر الصورة</label>
                    <input type="file" id="bgFile" accept="image/*" required
                           class="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-brand-500 outline-none">
                </div>

                <div>
                    <label class="block text-sm font-bold mb-2">🎯 طريقة التفريغ</label>
                    <select id="bgMethod"
                            class="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-brand-500 outline-none">
                        <option value="auto">تلقائي (AI + بسيط)</option>
                        <option value="simple">بسيطة (سريعة - بدون AI)</option>
                    </select>
                    <p class="text-xs text-gray-500 mt-1">💡 الوضع البسيط يعمل بشكل أفضل على الخطة المجانية</p>
                </div>

                <div class="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
                    💡 <strong>نصيحة:</strong> للحصول على أفضل نتيجة استخدم صوراً بخلفية موحدة واضحة.
                </div>

                <button type="submit" id="bgBtn"
                        class="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 rounded-xl transition-all">
                    ✂️ أزل الخلفية
                </button>

                <div id="bgResult" class="hidden"></div>
            </form>
        `;

        document.getElementById('bgForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleBackground();
        });
    },

    async handleBackground() {
        const file = document.getElementById('bgFile').files[0];
        const method = document.getElementById('bgMethod').value;
        const resultDiv = document.getElementById('bgResult');
        const btn = document.getElementById('bgBtn');

        if (!file) return;

        btn.disabled = true;
        resultDiv.classList.add('hidden');

        this.showServerLoading('جاري معالجة الصورة...');

        try {
            await HealthManager.wakeUp((progress) => {
                const progBar = document.getElementById('loadingProgress');
                if (progBar) {
                    const pct = Math.min(95, (progress.attempt / progress.max) * 95);
                    progBar.style.width = pct + '%';
                }
            });

            const formData = new FormData();
            formData.append('file', file);

            const url = `${API_BASE_URL}${API_PREFIX}/background/remove?method=${method}`;
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 120000);

            const response = await fetch(url, {
                method: 'POST',
                body: formData,
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.detail || `خطأ ${response.status}`);
            }

            const blob = await response.blob();
            ClientTools.downloadBlob(blob, 'no_background.png');

            this.hideServerLoading();
            resultDiv.innerHTML = `
                <div class="bg-green-50 border-2 border-green-200 rounded-xl p-5 text-center">
                    <div class="text-2xl mb-2">✅ تم بنجاح!</div>
                    <p class="text-sm text-gray-700">تم تحميل الصورة بخلفية شفافة</p>
                </div>
            `;
            resultDiv.classList.remove('hidden');
            UI.showToast('🎉 تم تحميل الصورة', 'success');
        } catch (error) {
            this.hideServerLoading();
            resultDiv.innerHTML = `
                <div class="bg-red-50 border-2 border-red-200 rounded-xl p-5 text-red-700">❌ ${error.message}</div>
            `;
            resultDiv.classList.remove('hidden');
        } finally {
            btn.disabled = false;
            btn.innerHTML = '✂️ أزل الخلفية';
        }
    }
};

window.Tools = Tools;
