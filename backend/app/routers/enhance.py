"""
مسار تحسين وتوضيح جودة الصور (AI Image Enhancer)
Image enhancement router (Sharpen, Denoise, Upscale)
"""
import io
from enum import Enum
from fastapi import APIRouter, File, UploadFile, Query, HTTPException
from fastapi.responses import StreamingResponse

from app.utils.validators import validate_image_file

router = APIRouter(prefix="/enhance", tags=["🔍 تحسين جودة الصور"])


class EnhanceMode(str, Enum):
    """أنماط التحسين المتاحة"""
    STANDARD = "standard"      # شحذ + رفع دقة 2x
    SHARPEN = "sharpen"        # شحذ فقط (Unsharp Mask)
    DENOISE = "denoise"        # إزالة ضوضاء فقط
    HD = "hd"                  # شحذ قوي + CLAHE + 2x scale
    ULTRA = "ultra"            # أعلى جودة (4x scale + جميع التحسينات)


# ============================================================
# دوال المعالجة المساعدة
# ============================================================

def _apply_unsharp_mask(img, amount: float = 1.5, sigma: float = 1.0):
    """
    Unsharp Masking - زيادة حدة التفاصيل

    Args:
        img: numpy array (BGR)
        amount: قوة التوضيح (0.5 - 3.0)
        sigma: نصف القطر للتمويه (0.5 - 3.0)
    """
    import cv2
    blurred = cv2.GaussianBlur(img, (0, 0), sigma)
    sharpened = cv2.addWeighted(img, 1.0 + amount, blurred, -amount, 0)
    return sharpened


def _apply_clahe(img, clip_limit: float = 2.0):
    """
    CLAHE - تحسين التباين بطريقة محلية (Contrast Limited Adaptive Histogram Equalization)
    """
    import cv2
    lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=clip_limit, tileGridSize=(8, 8))
    l = clahe.apply(l)
    lab = cv2.merge((l, a, b))
    return cv2.cvtColor(lab, cv2.COLOR_LAB2BGR)


def _apply_denoise(img, strength: int = 7):
    """
    إزالة الضوضاء مع الحفاظ على الحواف (Bilateral Filter)

    Args:
        img: numpy array
        strength: قوة التنظيف (3-15)
    """
    import cv2
    return cv2.bilateralFilter(img, d=9, sigmaColor=strength * 3, sigmaSpace=strength * 2)


def _upscale_bicubic(img, scale: int):
    """
    رفع الدقة باستخدام INTER_CUBIC (جودة عالية)
    """
    import cv2
    if scale == 1:
        return img
    h, w = img.shape[:2]
    new_w, new_h = w * scale, h * scale
    return cv2.resize(img, (new_w, new_h), interpolation=cv2.INTER_CUBIC)


def _upscale_lanczos(img, scale: int):
    """
    رفع الدقة باستخدام Lanczos (أعلى جودة، أبطأ)
    """
    import cv2
    if scale == 1:
        return img
    h, w = img.shape[:2]
    new_w, new_h = w * scale, h * scale
    return cv2.resize(img, (new_w, new_h), interpolation=cv2.INTER_LANCZOS4)


def _enhance_pipeline(contents: bytes, mode: str, scale: int) -> bytes:
    """
    خط أنابيب التحسين الرئيسي

    Args:
        contents: الصورة الأصلية كـ bytes
        mode: نمط التحسين (standard, sharpen, denoise, hd, ultra)
        scale: معامل التكبير (1, 2, or 4)

    Returns:
        bytes: الصورة المحسنة كـ PNG
    """
    import cv2
    import numpy as np

    # قراءة الصورة
    nparr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_UNCHANGED)
    if img is None:
        raise ValueError("تعذر قراءة الصورة")

    # التعامل مع قناة الألفا إن وجدت
    has_alpha = len(img.shape) == 3 and img.shape[2] == 4
    if has_alpha:
        alpha = img[:, :, 3]
        bgr = img[:, :, :3]
    else:
        bgr = img
        alpha = None

    # تطبيق نمط التحسين
    if mode == "sharpen":
        # توضيح فقط
        result = _apply_unsharp_mask(bgr, amount=1.8, sigma=1.0)

    elif mode == "denoise":
        # إزالة ضوضاء فقط
        result = _apply_denoise(bgr, strength=8)

    elif mode == "hd":
        # شحذ + تباين + 2x
        result = _apply_unsharp_mask(bgr, amount=1.5, sigma=0.8)
        result = _apply_clahe(result, clip_limit=2.5)
        result = _upscale_lanczos(result, 2)

    elif mode == "ultra":
        # أعلى جودة - جميع التحسينات + 4x
        result = _apply_denoise(bgr, strength=5)  # تنظيف خفيف أولاً
        result = _apply_unsharp_mask(result, amount=1.2, sigma=0.6)
        result = _apply_clahe(result, clip_limit=2.0)
        result = _upscale_lanczos(result, 4)

    else:  # standard
        # الافتراضي: توضيح + 2x
        result = _apply_unsharp_mask(bgr, amount=1.5, sigma=0.8)
        result = _upscale_bicubic(result, scale)

    # إعادة دمج قناة الألفا إن وجدت
    if has_alpha:
        result = cv2.cvtColor(result, cv2.COLOR_BGR2BGRA)
        result[:, :, 3] = alpha

    # حفظ كـ PNG بجودة عالية
    is_success, buffer = cv2.imencode(".png", result, [
        cv2.IMWRITE_PNG_COMPRESSION, 6
    ])
    if not is_success:
        raise RuntimeError("فشل حفظ الصورة المحسنة")

    return buffer.tobytes()


