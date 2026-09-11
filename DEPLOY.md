# 🚀 دليل النشر الكامل - MediaTools Platform

> خطوة بخطوة: من الكود المحلي إلى موقع عام مباشر

## 📋 نظرة عامة

```
الجهاز المحلي → GitHub → Render (Backend) + Vercel (Frontend) → موقع عام ✅
```

**الوقت المتوقع:** 15-25 دقيقة (مع إنشاء الحسابات لأول مرة)

---

## ✅ المرحلة 1: تثبيت Git (مرة واحدة فقط)

### الطريقة الأسرع (موصى بها)

افتح **PowerShell كمسؤول** (Run as Administrator) ثم الصق:

```powershell
winget install --id Git.Git -e --source winget
```

أعد تشغيل PowerShell بعدها.

### التحقق من التثبيت

```powershell
git --version
```

يجب أن يظهر شيء مثل: `git version 2.43.0.windows.1`

---

## ✅ المرحلة 2: تهيئة ورفع الكود لـ GitHub

### الخطوة 1: إعداد Git لأول مرة (مرة واحدة فقط على الجهاز)

افتح PowerShell في مجلد المشروع:

```powershell
cd "C:\Users\asus\Desktop\Platforms\Designing Platform"

git config --global user.name "اسمك هنا"
git config --global user.email "your-email@example.com"
```

> 💡 استبدل "اسمك هنا" و "your-email@example.com" بقيمك الحقيقية (استخدم نفس إيميل حساب GitHub).

### الخطوة 2: تهيئة Git repo محلياً

```powershell
git init
git add .
git commit -m "Initial commit: MediaTools platform MVP"
```

### الخطوة 3: إنشاء repo على GitHub

1. افتح https://github.com/new في المتصفح
2. سجّل الدخول (أو أنشئ حساباً مجانياً)
3. املأ:
   - **Repository name**: `mediatools-platform`
   - **Description**: `Quick Media & Content Tools - Free image processing platform`
   - **Public** ✅ (مطلوب لنشر مجاني على Render و Vercel)
   - ❌ لا تضف README (موجود لدينا)
   - ❌ لا تضف .gitignore (موجود لدينا)
4. اضغط **Create repository**

### الخطوة 4: ربط ورفع الكود

انسخ الأوامر من صفحة GitHub الجديدة (ستجدها في "...or push an existing repository from the command line"):

```powershell
git remote add origin https://github.com/YOUR_USERNAME/mediatools-platform.git
git branch -M main
git push -u origin main
```

> ⚠️ استبدل `YOUR_USERNAME` باسم المستخدم الخاص بك على GitHub.

سيطلب منك اسم المستخدم وكلمة المرور — استخدم **Personal Access Token** بدلاً من كلمة المرور:
- أنشئ واحد من: https://github.com/settings/tokens/new
- اختر: `repo` (Full control)
- انسخه واستخدمه كـ "password"

---

## ✅ المرحلة 3: نشر Backend على Render.com

### الخطوة 1: إنشاء حساب

1. افتح https://render.com
2. اضغط **Get Started for Free**
3. سجّل بـ GitHub

### الخطوة 2: إنشاء Web Service

1. اضغط **New +** → **Web Service**
2. اربط الـ repo `mediatools-platform`
3. املأ الإعدادات:

| الحقل | القيمة |
|------|--------|
| **Name** | `mediatools-api` |
| **Region** | `Oregon (US West)` |
| **Branch** | `main` |
| **Root Directory** | `backend` |
| **Runtime** | `Python 3` |
| **Build Command** | `pip install --upgrade pip && pip install -r requirements.txt` |
| **Start Command** | `uvicorn main:app --host 0.0.0.0 --port $PORT` |
| **Plan** | `Free` |

### الخطوة 3: إضافة Environment Variables

في قسم **Environment Variables**:

```
ENVIRONMENT = production
DEBUG = false
ENABLE_REMBG = true
PYTHON_VERSION = 3.11.9
MAX_FILE_SIZE_MB = 10
```

### الخطوة 4: النشر

اضغط **Create Web Service** → انتظر 3-5 دقائق.

ستحصل على رابط مثل:
```
https://mediatools-api.onrender.com
```

✅ اختبر: افتح `https://mediatools-api.onrender.com/api/v1/health` — يجب أن تظهر JSON.

> 💡 ملاحظة: على الخطة المجانية، Render يوقف الـ service بعد 15 دقيقة من عدم النشاط. أول طلب بعد التوقف سيستغرق ~30 ثانية.

---

## ✅ المرحلة 4: نشر Frontend على Vercel

### الخطوة 1: إنشاء حساب

1. افتح https://vercel.com
2. اضغط **Sign Up** → **Continue with GitHub**

### الخطوة 2: استيراد المشروع

1. اضغط **Add New...** → **Project**
2. اختر repo `mediatools-platform`
3. املأ:

| الحقل | القيمة |
|------|--------|
| **Project Name** | `mediatools-platform` |
| **Root Directory** | `frontend` (اضغط Edit) |
| **Framework Preset** | `Other` |

### الخطوة 3: النشر

اضغط **Deploy** → انتظر 1-2 دقيقة.

ستحصل على رابط مثل:
```
https://mediatools-platform.vercel.app
```

✅ افتح الرابط — ستظهر الواجهة كاملة!

---

## ✅ المرحلة 5: ربط Frontend بـ Backend

### تعديل API URL

افتح `frontend/js/api.js` وعدّل السطر 9:

```javascript
const API_BASE_URL = 'https://mediatools-api.onrender.com';
```

> ⚠️ استبدل بالرابط الفعلي الذي حصلت عليه من Render.

### رفع التحديث

```powershell
git add frontend/js/api.js
git commit -m "Connect frontend to production API"
git push
```

Vercel سيعيد النشر تلقائياً خلال ~30 ثانية.

---

## 🎉 النتيجة النهائية

| الخدمة | الرابط | الاستخدام |
|--------|--------|-----------|
| **Frontend** | `https://mediatools-platform.vercel.app` | الموقع العام |
| **API** | `https://mediatools-api.onrender.com` | الـ Backend |
| **API Docs** | `https://mediatools-api.onrender.com/docs` | توثيق تفاعلي |

---

## 🔧 استكشاف الأخطاء

### ❌ "ModuleNotFoundError" على Render
**الحل:** تأكد أن `requirements.txt` في مجلد `backend/` وليس الجذر.

### ❌ الموقع بطيء في أول مرة
**السبب:** خطة Render المجانية توقف الـ service بعد 15 دقيقة خمول.
**الحل:** طبيعي. أول طلب يستيقظ الخدمة (~30 ثانية).

### ❌ الصور لا تُرفع للـ API
**السبب:** الـ CORS أو الـ URL غير محدّث.
**الحل:** تأكد من تحديث `API_BASE_URL` في `frontend/js/api.js`.

### ❌ "Application failed to respond" على Render
**الحل:** تحقق من logs في Render Dashboard → Logs. غالباً خطأ في imports.

---

## 🚀 ترقية مستقبلية (Production)

- **Render Starter Plan** ($7/شهر): لا ينام الـ service + أداء أفضل
- **Vercel Pro** ($20/شهر): Analytics + Custom Domain
- **Custom Domain**: أضف domain خاص بك في Vercel/Render settings
- **CDN**: Vercel يأتي مع CDN عالمي تلقائياً ✅
- **Monitoring**: أضف Sentry للـ error tracking

---

## 📞 المساعدة

إذا واجهت أي مشكلة في خطوة معينة، أرسل لي screenshot وسأساعدك فوراً!
