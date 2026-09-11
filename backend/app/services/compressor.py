"""
خدمة ضغط وتحويل الصور
Image compression and conversion service
"""
import io
from typing import Tuple
from PIL import Image

from app.config import settings


async def compress_image(
    contents: bytes,
    quality: int = 85,
    output_format: str = "JPEG",
    max_width: int = None,
    max_height: int = None,
    keep_metadata: bool = False,
) -> Tuple[bytes, dict]:
    """
    ضغط وتحويل صورة

    Args:
        contents: محتوى الصورة الأصلية
        quality: مستوى الجودة (1-100)
        output_format: صيغة الإخراج (JPEG, PNG, WEBP)
        max_width: أقصى عرض (اختياري)
        max_height: أقصى ارتفاع (اختياري)
        keep_metadata: الإبقاء على بيانات EXIF

    Returns:
        tuple: (الصورة المضغوطة, إحصائيات)
    """
    original_size = len(contents)
    img = Image.open(io.BytesIO(contents))

    # تحويل إلى RGB إذا لزم (لـ JPEG)
    if output_format == "JPEG" and img.mode in ("RGBA", "P", "LA"):
        background = Image.new("RGB", img.size, (255, 255, 255))
        if img.mode == "P":
            img = img.convert("RGBA")
        background.paste(img, mask=img.split()[-1] if img.mode in ("RGBA", "LA") else None)
        img = background
    elif output_format in ("JPEG", "WEBP") and img.mode != img.mode:
        img = img.convert("RGB")

    # تغيير الحجم إذا طُلب
    if max_width or max_height:
        img.thumbnail(
            (max_width or img.width, max_height or img.height),
            Image.LANCZOS,
        )

    # حفظ الصورة
    output = io.BytesIO()
    save_kwargs = {}

    if output_format == "JPEG":
        save_kwargs = {"quality": quality, "optimize": True, "progressive": True}
    elif output_format == "PNG":
        save_kwargs = {"optimize": True, "compress_level": 9}
    elif output_format == "WEBP":
        save_kwargs = {"quality": quality, "method": 6, "optimize": True}

    img.save(output, format=output_format, **save_kwargs)
    output.seek(0)
    compressed_bytes = output.getvalue()
    compressed_size = len(compressed_bytes)

    ratio = ((1 - compressed_size / original_size) * 100) if original_size > 0 else 0

    stats = {
        "original_size": original_size,
        "compressed_size": compressed_size,
        "compression_ratio": round(ratio, 2),
        "savings_kb": round((original_size - compressed_size) / 1024, 2),
        "original_format": Image.open(io.BytesIO(contents)).format,
        "output_format": output_format,
        "dimensions": {"width": img.width, "height": img.height},
    }

    return compressed_bytes, stats
