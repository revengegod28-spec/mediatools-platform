# ⚡ Quick Media & Content Tools

> منصة مجانية وسريعة لمعالجة الصور والميديا لصنّاع المحتوى، الصحفيين، والمسوقين.

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Python 3.11](https://img.shields.io/badge/Python-3.11-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110-009688.svg)](https://fastapi.tiangolo.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8.svg)](https://tailwindcss.com/)

## 🎯 الرؤية

منصة ويب مجانية تماماً توفر **Zero-Friction** (بدون تسجيل دخول) لمستخدمين يبحثون عن أدوات سريعة لمعالجة الصور:
- 📦 **ضغط وتحويل** الصور (JPG, PNG, WebP)
- 📐 **تعديل مقاسات** منصات التواصل تلقائياً
- 📰 **مولد القوالب** الإخبارية والبنرات السريعة
- 💧 **إضافة علامة مائية** بضغطة واحدة
- ✂️ **تفريغ خلفيات** بالذكاء الاصطناعي

## 🏗️ المعمارية التقنية

```
┌─────────────────────────────────────────────────────────────┐
│                   Vercel (Frontend)                         │
│   HTML5 + Tailwind CSS + Vanilla JavaScript (PWA-ready)    │
└────────────────────────┬────────────────────────────────────┘
                         │ REST API
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  Render.com (Backend)                        │
│              FastAPI + Pillow + OpenCV + rembg              │
└─────────────────────────────────────────────────────────────┘
```

### Tech Stack

| Layer | Technology | Why? |
|-------|-----------|------|
| **Frontend** | HTML5, Tailwind CSS, Vanilla JS | أداء خفيف فائق على المحمول |
| **Backend** | Python 3.11, FastAPI | سرعة ومرونة في معالجة الصور |
| **Libraries** | Pillow, OpenCV, NumPy | المعالجة القياسية للصور |
| **AI Layer** | rembg (ONNX Runtime) | تفريغ خلفيات بجودة عالية |
| **Hosting** | Vercel + Render | نشر سهل ومجاني |

## 📁 هيكل المشروع

```
Designing Platform/
├── backend/                    # 🐍 FastAPI Backend
│   ├── main.py                 # نقطة الدخول الرئيسية
│   ├── requirements.txt        # اعتماديات Python
│   ├── Procfile                # أمر تشغيل Render
│   ├── runtime.txt             # إصدار Python
│   ├── render.yaml             # إعدادات Render
│   ├── .env.example            # قالب المتغيرات البيئية
│   ├── app/
│   │   ├── __init__.py
│   │   ├── config.py           # إعدادات مركزية
│   │   ├── constants.py        # ثوابت (مقاسات، قوالب)
│   │   ├── routers/            # مسارات API لكل أداة
│   │   │   ├── health.py
│   │   │   ├── compress.py
│   │   │   ├── resize.py
│   │   │   ├── template.py
│   │   │   ├── watermark.py
│   │   │   └── background.py
│   │   ├── services/           # منطق العمل لكل أداة
│   │   │   ├── compressor.py
│   │   │   ├── resizer.py
│   │   │   ├── template_gen.py
│   │   │   ├── watermarker.py
│   │   │   └── bg_remover.py
│   │   └── utils/              # أدوات مشتركة
│   │       ├── validators.py
│   │       └── image_helpers.py
│   ├── tests/                  # اختبارات pytest
│   └── storage/                # ملفات مؤقتة
│
├── frontend/                   # 🎨 Static Frontend
│   ├── index.html              # الصفحة الرئيسية
│   ├── vercel.json             # إعدادات Vercel
│   ├── css/
│   │   └── styles.css          # أنماط مخصصة
│   └── js/
│       ├── api.js              # عميل API
│       ├── tools.js            # واجهات الأدوات الخمس
│       └── main.js             # السكربت الرئيسي
│
├── .gitignore
└── README.md
```

## 🚀 التشغيل المحلي

### 1) تشغيل الـ Backend

```bash
# الانتقال للمجلد
cd backend

# إنشاء بيئة افتراضية
python -m venv venv

# تفعيل البيئة
# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

# تثبيت الاعتماديات
pip install -r requirements.txt

# تشغيل الخادم
python main.py
```

الـ API ستعمل على: **http://localhost:8000**
التوثيق التفاعلي: **http://localhost:8000/docs**

### 2) تشغيل الـ Frontend

```bash
# افتح frontend/index.html مباشرة في المتصفح
# أو استخدم خادم بسيط:
cd frontend
python -m http.server 3000
```

الواجهة ستعمل على: **http://localhost:3000**

## 📡 API Endpoints

| Method | Endpoint | الوصف |
|--------|----------|------|
| `GET` | `/` | معلومات الـ API |
| `GET` | `/api/v1/health` | فحص الصحة |
| `POST` | `/api/v1/compress` | ضغط وتحويل الصور |
| `GET` | `/api/v1/compress/formats` | الصيغ المتاحة |
| `POST` | `/api/v1/resize` | تعديل المقاس لمنصة |
| `POST` | `/api/v1/resize/custom` | تعديل مقاس مخصص |
| `GET` | `/api/v1/resize/platforms` | المنصات المدعومة |
| `POST` | `/api/v1/template` | توليد قالب إخباري |
| `GET` | `/api/v1/template/list` | القوالب المتاحة |
| `POST` | `/api/v1/watermark` | إضافة علامة مائية |
| `GET` | `/api/v1/watermark/positions` | المواقع المتاحة |
| `POST` | `/api/v1/background/remove` | تفريغ الخلفية |
| `GET` | `/api/v1/background/methods` | الطرق المتاحة |

### مثال سريع

```bash
# ضغط صورة
curl -X POST "http://localhost:8000/api/v1/compress" \
  -F "file=@photo.jpg" \
  -F "quality=85" \
  -F "output_format=WEBP" \
  --output compressed.webp
```

## 🌐 النشر (Deployment)

### Backend على Render.com

1. ادفع الكود إلى GitHub
2. في Render: **New → Web Service**
3. اربط الـ repo
4. حدد:
   - **Root Directory**: `backend`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. أضف المتغيرات البيئية (اختياري)
6. **Deploy** 🚀

### Frontend على Vercel

1. في Vercel: **New Project**
2. اربط نفس الـ repo
3. حدد:
   - **Root Directory**: `frontend`
   - **Framework Preset**: Other
4. **Deploy** 🚀

### ربط Frontend بـ Backend

عدّل في `frontend/js/api.js`:

```js
const API_BASE_URL = 'https://your-api.onrender.com';
```

## 💰 نموذج الربح

- ✅ **إعلانات عرضية** على الواجهة (Google AdSense)
- ✅ **خطط مدفوعة** للمميزات المتقدمة (API keys، معالجة بالجملة، بدون إعلانات)
- ✅ **Affiliate Marketing** لأدوات الطرف الثالث

## 🛣️ خارطة الطريق

- [x] **Phase 1**: الهيكل الأساسي والأدوات الخمس
- [ ] **Phase 2**: تحسين كل أداة بمميزات احترافية
- [ ] **Phase 3**: لوحة تحكم + حسابات مدفوعة
- [ ] **Phase 4**: API keys + معالجة بالجملة (Batch)
- [ ] **Phase 5**: PWA + معالجة على المتصفح (WebAssembly)
- [ ] **Phase 6**: أدوات AI جديدة (Image Upscale, Color Correction, Object Removal)

## 🧪 الاختبارات

```bash
cd backend
pytest tests/ -v
```

## 📄 الترخيص

MIT License — استخدمه بحرية في مشاريعك الشخصية أو التجارية.

## 🤝 المساهمة

المشروع في مرحلته الأولى. أي اقتراحات أو تحسينات مرحب بها!

---

**صُنع بـ ❤️ للمحتوى العربي**
