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
    CLIENT_SIDE_TOOLS: ['compress', 'resize', 'watermark', 'enhance'],
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
                enhance: () => this.renderEnhanceTool(formContainer),
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
            const timeoutId = setTimeout(() => controller.abort(), 180000);

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
                        <option value="auto">تلقائي (AI مع u2netp)</option>
                        <option value="ai">ذكاء اصطناعي فقط (أفضل جودة)</option>
                        <option value="simple">بسيطة (OpenCV - سريعة)</option>
                    </select>
                    <p class="text-xs text-gray-500 mt-1">💡 AI يعطي أفضل نتيجة، البسيط أسرع للخلفيات الواضحة</p>
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
            const timeoutId = setTimeout(() => controller.abort(), 180000);

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
    },


    /**
     * Tool 6: Image Enhancer (Client-Side + Server-Side HD)
     */
    async renderEnhanceTool(container) {
        container.innerHTML += `
            <form id="enhanceForm" class="space-y-5">
                <!-- رفع الصورة -->
                <div>
                    <label class="block text-sm font-bold mb-2">📁 اختر الصورة</label>
                    <input type="file" id="enhanceFile" accept="image/*" required
                           class="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-amber-500 outline-none">
                    <p class="text-xs text-gray-500 mt-1">💡 JPG, PNG, WebP - حتى 10MB</p>
                </div>

                <!-- إعدادات سريعة -->
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-bold mb-2">
                            🔍 قوة التوضيح: <span id="sharpenAmountValue">70</span>%
                        </label>
                        <input type="range" id="sharpenAmount" min="0" max="100" value="70"
                               class="w-full accent-amber-600">
                        <div class="flex justify-between text-xs text-gray-500 mt-1">
                            <span>خفيف</span>
                            <span>قوي</span>
                        </div>
                    </div>
                    <div>
                        <label class="block text-sm font-bold mb-2">
                            🧹 إزالة الضوضاء: <span id="denoiseStrengthValue">30</span>%
                        </label>
                        <input type="range" id="denoiseStrength" min="0" max="100" value="30"
                               class="w-full accent-amber-600">
                        <div class="flex justify-between text-xs text-gray-500 mt-1">
                            <span>بدون</span>
                            <span>قوي</span>
                        </div>
                    </div>
                </div>

                <!-- معامل التكبير -->
                <div>
                    <label class="block text-sm font-bold mb-2">📐 رفع الدقة</label>
                    <div class="grid grid-cols-3 gap-2">
                        <label class="cursor-pointer">
                            <input type="radio" name="scale" value="1" class="peer hidden">
                            <div class="border-2 border-gray-200 rounded-xl p-3 text-center peer-checked:border-amber-500 peer-checked:bg-amber-50 transition-all hover:border-amber-300">
                                <div class="font-black">بدون</div>
                                <div class="text-xs text-gray-500">نفس المقاس</div>
                            </div>
                        </label>
                        <label class="cursor-pointer">
                            <input type="radio" name="scale" value="2" class="peer hidden" checked>
                            <div class="border-2 border-gray-200 rounded-xl p-3 text-center peer-checked:border-amber-500 peer-checked:bg-amber-50 transition-all hover:border-amber-300">
                                <div class="font-black">2x</div>
                                <div class="text-xs text-gray-500">مزدوج</div>
                            </div>
                        </label>
                        <label class="cursor-pointer">
                            <input type="radio" name="scale" value="3" class="peer hidden">
                            <div class="border-2 border-gray-200 rounded-xl p-3 text-center peer-checked:border-amber-500 peer-checked:bg-amber-50 transition-all hover:border-amber-300">
                                <div class="font-black">3x</div>
                                <div class="text-xs text-gray-500">ثلاثي</div>
                            </div>
                        </label>
                    </div>
                </div>

                <!-- صيغة الإخراج -->
                <div>
                    <label class="block text-sm font-bold mb-2">💾 صيغة الإخراج</label>
                    <select id="enhanceFormat" class="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-amber-500 outline-none">
                        <option value="PNG">PNG - أعلى جودة (موصى)</option>
                        <option value="JPEG">JPG - حجم أصغر</option>
                        <option value="WEBP">WebP - الأحدث والأفضل</option>
                    </select>
                </div>

                <!-- زر المعالجة -->
                <button type="submit" id="enhanceBtn"
                        class="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-black py-4 rounded-xl transition-all shadow-lg shadow-amber-500/30">
                    ✨ تحسين الجودة الآن
                </button>

                <!-- Before/After Slider -->
                <div id="enhanceResult" class="hidden">
                    <div class="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl p-5">
                        <h3 class="text-lg font-black mb-3 text-gray-800">📊 مقارنة قبل وبعد</h3>

                        <!-- Slider Container -->
                        <div id="compareSlider" class="relative w-full overflow-hidden rounded-xl border-2 border-gray-200 select-none" style="aspect-ratio: 16/10; background: #f3f4f6;">
                            <!-- الصورة بعد (أسفل) -->
                            <img id="afterImg" class="absolute inset-0 w-full h-full object-contain">
                            <!-- الصورة قبل (فوق) -->
                            <div id="beforeWrap" class="absolute inset-0 overflow-hidden" style="width: 50%;">
                                <img id="beforeImg" class="absolute inset-0 w-full h-full object-contain" style="min-width: calc(100% * 2); max-width: none;">
                            </div>
                            <!-- الخط الفاصل -->
                            <div id="sliderLine" class="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg" style="left: 50%;"></div>
                            <!-- المقبض -->
                            <div id="sliderHandle" class="absolute top-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-2xl flex items-center justify-center cursor-ew-resize" style="left: calc(50% - 20px);">
                                <svg class="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M8 9l4-4 4 4m0 6l-4 4-4-4"/>
                                </svg>
                            </div>
                            <!-- Labels -->
                            <div class="absolute top-3 right-3 bg-black/70 text-white text-xs px-2 py-1 rounded font-bold">الأصلية</div>
                            <div class="absolute top-3 left-3 bg-amber-500 text-white text-xs px-2 py-1 rounded font-bold">المحسنة ✨</div>
                        </div>

                        <!-- إحصائيات -->
                        <div id="enhanceStats" class="grid grid-cols-2 gap-3 mt-4"></div>

                        <!-- زر التنزيل -->
                        <button type="button" id="downloadEnhanced"
                                class="w-full mt-4 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-black py-3 rounded-xl transition-all">
                            💾 تنزيل الصورة المحسنة
                        </button>
                    </div>
                </div>
            </form>
        `;

        // معالج رفع الصورة - عرض معاينة
        document.getElementById('enhanceFile').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
                document.getElementById('beforeImg').src = ev.target.result;
                document.getElementById('afterImg').src = ev.target.result;
                // ضبط عرض beforeImg ليكون ضعف عرض الـ container
                const slider = document.getElementById('compareSlider');
                document.getElementById('beforeImg').style.width = (slider.offsetWidth * 2) + 'px';
            };
            reader.readAsDataURL(file);
        });

        // تحديث قيم الـ sliders
        document.getElementById('sharpenAmount').addEventListener('input', (e) => {
            document.getElementById('sharpenAmountValue').textContent = e.target.value;
        });
        document.getElementById('denoiseStrength').addEventListener('input', (e) => {
            document.getElementById('denoiseStrengthValue').textContent = e.target.value;
        });

        // Before/After Slider Drag
        const slider = document.getElementById('compareSlider');
        let isDragging = false;
        const updateSlider = (x) => {
            const rect = slider.getBoundingClientRect();
            const xRel = Math.max(0, Math.min(rect.width, x - rect.left));
            const pct = (xRel / rect.width) * 100;
            document.getElementById('beforeWrap').style.width = pct + '%';
            document.getElementById('sliderLine').style.left = pct + '%';
            document.getElementById('sliderHandle').style.left = `calc(${pct}% - 20px)`;
        };
        slider.addEventListener('mousedown', (e) => { isDragging = true; updateSlider(e.clientX); });
        document.addEventListener('mousemove', (e) => { if (isDragging) updateSlider(e.clientX); });
        document.addEventListener('mouseup', () => { isDragging = false; });
        // Touch support
        slider.addEventListener('touchstart', (e) => { isDragging = true; updateSlider(e.touches[0].clientX); });
        document.addEventListener('touchmove', (e) => { if (isDragging) updateSlider(e.touches[0].clientX); });
        document.addEventListener('touchend', () => { isDragging = false; });

        // submit
        document.getElementById('enhanceForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleEnhance();
        });
    },

    async handleEnhance() {
        const file = document.getElementById('enhanceFile').files[0];
        const sharpenAmount = parseInt(document.getElementById('sharpenAmount').value) / 50; // 0-2
        const denoisePct = parseInt(document.getElementById('denoiseStrength').value);
        // map denoise: 0 -> 0 (no denoise), 1-50 -> 1 (light), 51-100 -> 2 (strong)
        const denoiseStrength = denoisePct === 0 ? 0 : denoisePct <= 50 ? 1 : 2;
        const scale = parseInt(document.querySelector('input[name="scale"]:checked').value);
        const outputFormat = document.getElementById('enhanceFormat').value;
        const resultDiv = document.getElementById('enhanceResult');
        const btn = document.getElementById('enhanceBtn');

        if (!file) return;

        btn.disabled = true;
        btn.innerHTML = '<div class="spinner mx-auto"></div>';
        resultDiv.classList.add('hidden');

        try {
            // ✅ معالجة فورية في المتصفح
            const result = await ClientTools.enhanceImage(file, {
                sharpenAmount,
                sharpenRadius: 1.0,
                denoiseStrength,
                scale,
                outputFormat,
                quality: 95
            });

            // عرض النتائج
            const enhancedURL = URL.createObjectURL(result.blob);
            document.getElementById('afterImg').src = enhancedURL;

            // ضبط عرض beforeImg لضعف عرض الـ container للمقارنة
            const slider = document.getElementById('compareSlider');
            document.getElementById('beforeImg').style.width = (slider.offsetWidth * 2) + 'px';

            // إحصائيات
            const origDims = result.stats.originalDims;
            const enhDims = result.stats.enhancedDims;
            const sizeChange = ((result.stats.enhancedSize / result.stats.originalSize - 1) * 100).toFixed(0);
            const sizeChangeText = sizeChange > 0 ? `+${sizeChange}%` : `${sizeChange}%`;

            document.getElementById('enhanceStats').innerHTML = `
                <div class="bg-white rounded-xl p-3 text-center">
                    <div class="text-xs text-gray-500">الأبعاد الجديدة</div>
                    <div class="font-black text-amber-600">${enhDims.width}×${enhDims.height}</div>
                </div>
                <div class="bg-white rounded-xl p-3 text-center">
                    <div class="text-xs text-gray-500">حجم الملف</div>
                    <div class="font-black text-amber-600">${ClientTools.formatBytes(result.stats.enhancedSize)} <span class="text-xs text-gray-500">(${sizeChangeText})</span></div>
                </div>
                <div class="bg-white rounded-xl p-3 text-center">
                    <div class="text-xs text-gray-500">الأصلية</div>
                    <div class="font-black text-gray-700">${origDims.width}×${origDims.height}</div>
                </div>
                <div class="bg-white rounded-xl p-3 text-center">
                    <div class="text-xs text-gray-500">المعالجة</div>
                    <div class="font-black text-green-600">${scale}x تكبير + شحذ</div>
                </div>
            `;

            // زر التنزيل
            document.getElementById('downloadEnhanced').onclick = () => {
                ClientTools.downloadBlob(result.blob, result.filename);
            };

            resultDiv.classList.remove('hidden');
            UI.showToast('🎉 تم تحسين الصورة بنجاح!', 'success');

            // Scroll للنتيجة
            resultDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } catch (error) {
            resultDiv.innerHTML = `
                <div class="bg-red-50 border-2 border-red-200 rounded-xl p-5 text-red-700">❌ ${error.message}</div>
            `;
            resultDiv.classList.remove('hidden');
        } finally {
            btn.disabled = false;
            btn.innerHTML = '✨ تحسين الجودة الآن';
        }
    }
};

window.Tools = Tools;
