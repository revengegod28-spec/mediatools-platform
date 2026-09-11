"""
مساعدات معالجة الصور المشتركة
Shared image processing helpers
"""
import io
import os
from pathlib import Path
from typing import Tuple, Optional
from PIL import Image, ImageDraw, ImageFont


# ============================================================
# مسارات الخطوط الافتراضية (حسب نظام التشغيل)
# ============================================================
FONT_CANDIDATES = [
    # Windows
    "C:/Windows/Fonts/arialbd.ttf",  # Arial Bold
    "C:/Windows/Fonts/arial.ttf",
    "C:/Windows/Fonts/tahoma.ttf",
    "C:/Windows/Fonts/calibrib.ttf",
    # Linux
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
    "/usr/share/fonts/TTF/DejaVuSans-Bold.ttf",
    # macOS
    "/System/Library/Fonts/Helvetica.ttc",
    "/Library/Fonts/Arial.ttf",
    # Fallback local
    "fonts/arial.ttf",
    "arial.ttf",
]


def get_font(size: int = 48, bold: bool = True) -> ImageFont.FreeTypeFont:
    """
    الحصول على خط متاح في النظام

    Args:
        size: حجم الخط بالبكسل
        bold: هل الخط عريض

    Returns:
        خط PIL أو الخط الافتراضي إذا لم يُعثر على أي خط
    """
    candidates = FONT_CANDIDATES
    if not bold:
        # إذا كنا نريد خطاً عادياً، نبحث عن النسخ غير العريضة أيضاً
        candidates = [
            "C:/Windows/Fonts/arial.ttf",
            "C:/Windows/Fonts/tahoma.ttf",
        ] + FONT_CANDIDATES

    for font_path in candidates:
        try:
            if os.path.exists(font_path):
                return ImageFont.truetype(font_path, size)
        except Exception:
            continue

    # Fallback إلى الخط الافتراضي
    return ImageFont.load_default()


def calculate_aspect_ratio_fit(
    src_size: Tuple[int, int],
    dst_size: Tuple[int, int],
    fit_mode: str = "cover",
) -> Tuple[int, int, Tuple[int, int]]:
    """
    حساب المقاس الجديد للمع الحفاظ على نسبة الأبعاد

    Args:
        src_size: المقاس الأصلي (width, height)
        dst_size: المقاس المستهدف (width, height)
        fit_mode: 'cover' (قص), 'contain' (احتواء), 'stretch' (تمدد)

    Returns:
        tuple: (العرض الجديد, الارتفاع الجديد, (إزاحة x, إزاحة y))
    """
    src_w, src_h = src_size
    dst_w, dst_h = dst_size
    src_ratio = src_w / src_h
    dst_ratio = dst_w / dst_h

    if fit_mode == "stretch":
        return dst_w, dst_h, (0, 0)

    if fit_mode == "contain":
        if src_ratio > dst_ratio:
            new_w = dst_w
            new_h = int(dst_w / src_ratio)
        else:
            new_h = dst_h
            new_w = int(dst_h * src_ratio)
    else:  # cover (الافتراضي)
        if src_ratio > dst_ratio:
            new_h = dst_h
            new_w = int(dst_h * src_ratio)
        else:
            new_w = dst_w
            new_h = int(dst_w / src_ratio)

    offset_x = (dst_w - new_w) // 2
    offset_y = (dst_h - new_h) // 2
    return new_w, new_h, (offset_x, offset_y)


def hex_to_rgb(hex_color: str) -> Tuple[int, int, int]:
    """تحويل لون hex إلى RGB tuple"""
    hex_color = hex_color.lstrip("#")
    return tuple(int(hex_color[i : i + 2], 16) for i in (0, 2, 4))


def wrap_text(
    text: str,
    font: ImageFont.FreeTypeFont,
    max_width: int,
    draw: Optional[ImageDraw.ImageDraw] = None,
) -> list:
    """
    التفاف النص ليتناسب مع عرض معين

    Args:
        text: النص المراد تفافيه
        font: خط PIL
        max_width: أقصى عرض بالبكسل
        draw: كائن ImageDraw (اختياري، للأداء)

    Returns:
        list: قائمة الأسطر
    """
    if draw is None:
        draw = ImageDraw.Draw(Image.new("RGB", (1, 1)))

    words = text.split()
    if not words:
        return [""]

    lines = []
    current_line = words[0]

    for word in words[1:]:
        test_line = f"{current_line} {word}"
        bbox = draw.textbbox((0, 0), test_line, font=font)
        if bbox[2] - bbox[0] <= max_width:
            current_line = test_line
        else:
            lines.append(current_line)
            current_line = word

    lines.append(current_line)
    return lines


def image_to_bytes(img: Image.Image, format: str = "JPEG", quality: int = 85) -> Tuple[bytes, int]:
    """
    تحويل صورة PIL إلى bytes

    Returns:
        tuple: (الصورة كـ bytes, حجم الملف بالبايت)
    """
    buffer = io.BytesIO()
    save_kwargs = {"format": format, "optimize": True}

    if format == "JPEG":
        save_kwargs["quality"] = quality
    elif format == "WEBP":
        save_kwargs["quality"] = quality
        save_kwargs["method"] = 6

    img.save(buffer, **save_kwargs)
    buffer.seek(0)
    return buffer.getvalue(), buffer.getbuffer().nbytes


def create_thumbnail(img: Image.Image, max_size: int = 300) -> Image.Image:
    """إنشاء مصغرة لصورة"""
    img = img.copy()
    img.thumbnail((max_size, max_size), Image.LANCZOS)
    return img
