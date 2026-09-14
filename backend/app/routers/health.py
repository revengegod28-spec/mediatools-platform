"""
مسار فحص صحة التطبيق (محسّن لكشف الصحوة من النوم)
Health check router (enhanced for cold start detection)
"""
import time
import platform
import sys
from fastapi import APIRouter
import psutil

from app.config import settings

router = APIRouter()

# وقت بدء التطبيق (يُستخدم لحساب uptime)
START_TIME = time.time()


@router.get("/health", summary="فحص صحة الخدمة (سريع)")
async def health_check():
    """
    فحص سريع لصحة الخدمة. يُستخدم من Frontend لكشف الصحوة من النوم.

    Response سريع جداً (< 50ms) لأن السيرفر يكون مستيقظاً فور رده.
    """
    return {
        "status": "healthy",
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
        "uptime_seconds": round(time.time() - START_TIME, 2),
        "python_version": sys.version.split()[0],
        "platform": platform.system(),
        "max_file_size_mb": settings.MAX_FILE_SIZE_MB,
        "features": {
            "rembg_enabled": settings.ENABLE_REMBG,
            "rate_limit_enabled": settings.ENABLE_RATE_LIMIT,
        },
        "tools_available": ["template", "background"],
        "client_tools": ["compress", "resize", "watermark"],
        "timestamp": int(time.time()),
    }


@router.get("/ping", summary="فحص اتصال سريع جداً")
async def ping():
    """أبسط فحص اتصال — يُستخدم من health-manager.js"""
    return {"pong": True}


@router.get("/wake", summary="إيقاظ السيرفر")
async def wake_up():
    """
    نقطة مخصصة لإيقاظ السيرفر من النوم. يمكن استدعاؤها دورياً.
    """
    return {
        "awake": True,
        "uptime_seconds": round(time.time() - START_TIME, 2),
        "message": "Server is awake and ready",
    }


@router.get("/info", summary="معلومات تفصيلية عن الخادم")
async def server_info():
    """معلومات تفصيلية عن بيئة التشغيل (للمراقبة)"""
    try:
        memory = psutil.virtual_memory()
        cpu_percent = psutil.cpu_percent(interval=0.1)
        return {
            "status": "healthy",
            "uptime_seconds": round(time.time() - START_TIME, 2),
            "cpu_percent": cpu_percent,
            "memory": {
                "total_gb": round(memory.total / (1024 ** 3), 2),
                "used_percent": memory.percent,
                "available_gb": round(memory.available / (1024 ** 3), 2),
            },
            "disk": {
                "usage_percent": psutil.disk_usage("/").percent,
            },
            "python_version": platform.python_version(),
        }
    except Exception:
        return {
            "status": "healthy",
            "uptime_seconds": round(time.time() - START_TIME, 2),
            "note": "Detailed metrics require psutil",
        }
