"""
مسار فحص صحة التطبيق
Health check router
"""
import platform
import sys
from fastapi import APIRouter
import psutil

from app.config import settings

router = APIRouter()


@router.get("/health", summary="فحص صحة الخدمة")
async def health_check():
    """فحص حالة الخدمة والبيئة"""
    return {
        "status": "healthy",
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
        "python_version": sys.version.split()[0],
        "platform": platform.system(),
        "max_file_size_mb": settings.MAX_FILE_SIZE_MB,
        "features": {
            "rembg_enabled": settings.ENABLE_REMBG,
            "rate_limit_enabled": settings.ENABLE_RATE_LIMIT,
        },
    }


@router.get("/info", summary="معلومات تفصيلية عن الخادم")
async def server_info():
    """معلومات تفصيلية عن بيئة التشغيل"""
    try:
        memory = psutil.virtual_memory()
        cpu_percent = psutil.cpu_percent(interval=0.1)
        return {
            "cpu_percent": cpu_percent,
            "memory_total_gb": round(memory.total / (1024 ** 3), 2),
            "memory_used_percent": memory.percent,
            "disk_usage_percent": psutil.disk_usage("/").percent,
            "python_version": platform.python_version(),
        }
    except Exception:
        return {"message": "Info endpoint requires psutil"}
