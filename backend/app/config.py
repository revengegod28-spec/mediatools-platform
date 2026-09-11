"""
إعدادات التطبيق المركزية
Central application configuration
"""
import os
from pathlib import Path
from typing import List
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """إعدادات التطبيق تُقرأ من متغيرات البيئة أو ملف .env"""

    # المعلومات الأساسية
    APP_NAME: str = "Quick Media & Content Tools"
    APP_VERSION: str = "1.0.0"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    DEBUG: bool = os.getenv("DEBUG", "true").lower() == "true"

    # CORS - نطاقات مسموح لها بالوصول
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:8000",
        "https://*.vercel.app",
        "https://*.onrender.com",
        "*",  # في الإنتاج: حدد النطاقات بدقة
    ]

    # حدود الملفات
    MAX_FILE_SIZE_MB: int = 10
    MAX_FILE_SIZE: int = MAX_FILE_SIZE_MB * 1024 * 1024
    ALLOWED_IMAGE_TYPES: List[str] = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
        "image/bmp",
        "image/tiff",
    ]
    ALLOWED_IMAGE_EXTENSIONS: List[str] = [
        ".jpg",
        ".jpeg",
        ".png",
        ".webp",
        ".bmp",
        ".tiff",
    ]

    # مسارات التخزين
    BASE_DIR: Path = Path(__file__).resolve().parent.parent
    UPLOAD_DIR: Path = BASE_DIR / "storage" / "uploads"
    TEMPLATES_DIR: Path = BASE_DIR / "storage" / "templates"
    FONTS_DIR: Path = BASE_DIR / "storage" / "fonts"

    # ضغط الصور
    DEFAULT_QUALITY: int = 85
    MIN_QUALITY: int = 1
    MAX_QUALITY: int = 100

    # الأمان ومعدل الطلبات
    RATE_LIMIT_PER_MINUTE: int = 60
    ENABLE_RATE_LIMIT: bool = os.getenv("ENABLE_RATE_LIMIT", "false").lower() == "true"

    # ميزات اختيارية
    ENABLE_REMBG: bool = os.getenv("ENABLE_REMBG", "true").lower() == "true"
    ENABLE_ADS: bool = os.getenv("ENABLE_ADS", "true").lower() == "true"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True


# إنشاء instance عام للاستخدام في كل المشروع
settings = Settings()
