"""
خدمة توليد القوالب الإخبارية
News template generation service
"""
import io
import re
from PIL import Image, ImageDraw

from app.constants import NEWS_TEMPLATES
from app.utils.image_helpers import get_font, hex_to_rgb, wrap_text


def _reshape_arabic_text(text: str) -> str:
    """
    تشكيل النص العربي بشكل صحيح للعرض في PIL

    يستخدم arabic-reshaper لربط الحروف
    و python-bidi لخوارزمية BiDi
    """
    if not text:
        return text

    has_arabic = bool(re.search(r'[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]', text))

    if has_arabic:
        try:
            import arabic_reshaper
            from bidi.algorithm import get_display
            reshaped = arabic_reshaper.reshape(text)
            bidi_text = get_display(reshaped)
            return bidi_text
        except ImportError:
            return text

    return text


async def generate_news_template(
    template_id: str,
    headline: str,
    subheadline: str = "",
    logo_bytes: bytes = None,
    background_image_bytes: bytes = None,
) -> bytes:
    if template_id not in NEWS_TEMPLATES:
        raise ValueError(f"قالب غير موجود: {template_id}")

    config = NEWS_TEMPLATES[template_id]
    width = config["width"]
    height = config["height"]

    headline = _reshape_arabic_text(headline)
    subheadline = _reshape_arabic_text(subheadline)

    canvas = Image.new("RGB", (width, height), hex_to_rgb(config["bg_color"]))
    draw = ImageDraw.Draw(canvas)

    if background_image_bytes:
        try:
            bg_img = Image.open(io.BytesIO(background_image_bytes)).convert("RGB")
            bg_img = bg_img.resize((width, height), Image.LANCZOS)
            overlay = Image.new("RGB", (width, height), hex_to_rgb(config["bg_color"]))
            blended = Image.blend(bg_img, overlay, 0.45)
            canvas.paste(blended, (0, 0))
            draw = ImageDraw.Draw(canvas)
        except Exception:
            pass

    font_size_headline = max(48, int(height * 0.09))
    font_size_subheadline = max(24, int(height * 0.04))
    font_headline = get_font(font_size_headline, bold=True)
    font_subheadline = get_font(font_size_subheadline, bold=False)

    max_text_width = int(width * 0.85)
    lines = wrap_text(headline, font_headline, max_text_width, draw)

    line_heights = []
    line_widths = []
    for line in lines:
        bbox = draw.textbbox((0, 0), line, font=font_headline)
        line_heights.append(bbox[3] - bbox[1])
        line_widths.append(bbox[2] - bbox[0])

    total_text_height = sum(line_heights) + (len(lines) - 1) * 10
    start_y = (height - total_text_height) // 2 - 20

    shadow_offset = 4
    accent_rgb = hex_to_rgb(config["accent_color"])
    text_rgb = hex_to_rgb(config["text_color"])

    current_y = start_y
    for i, line in enumerate(lines):
        line_width = line_widths[i]
        line_height = line_heights[i]
        x = (width - line_width) // 2

        draw.text(
            (x + shadow_offset, current_y + shadow_offset),
            line,
            fill=(0, 0, 0, 200),
            font=font_headline,
        )
        draw.text((x, current_y), line, fill=text_rgb, font=font_headline)
        current_y += line_height + 10

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

    if logo_bytes:
        try:
            logo_img = Image.open(io.BytesIO(logo_bytes))
            logo_img.thumbnail((250, 250), Image.LANCZOS)
            logo_x = width - logo_img.width - 40
            logo_y = 40
            if logo_img.mode == "RGBA":
                canvas.paste(logo_img, (logo_x, logo_y), logo_img)
            else:
                canvas.paste(logo_img, (logo_x, logo_y))
        except Exception:
            pass

    bar_height = 10
    draw.rectangle([0, 0, width, bar_height], fill=accent_rgb)
    draw.rectangle([0, height - bar_height, width, height], fill=accent_rgb)

    side_bar_width = 12
    draw.rectangle([0, 0, side_bar_width, height], fill=accent_rgb)

    output = io.BytesIO()
    canvas.save(output, format="JPEG", quality=95, optimize=True)
    output.seek(0)
    return output.getvalue()
