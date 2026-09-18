"""
Quick Media & Content Tools API
منصة الأدوات السريعة لمعالجة الصور والميديا

نقطة الدخول الرئيسية للـ Backend (محسّنة)
"""
import os
import logging
import time
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
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
    enhance,
)

# ============================================================
# إعداد السجلات (Logging)
# ============================================================
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger("media-tools")

# وقت بدء التطبيق
APP_START_TIME = time.time()


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

    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    os.makedirs(settings.TEMPLATES_DIR, exist_ok=True)

    logger.info("✅ السيرفر جاهز لاستقبال الطلبات")
    yield

    logger.info("👋 إيقاف تشغيل المنصة بأمان...")


# ============================================================
# إنشاء تطبيق FastAPI
# ============================================================
app = FastAPI(
    title="Quick Media & Content Tools API",
    description=(
        "مجموعة أدوات سريعة لمعالجة الصور والميديا لصنّاع المحتوى. "
        "الأدوات الخفيفة (الضغط، تعديل المقاسات، العلامة المائية) تعمل في المتصفح مباشرة. "
        "الأدوات الثقيلة (القوالب الإخبارية، تفريغ الخلفيات) تعمل على السيرفر."
    ),
    version=settings.APP_VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)


# ============================================================
# CORS Middleware (مفتوح بالكامل)
# ============================================================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=[
        "X-Original-Size",
        "X-Compressed-Size",
        "X-Compression-Ratio",
        "X-Processing-Time",
        "Content-Disposition",
    ],
    max_age=3600,
)


# ============================================================
# Middleware لتسجيل وقت المعالجة
# ============================================================
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    """إضافة وقت المعالجة في headers + logs"""
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Processing-Time"] = f"{process_time:.3f}"
    logger.info(
        f"{request.method} {request.url.path} | "
        f"Status: {response.status_code} | "
        f"Time: {process_time:.3f}s"
    )
    return response


# ============================================================
# تسجيل المسارات (Routes)
# ============================================================
API_PREFIX = "/api/v1"

app.include_router(health.router, prefix=API_PREFIX, tags=["🏠 الصحة"])
app.include_router(compress.router, prefix=API_PREFIX, tags=["📦 ضغط الصور"])
app.include_router(resize.router, prefix=API_PREFIX, tags=["📐 تعديل المقاسات"])
app.include_router(template.router, prefix=API_PREFIX, tags=["📰 القوالب الإخبارية"])
app.include_router(watermark.router, prefix=API_PREFIX, tags=["💧 العلامة المائية"])
app.include_router(background.router, prefix=API_PREFIX, tags=["✂️ تفريغ الخلفيات"])
app.include_router(enhance.router, prefix=API_PREFIX, tags=["🔍 تحسين جودة الصور"])


# ============================================================
# المسار الرئيسي (Root)
# ============================================================
@app.get("/", tags=["🏠 الرئيسية"])
async def root():
    """المعلومات العامة عن الـ API"""
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "active",
        "uptime_seconds": round(time.time() - APP_START_TIME, 2),
        "message": "مرحباً بك في منصة الأدوات السريعة! 👋",
        "strategy": "الأدوات الخفيفة في المتصفح، الثقيلة على السيرفر",
        "documentation": "/docs",
        "endpoints": {
            "health": f"{API_PREFIX}/health",
            "ping": f"{API_PREFIX}/ping",
            "compress": f"{API_PREFIX}/compress",
            "resize": f"{API_PREFIX}/resize",
            "template": f"{API_PREFIX}/template",
            "watermark": f"{API_PREFIX}/watermark",
            "background": f"{API_PREFIX}/background/remove",
        },
        "client_tools": {
            "info": "هذه الأدوات تعمل في المتصفح مباشرة (بدون سيرفر)",
            "tools": ["compress", "resize", "watermark"],
        },
        "server_tools": {
            "info": "هذه الأدوات تعمل على السيرفر (تحتاج اتصال)",
            "tools": ["template", "background"],
        },
    }


# ============================================================
# معالج الأخطاء العام
# ============================================================
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"❌ خطأ غير متوقع في {request.url.path}: {exc}", exc_info=True)
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
