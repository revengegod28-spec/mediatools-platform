"""
خدمة إضافة العلامة المائية
Watermark service
"""
import io
from PIL import Image, ImageDraw

from app.utils.image_helpers import get_font


async def add_text_watermark(
    contents: bytes,
    text: str,
    position: str = "bottom-right",
    opacity: float = 0.5,
    font_size_ratio: float = 0.05,
    color: str = "#FFFFFF",
) -> bytes:
    """
    إضافة علامة مائية نصية

    Args:
        contents: محتوى الصورة
        text: نص العلامة المائية
        position: الموقع
        opacity: الشفافية (0-1)
        font_size_ratio: نسبة حجم الخط لارتفاع الصورة
        color: لون النص (hex)
    """
    img = Image.open(io.BytesIO(contents))
    if img.mode != "RGBA":
        img = img.convert("RGBA")

    w, h = img.size
    overlay = Image.new("RGBA", img.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)

    font_size = max(20, int(h * font_size_ratio))
    font = get_font(font_size, bold=True)

    # حساب أبعاد النص
    text_bbox = draw.textbbox((0, 0), text, font=font)
    text_w = text_bbox[2] - text_bbox[0]
    text_h = text_bbox[3] - text_bbox[1]

    # تحديد الموقع
    margin = max(20, int(h * 0.02))
    positions = {
        "top-left": (margin, margin),
        "top-right": (w - text_w - margin, margin),
        "bottom-left": (margin, h - text_h - margin),
        "bottom-right": (w - text_w - margin, h - text_h - margin),
        "center": ((w - text_w) // 2, (h - text_h) // 2),
    }
    pos = positions.get(position, positions["bottom-right"])

    # تحويل اللون
    color = color.lstrip("#")
    rgb = tuple(int(color[i : i + 2], 16) for i in (0, 2, 4))
    alpha = int(255 * opacity)

    # إضافة ظل للنص لتحسين القراءة
    shadow_pos = (pos[0] + 2, pos[1] + 2)
    draw.text(shadow_pos, text, fill=(0, 0, 0, alpha), font=font)
    draw.text(pos, text, fill=(*rgb, alpha), font=font)

    # دمج مع الصورة الأصلية
    result = Image.alpha_composite(img, overlay)

    # تحويل إلى RGB للحفظ كـ JPEG
    final = Image.new("RGB", result.size, (255, 255, 255))
    final.paste(result, mask=result.split()[3] if result.mode == "RGBA" else None)

    output = io.BytesIO()
    final.save(output, format="JPEG", quality=92, optimize=True)
    output.seek(0)
    return output.getvalue()


async def add_image_watermark(
    contents: bytes,
    watermark_bytes: bytes,
    position: str = "bottom-right",
    opacity: float = 0.5,
    scale: float = 0.15,
) -> bytes:
    """
    إضافة علامة مائية من صورة (شعار)

    Args:
        contents: محتوى الصورة
        watermark_bytes: محتوى صورة العلامة المائية
        position: الموقع
        opacity: الشفافية (0-1)
        scale: نسبة حجم العلامة لعرض الصورة
    """
    img = Image.open(io.BytesIO(contents))
    if img.mode != "RGBA":
        img = img.convert("RGBA")

    wm_img = Image.open(io.BytesIO(watermark_bytes))
    wm_img = wm_img.convert("RGBA")

    w, h = img.size
    wm_w = int(w * scale)
    wm_h = int(wm_img.height * (wm_w / wm_img.width))
    wm_img = wm_img.resize((wm_w, wm_h), Image.LANCZOS)

    # تطبيق الشفافية
    alpha = wm_img.split()[3]
    alpha = alpha.point(lambda p: int(p * opacity))
    wm_img.putalpha(alpha)

    # تحديد الموقع
    margin = max(20, int(h * 0.02))
    positions = {
        "top-left": (margin, margin),
        "top-right": (w - wm_w - margin, margin),
        "bottom-left": (margin, h - wm_h - margin),
        "bottom-right": (w - wm_w - margin, h - wm_h - margin),
        "center": ((w - wm_w) // 2, (h - wm_h) // 2),
    }
    pos = positions.get(position, positions["bottom-right"])

    img.paste(wm_img, pos, wm_img)

    # تحويل إلى RGB للحفظ
    final = Image.new("RGB", img.size, (255, 255, 255))
    final.paste(img, mask=img.split()[3])

    output = io.BytesIO()
    final.save(output, format="JPEG", quality=92, optimize=True)
    output.seek(0)
    return output.getvalue()
