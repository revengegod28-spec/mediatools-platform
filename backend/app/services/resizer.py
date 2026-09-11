"""
خدمة تعديل مقاسات الصور
Image resizing service for social media platforms
"""
import io
from PIL import Image

from app.utils.image_helpers import calculate_aspect_ratio_fit, hex_to_rgb


async def resize_for_platform(
    contents: bytes,
    target_width: int,
    target_height: int,
    fit_mode: str = "cover",
    background_color: str = "#FFFFFF",
) -> bytes:
    """
    تعديل حجم الصورة لمقاس منصة معينة

    Args:
        contents: محتوى الصورة
        target_width: العرض المستهدف
        target_height: الارتفاع المستهدف
        fit_mode: طريقة الملاءمة (cover, contain, stretch)
        background_color: لون الخلفية (hex)

    Returns:
        bytes: الصورة بعد التعديل
    """
    img = Image.open(io.BytesIO(contents))

    # تحويل إلى RGB
    if img.mode != "RGB":
        img = img.convert("RGB")

    src_size = (img.width, img.height)
    dst_size = (target_width, target_height)

    # حساب المقاس الجديد مع الحفاظ على النسبة
    new_w, new_h, (offset_x, offset_y) = calculate_aspect_ratio_fit(
        src_size, dst_size, fit_mode
    )

    # تغيير الحجم
    img_resized = img.resize((new_w, new_h), Image.LANCZOS)

    # إنشاء لوحة بمقاس المنصة
    bg_rgb = hex_to_rgb(background_color)
    canvas = Image.new("RGB", dst_size, bg_rgb)
    canvas.paste(img_resized, (offset_x, offset_y))

    # حفظ بجودة عالية
    output = io.BytesIO()
    canvas.save(output, format="JPEG", quality=92, optimize=True)
    output.seek(0)
    return output.getvalue()
