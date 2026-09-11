"""
أدوات التحقق من الملفات والصور
File and image validation utilities
"""
from pathlib import Path
from typing import Tuple
from fastapi import UploadFile, HTTPException
from PIL import Image

from app.config import settings
from app.constants import ALLOWED_EXTENSIONS


async def validate_image_file(file: UploadFile) -> Tuple[bytes, str]:
    """
    التحقق من صحة ملف الصورة المرفوع

    Args:
        file: ملف مرفوع من FastAPI

    Returns:
        tuple: (محتوى الملف، نوع MIME)

    Raises:
        HTTPException: إذا كان الملف غير صالح
    """
    # التحقق من وجود ملف
    if not file:
        raise HTTPException(status_code=400, detail="لم يتم إرسال أي ملف")

    # التحقق من اسم الملف
    if not file.filename:
        raise HTTPException(status_code=400, detail="اسم الملف غير موجود")

    # التحقق من امتداد الملف
    file_ext = Path(file.filename).suffix.lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"صيغة الملف غير مدعومة. الصيغ المدعومة: {', '.join(ALLOWED_EXTENSIONS)}",
        )

    # قراءة محتوى الملف
    contents = await file.read()

    # التحقق من الحجم
    if len(contents) > settings.MAX_FILE_SIZE:
        size_mb = len(contents) / (1024 * 1024)
        raise HTTPException(
            status_code=413,
            detail=f"حجم الملف ({size_mb:.1f}MB) يتجاوز الحد المسموح ({settings.MAX_FILE_SIZE_MB}MB)",
        )

    # التحقق من نوع MIME
    mime_type = file.content_type or "image/jpeg"
    if mime_type not in settings.ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"نوع الملف غير مدعوم: {mime_type}",
        )

    # التحقق من سلامة الصورة
    try:
        img = Image.open(__import__("io").BytesIO(contents))
        img.verify()
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"الملف تالف أو ليس صورة صالحة: {str(e)}",
        )

    return contents, mime_type


def validate_hex_color(color: str) -> bool:
    """التحقق من صحة لون hex"""
    import re
    pattern = r"^#(?:[0-9a-fA-F]{3}){1,2}$"
    return bool(re.match(pattern, color))


def sanitize_filename(filename: str) -> str:
    """تنظيف اسم الملف من الأحرف الخطيرة"""
    import re
    # إزالة الأحرف غير الآمنة
    safe = re.sub(r"[^\w\s\-_.]", "", filename)
    # استبدال المسافات المتعددة بمسافة واحدة
    safe = re.sub(r"\s+", "_", safe)
    return safe[:100]  # حد أقصى 100 حرف