# ============================================================
# المسارات (Endpoints)
# ============================================================

@router.post(
    "",
    summary="تحسين جودة الصورة (توضيح + رفع دقة)",
    description="تحسين جودة الصورة عبر توضيح التفاصيل وإزالة الضوضاء ورفع الدقة باستخدام خوارزميات OpenCV المتقدمة.",
)
async def enhance_image(
    file: UploadFile = File(..., description="الصورة المراد تحسينها"),
    mode: EnhanceMode = Query(
        EnhanceMode.STANDARD,
        description="نمط التحسين: standard (افتراضي), sharpen, denoise, hd, ultra",
    ),
    scale: int = Query(
        2,
        ge=1,
        le=4,
        description="معامل التكبير (1=بدون, 2=مزدوج, 4=رباعي)",
    ),
):
    """
    تحسين جودة الصورة وإرجاعها بصيغة PNG عالية الجودة.

    الأوضاع المتاحة:
    - **standard**: توضيح + رفع دقة 2x (موصى به)
    - **sharpen**: توضيح فقط بدون تغيير المقاس
    - **denoise**: إزالة ضوضاء فقط
    - **hd**: توضيح + تباين + رفع دقة 2x (جودة عالية)
    - **ultra**: جميع التحسينات + رفع دقة 4x (أعلى جودة)
    """
    try:
        contents, _ = await validate_image_file(file)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"فشل قراءة الصورة: {str(e)}")

    try:
        result_bytes = _enhance_pipeline(contents, mode.value, scale)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"خطأ في المعالجة: {str(e)}")

    h, w = (
        __import__("cv2").imdecode(
            __import__("numpy").frombuffer(result_bytes, __import__("numpy").uint8),
            __import__("cv2").IMREAD_UNCHANGED,
        ).shape[:2]
    )

    return StreamingResponse(
        io.BytesIO(result_bytes),
        media_type="image/png",
        headers={
            "Content-Disposition": 'attachment; filename="enhanced_image.png"',
            "X-Mode": mode.value,
            "X-Scale": str(scale),
            "X-Width": str(w),
            "X-Height": str(h),
            "X-Output-Size": str(len(result_bytes)),
        },
    )


@router.get("/modes", summary="أنماط التحسين المتاحة")
async def get_modes():
    """قائمة بجميع أنماط التحسين المتاحة مع أوصافها"""
    return {
        "modes": [
            {
                "id": "standard",
                "name": "افتراضي (Standard)",
                "description": "توضيح تفاصيل + رفع دقة 2x. مناسب لمعظم الصور.",
                "recommended": True,
            },
            {
                "id": "sharpen",
                "name": "توضيح فقط (Sharpen)",
                "description": "زيادة حدة التفاصيل بدون تغيير المقاس. ممتاز للصور الواضحة أصلاً.",
            },
            {
                "id": "denoise",
                "name": "إزالة ضوضاء (Denoise)",
                "description": "تنظيف الصورة من التشويش. مفيد للصور الملتقطة في إضاءة ضعيفة.",
            },
            {
                "id": "hd",
                "name": "HD - جودة عالية",
                "description": "توضيح + تحسين تباين + رفع دقة 2x. نتائج احترافية.",
            },
            {
                "id": "ultra",
                "name": "Ultra - أعلى جودة",
                "description": "جميع التحسينات + رفع دقة 4x. الأفضل للصور المطبوعة.",
            },
        ],
        "scales": {
            "1": "بدون تكبير",
            "2": "مزدوج (موصى به)",
            "4": "رباعي (للصور عالية الجودة فقط)",
        },
        "client_side": "النسخة الأساسية تُعالَج في المتصفح فورياً. هذا الـ endpoint للجودة الفائقة.",
    }
