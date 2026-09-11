"""
خدمة توليد القوالب الإخبارية
News template generation service
"""
import io
from PIL import Image, ImageDraw

from app.constants import NEWS_TEMPLATES
from app.utils.image_helpers import get_font, hex_to_rgb, wrap_text


async def generate_news_template(
    template_id: str,
    headline: str,
    subheadline: str = "",
    logo_bytes: bytes = None,
    background_image_bytes: bytes = None,
) -> bytes:
    """
    توليد قالب إخباري احترافي

    Args:
        template_id: معرف القالب
        headline: العنوان الرئيسي
        subheadline: العنوان الفرعي (اختياري)
        logo_bytes: محتوى الشعار (اختياري)
        background_image_bytes: محتوى صورة الخلفية (اختياري)

    Returns:
        bytes: الصورة المولدة
    """
    if template_id not in NEWS_TEMPLATES:
        raise ValueError(f"قالب غير موجود: {template_id}")

    config = NEWS_TEMPLATES[template_id]
    width = config["width"]
    height = config["height"]

    # إنشاء اللوحة الأساسية
    canvas = Image.new("RGB", (width, height), hex_to_rgb(config["bg_color"]))
    draw = ImageDraw.Draw(canvas)

    # إضافة صورة الخلفية إذا وُجدت
    if background_image_bytes:
        try:
            bg_img = Image.open(io.BytesIO(background_image_bytes)).convert("RGB")
            bg_img = bg_img.resize((width, height), Image.LANCZOS)
            # مزج مع تدرج لوني للخلفية
            overlay = Image.new("RGB", (width, height), hex_to_rgb(config["bg_color"]))
            blended = Image.blend(bg_img, overlay, 0.45)
            canvas.paste(blended, (0, 0))
            draw = ImageDraw.Draw(canvas)
        except Exception:
            pass  # نكمل بدون الخلفية إذا فشلت

    # إعداد الخطوط
    font_size_headline = max(48, int(height * 0.09))
    font_size_subheadline = max(24, int(height * 0.04))
    font_headline = get_font(font_size_headline, bold=True)
    font_subheadline = get_font(font_size_subheadline, bold=False)

    # التفاف العنوان
    max_text_width = int(width * 0.85)
    lines = wrap_text(headline, font_headline, max_text_width, draw)

    # حساب أبعاد السطر
    line_heights = []
    line_widths = []
    for line in lines:
        bbox = draw.textbbox((0, 0), line, font=font_headline)
        line_heights.append(bbox[3] - bbox[1])
        line_widths.append(bbox[2] - bbox[0])

    total_text_height = sum(line_heights) + (len(lines) - 1) * 10
    start_y = (height - total_text_height) // 2 - 20

    # رسم العنوان مع ظل خفيف
    shadow_offset = 4
    accent_rgb = hex_to_rgb(config["accent_color"])
    text_rgb = hex_to_rgb(config["text_color"])

    current_y = start_y
    for i, line in enumerate(lines):
        line_width = line_widths[i]
        line_height = line_heights[i]
        x = (width - line_width) // 2

        # ظل أسود خفيف
        draw.text(
            (x + shadow_offset, current_y + shadow_offset),
            line,
            fill=(0, 0, 0, 200),
            font=font_headline,
        )
        # النص الرئيسي
        draw.text((x, current_y), line, fill=text_rgb, font=font_headline)
        current_y += line_height + 10

    # إضافة العنوان الفرعي
    if subheadline:
        sub_lines = wrap_text(subheadline, font_subheadline, max_text_width, draw)
        current_y += 20
        for sub_line in sub_lines:
            sub_bbox = draw.textbbox((0, 0), sub_line, font=font_subheadline)
            sub_w = sub_bbox[2] - sub_bbox[0]
            sub_x = (width - sub_w) // 2
            draw.text(
                (sub_x + 2, current_y + 2),
                sub_line,
                fill=(0, 0, 0),
                font=font_subheadline,
            )
            draw.text(
                (sub_x, current_y),
                sub_line,
                fill=accent_rgb,
                font=font_subheadline,
            )
            sub_h = sub_bbox[3] - sub_bbox[1]
            current_y += sub_h + 5

    # إضافة الشعار إذا وُجد
    if logo_bytes:
        try:
            logo_img = Image.open(io.BytesIO(logo_bytes))
            logo_img.thumbnail((250, 250), Image.LANCZOS)
            # الزاوية العلوية اليمنى
            logo_x = width - logo_img.width - 40
            logo_y = 40
            if logo_img.mode == "RGBA":
                canvas.paste(logo_img, (logo_x, logo_y), logo_img)
            else:
                canvas.paste(logo_img, (logo_x, logo_y))
        except Exception:
            pass

    # إضافة خطوط زخرفية علوية وسفلية
    bar_height = 10
    draw.rectangle([0, 0, width, bar_height], fill=accent_rgb)
    draw.rectangle([0, height - bar_height, width, height], fill=accent_rgb)

    # إضافة شريط جانبي
    side_bar_width = 12
    draw.rectangle([0, 0, side_bar_width, height], fill=accent_rgb)

    # حفظ
    output = io.BytesIO()
    canvas.save(output, format="JPEG", quality=95, optimize=True)
    output.seek(0)
    return output.getvalue()
