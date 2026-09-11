/**
 * ============================================
 * Tools Module - واجهات الأدوات الخمس
 * ============================================
 */

const Tools = {
    /**
     * فتح نافذة الأداة
     */
    async open(toolId) {
        const modal = document.getElementById('toolModal');
        const content = document.getElementById('modalContent');

        content.innerHTML = '<div class="flex items-center justify-center py-12"><div class="spinner"></div></div>';
        modal.classList.remove('hidden');
        modal.classList.add('flex');

        try {
            switch (toolId) {
                case 'compress':
                    await this.renderCompressTool(content);
                    break;
                case 'resize':
                    await this.renderResizeTool(content);
                    break;
                case 'template':
                    await this.renderTemplateTool(content);
                    break;
                case 'watermark':
                    await this.renderWatermarkTool(content);
                    break;
                case 'background':
                    await this.renderBackgroundTool(content);
                    break;
                default:
                    throw new Error('أداة غير معروفة');
            }
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
    },

    /**
     * Tool 1: Compress
     */
    async renderCompressTool(container) {
        container.innerHTML = `
            <div class="flex justify-between items-start mb-6">
                <div>
                    <div class="text-3xl mb-2">📦</div>
                    <h2 class="text-2xl font-black mb-1">ضغط وتحويل الصور</h2>
                    <p class="text-gray-600">قلّل حجم الصورة وحوّلها للصيغة التي تريدها</p>
                </div>
                <button onclick="Tools.close()" class="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
            </div>

            <form id="compressForm" class="space-y-5">
                <!-- File Upload -->
                <div>
                    <label class="block text-sm font-bold mb-2">📁 اختر الصورة</label>
                    <input type="file" id="compressFile" accept="image/*" required
                           class="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-brand-500 outline-none">
                    <div id="compressPreview" class="mt-3 hidden">
                        <img id="compressPreviewImg" class="max-h-40 mx-auto rounded-lg shadow">
                    </div>
                </div>

                <!-- Quality -->
                <div>
                    <label class="block text-sm font-bold mb-2">
                        🎯 مستوى الجودة: <span id="qualityValue">85</span>%
                    </label>
                    <input type="range" id="quality" min="1" max="100" value="85"
                           class="w-full accent-brand-600">
                    <div class="flex justify-between text-xs text-gray-500 mt-1">
                        <span>أصغر</span>
                        <span>أعلى جودة</span>
                    </div>
                </div>

                <!-- Output Format -->
                <div>
                    <label class="block text-sm font-bold mb-2">📋 صيغة الإخراج</label>
                    <select id="outputFormat" class="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-brand-500 outline-none">
                        <option value="JPEG">JPG - الأصغر حجماً</option>
                        <option value="WEBP">WebP - أحدث وأفضل</option>
                        <option value="PNG">PNG - شفافية كاملة</option>
                    </select>
                </div>

                <button type="submit" id="compressBtn"
                        class="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-4 rounded-xl transition-all">
                    ⚡ ابدأ الضغط
                </button>

                <div id="compressResult" class="hidden"></div>
            </form>
        `;

        // Preview
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
        resultDiv.innerHTML = '';
        resultDiv.classList.add('hidden');

        try {
            const response = await apiClient.compressImage(file, { quality, outputFormat });
            const originalSize = parseInt(response.headers['X-Original-Size'] || 0);
            const compressedSize = parseInt(response.headers['X-Compressed-Size'] || 0);
            const ratio = response.headers['X-Compression-Ratio'] || '0%';

            const ext = outputFormat.toLowerCase().replace('jpeg', 'jpg');
            ApiClient.downloadBlob(response.blob, `compressed.${ext}`);

            resultDiv.innerHTML = `
                <div class="bg-green-50 border-2 border-green-200 rounded-xl p-5">
                    <div class="text-2xl mb-2">✅ تم بنجاح!</div>
                    <div class="grid grid-cols-2 gap-3 text-sm">
                        <div><strong>الحجم الأصلي:</strong><br>${this.formatBytes(originalSize)}</div>
                        <div><strong>الحجم الجديد:</strong><br>${this.formatBytes(compressedSize)}</div>
                        <div class="col-span-2 text-center bg-white rounded-lg p-3 mt-2">
                            <span class="text-2xl font-black text-green-600">${ratio}</span>
                            <span class="text-sm text-gray-600">نسبة التخفيض</span>
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
            btn.innerHTML = '⚡ ابدأ الضغط';
        }
    },

    /**
     * Tool 2: Resize
     */
    async renderResizeTool(container) {
        let platforms = {};
        try {
            const data = await apiClient.getPlatforms();
            platforms = data.platforms;
        } catch (e) {
            platforms = { instagram_story: { name: 'Instagram Story', width: 1080, height: 1920, category: 'instagram' } };
        }

        const platformOptions = Object.entries(platforms)
            .map(([id, p]) => `<option value="${id}">${p.name} (${p.width}×${p.height})</option>`)
            .join('');

        container.innerHTML = `
            <div class="flex justify-between items-start mb-6">
                <div>
                    <div class="text-3xl mb-2">📐</div>
                    <h2 class="text-2xl font-black mb-1">تعديل المقاسات</h2>
                    <p class="text-gray-600">اختر منصة التواصل وسنعدّل الصورة تلقائياً</p>
                </div>
                <button onclick="Tools.close()" class="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
            </div>

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
                    ⚡ ابدأ التعديل
                </button>

                <div id="resizeResult" class="hidden"></div>
            </form>
        `;

        document.getElementById('resizeForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleResize();
        });
    },

    async handleResize() {
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
            const response = await apiClient.resizeForPlatform(file, platform, { fitMode });
            ApiClient.downloadBlob(response.blob, `${platform}.jpg`);
            resultDiv.innerHTML = `
                <div class="bg-green-50 border-2 border-green-200 rounded-xl p-5 text-center">
                    <div class="text-2xl mb-2">✅ تم بنجاح!</div>
                    <p class="text-sm text-gray-700">تم تحميل الصورة بالحجم الجديد</p>
                </div>
            `;
            resultDiv.classList.remove('hidden');
            UI.showToast('🎉 تم تحميل الصورة المعدّلة', 'success');
        } catch (error) {
            resultDiv.innerHTML = `
                <div class="bg-red-50 border-2 border-red-200 rounded-xl p-5 text-red-700">❌ ${error.message}</div>
            `;
            resultDiv.classList.remove('hidden');
        } finally {
            btn.disabled = false;
            btn.innerHTML = '⚡ ابدأ التعديل';
        }
    },

    /**
     * Tool 3: Template
     */
    async renderTemplateTool(container) {
        let templates = {};
        try {
            const data = await apiClient.getTemplates();
            templates = data.templates;
        } catch (e) {
            templates = { breaking_news: { name: 'Breaking News', description: 'قالب أحمر للأخبار العاجلة' } };
        }

        const templateOptions = Object.entries(templates)
            .map(([id, t]) => `<option value="${id}">${t.name}</option>`)
            .join('');

        container.innerHTML = `
            <div class="flex justify-between items-start mb-6">
                <div>
                    <div class="text-3xl mb-2">📰</div>
                    <h2 class="text-2xl font-black mb-1">مولد القوالب الإخبارية</h2>
                    <p class="text-gray-600">أنشئ بنر إخباري احترافي بنقرة واحدة</p>
                </div>
                <button onclick="Tools.close()" class="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
            </div>

            <form id="templateForm" class="space-y-5">
                <div>
                    <label class="block text-sm font-bold mb-2">🎨 اختر القالب</label>
                    <select id="templateSelect" required
                            class="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-brand-500 outline-none">
                        ${templateOptions}
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

                <div>
                    <label class="block text-sm font-bold mb-2">🏷️ شعار (اختياري)</label>
                    <input type="file" id="logoFile" accept="image/*"
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
        const logoFile = document.getElementById('logoFile').files[0];
        const resultDiv = document.getElementById('templateResult');
        const btn = document.getElementById('templateBtn');

        btn.disabled = true;
        btn.innerHTML = '<div class="spinner mx-auto"></div>';
        resultDiv.classList.add('hidden');

        try {
            const response = await apiClient.generateTemplate(templateId, headline, {
                subheadline,
                logoFile
            });
            ApiClient.downloadBlob(response.blob, `template_${templateId}.jpg`);
            resultDiv.innerHTML = `
                <div class="bg-green-50 border-2 border-green-200 rounded-xl p-5 text-center">
                    <div class="text-2xl mb-2">✅ تم بنجاح!</div>
                    <p class="text-sm text-gray-700">تم تحميل القالب الإخباري</p>
                </div>
            `;
            resultDiv.classList.remove('hidden');
            UI.showToast('🎉 تم تحميل القالب', 'success');
        } catch (error) {
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
     * Tool 4: Watermark
     */
    async renderWatermarkTool(container) {
        container.innerHTML = `
            <div class="flex justify-between items-start mb-6">
                <div>
                    <div class="text-3xl mb-2">💧</div>
                    <h2 class="text-2xl font-black mb-1">إضافة علامة مائية</h2>
                    <p class="text-gray-600">احمِ صورك بعلامة مائية نصية أو شعار</p>
                </div>
                <button onclick="Tools.close()" class="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
            </div>

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
            const response = await apiClient.addWatermark(file, {
                text, imageFile, position, opacity
            });
            ApiClient.downloadBlob(response.blob, 'watermarked.jpg');
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
     * Tool 5: Background Removal
     */
    async renderBackgroundTool(container) {
        container.innerHTML = `
            <div class="flex justify-between items-start mb-6">
                <div>
                    <div class="text-3xl mb-2">✂️</div>
                    <h2 class="text-2xl font-black mb-1">تفريغ الخلفيات</h2>
                    <p class="text-gray-600">أزل خلفية الصورة تلقائياً واحصل على PNG شفاف</p>
                </div>
                <button onclick="Tools.close()" class="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
            </div>

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
                        <option value="ai">ذكاء اصطناعي (أفضل جودة)</option>
                        <option value="simple">بسيطة (سريعة)</option>
                    </select>
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
        btn.innerHTML = '<div class="spinner mx-auto"></div>';
        resultDiv.classList.add('hidden');

        try {
            const response = await apiClient.removeBackground(file, { method });
            ApiClient.downloadBlob(response.blob, 'no_background.png');
            resultDiv.innerHTML = `
                <div class="bg-green-50 border-2 border-green-200 rounded-xl p-5 text-center">
                    <div class="text-2xl mb-2">✅ تم بنجاح!</div>
                    <p class="text-sm text-gray-700">تم تحميل الصورة بخلفية شفافة</p>
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
            btn.innerHTML = '✂️ أزل الخلفية';
        }
    },

    formatBytes(bytes) {
        if (bytes === 0) return '0 بايت';
        const k = 1024;
        const sizes = ['بايت', 'كيلوبايت', 'ميجابايت'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
};

window.Tools = Tools;
