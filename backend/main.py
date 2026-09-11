"""
Quick Media & Content Tools API
منصة الأدوات السريعة لمعالجة الصور والميديا

نقطة الدخول الرئيسية للـ Backend
Main entry point for the FastAPI backend
"""
import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.routers import (
    compress,
    resize,
    template,
    watermark,
    background,
    health,
)

# ============================================================
# إعداد السجلات (Logging)
# ============================================================
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger("media-tools")


# ============================================================
# دورة حياة التطبيق (Lifespan)
# ============================================================
@asynccontextmanager
async def lifespan(app: FastAPI):
    """إجراءات بدء التشغيل وإيقاف التشغيل"""
    logger.info("🚀 جاري تشغيل منصة الأدوات السريعة...")
    logger.info(f"📦 الإصدار: {settings.APP_VERSION}")
    logger.info(f"🌍 البيئة: {settings.ENVIRONMENT}")
    logger.info(f"📁 مجلد الملفات المؤقتة: {settings.UPLOAD_DIR}")

    # إنشاء المجلدات اللازمة
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    os.makedirs(settings.TEMPLATES_DIR, exist_ok=True)

    yield

    logger.info("👋 إيقاف تشغيل المنصة بأمان...")


# ============================================================
# إنشاء تطبيق FastAPI
# ============================================================
app = FastAPI(
    title="Quick Media & Content Tools API",
    description=(
        "مجموعة أدوات سريعة لمعالجة الصور والميديا لصنّاع المحتوى. "
        "جميع الأدوات مجانية وبدون الحاجة لتسجيل دخول."
    ),
    version=settings.APP_VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)


# ============================================================
# CORS Middleware
# ============================================================
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=[
        "X-Original-Size",
        "X-Compressed-Size",
        "X-Compression-Ratio",
        "Content-Disposition",
    ],
)


# ============================================================
# تسجيل المسارات (Routes Registration)
# ============================================================
API_PREFIX = "/api/v1"

app.include_router(health.router, prefix=API_PREFIX, tags=["🏠 الصحة"])
app.include_router(compress.router, prefix=API_PREFIX, tags=["📦 ضغط الصور"])
app.include_router(resize.router, prefix=API_PREFIX, tags=["📐 تعديل المقاسات"])
app.include_router(template.router, prefix=API_PREFIX, tags=["📰 القوالب الإخبارية"])
app.include_router(watermark.router, prefix=API_PREFIX, tags=["💧 العلامة المائية"])
app.include_router(background.router, prefix=API_PREFIX, tags=["✂️ تفريغ الخلفيات"])


# ============================================================
# المسار الرئيسي (Root)
# ============================================================
@app.get("/", tags=["🏠 الرئيسية"])
async def root():
    """المسار الرئيسي - معلومات عامة عن الـ API"""
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "active",
        "message": "مرحباً بك في منصة الأدوات السريعة! 👋",
        "documentation": "/docs",
        "endpoints": {
            "health": f"{API_PREFIX}/health",
            "compress": f"{API_PREFIX}/compress",
            "resize": f"{API_PREFIX}/resize",
            "template": f"{API_PREFIX}/template",
            "watermark": f"{API_PREFIX}/watermark",
            "background": f"{API_PREFIX}/background/remove",
        },
        "tools": [
            {"id": "compress", "name": "ضغط وتحويل الصور", "icon": "📦"},
            {"id": "resize", "name": "تعديل مقاسات منصات التواصل", "icon": "📐"},
            {"id": "template", "name": "مولد القوالب الإخبارية", "icon": "📰"},
            {"id": "watermark", "name": "إضافة العلامة المائية", "icon": "💧"},
            {"id": "background", "name": "تفريغ الخلفيات", "icon": "✂️"},
        ],
    }


# ============================================================
# معالج الأخطاء العام (Global Error Handler)
# ============================================================
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger.error(f"❌ خطأ غير متوقع: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error": "internal_server_error",
            "message": "حدث خطأ غير متوقع أثناء معالجة طلبك.",
            "detail": str(exc) if settings.DEBUG else None,
        },
    )


# ============================================================
# نقطة تشغيل التطوير المحلي
# ============================================================
if __name__ == "__main__":
    import uvicorn

    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=settings.DEBUG,
        log_level="info",
    )
