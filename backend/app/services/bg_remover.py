"""
خدمة تفريغ الخلفيات
Background removal service
"""
import io
import numpy as np
from PIL import Image


# الحد الأقصى لأبعاد الصورة قبل المعالجة (لتقليل استهلاك الذاكرة)
MAX_PROCESSING_DIM = 800


async def _resize_if_needed(img_cv):
    """تصغير الصورة إذا كانت أكبر من الحد المسموح"""
    import cv2
    h, w = img_cv.shape[:2]
    max_dim = max(h, w)
    if max_dim > MAX_PROCESSING_DIM:
        scale = MAX_PROCESSING_DIM / max_dim
        new_w = int(w * scale)
        new_h = int(h * scale)
        return cv2.resize(img_cv, (new_w, new_h), interpolation=cv2.INTER_AREA), scale
    return img_cv, 1.0


async def remove_background_simple(contents: bytes, threshold: int = 240) -> bytes:
    """
    تفريغ الخلفية بالطريقة البسيطة (للخلفية البيضاء أو الموحدة)

    Args:
        contents: محتوى الصورة
        threshold: حد الكشف عن الخلفية (200-255)

    Returns:
        bytes: الصورة بشفافية
    """
    import cv2

    nparr = np.frombuffer(contents, np.uint8)
    img_cv = cv2.imdecode(nparr, cv2.IMREAD_UNCHANGED)

    if img_cv is None:
        raise ValueError("تعذر قراءة الصورة")

    # تصغير الصورة إذا كانت كبيرة (توفير ذاكرة ووقت)
    img_cv, scale = await _resize_if_needed(img_cv)

    # إذا كانت الصورة تحتوي على قناة ألفا بالفعل، نستخدمها مباشرة
    if len(img_cv.shape) == 3 and img_cv.shape[2] == 4:
        # استخدام قناة الألفا الموجودة
        mask = img_cv[:, :, 3]
        bgr = img_cv[:, :, :3]
    else:
        bgr = img_cv
        # خوارزمية GrabCut لتحديد المقدمة (سريعة - 3 تكرارات فقط)
        mask = np.zeros(bgr.shape[:2], np.uint8)
        bgd_model = np.zeros((1, 65), np.float64)
        fgd_model = np.zeros((1, 65), np.float64)
        h, w = bgr.shape[:2]
        rect = (
            max(2, w // 20),
            max(2, h // 20),
            w - max(4, w // 10),
            h - max(4, h // 10),
        )
        try:
            # 3 تكرارات فقط (بدلاً من 5) للسرعة
            cv2.grabCut(bgr, mask, rect, bgd_model, fgd_model, 3, cv2.GC_INIT_WITH_RECT)
            mask = np.where((mask == 2) | (mask == 0), 0, 1).astype("uint8") * 255
        except Exception:
            # fallback: threshold based
            gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)
            _, mask = cv2.threshold(gray, threshold, 255, cv2.THRESH_BINARY)

    # دمج القناع مع الصورة
    result = cv2.bitwise_and(bgr, bgr, mask=mask)

    # إعادة تكبير القناع للحجم الأصلي إذا تم التصغير
    if scale != 1.0:
        mask = cv2.resize(mask, (int(bgr.shape[1] / scale), int(bgr.shape[0] / scale)),
                          interpolation=cv2.INTER_LINEAR)
        # إعادة تطبيق القناع على الصورة الأصلية
        original = cv2.imdecode(nparr, cv2.IMREAD_UNCHANGED)
        if len(original.shape) == 3 and original.shape[2] == 4:
            bgr_full = original[:, :, :3]
        else:
            bgr_full = original
        result = cv2.bitwise_and(bgr_full, bgr_full, mask=mask)
        bgr = bgr_full

    # إضافة قناة ألفا
    bgra = np.dstack([result, mask])

    # حفظ كـ PNG مع شفافية
    is_success, buffer = cv2.imencode(".png", bgra)
    if not is_success:
        raise RuntimeError("فشل حفظ الصورة")

    return buffer.tobytes()


async def remove_background_ai(contents: bytes) -> bytes:
    """
    تفريغ الخلفية بالذكاء الاصطناعي (rembg)

    Args:
        contents: محتوى الصورة
    """
    try:
        from rembg import remove

        result_bytes = remove(contents)
        return result_bytes
    except ImportError:
        raise RuntimeError(
            "مكتبة rembg غير مثبتة. استخدم الطريقة البسيطة أو ثبّت rembg"
        )


async def remove_background_auto(contents: bytes) -> bytes:
    """
    تفريغ الخلفية تلقائياً - يستخدم AI إذا كان متاحاً وإلا يستخدم الطريقة البسيطة

    Args:
        contents: محتوى الصورة
    """
    from app.config import settings

    if settings.ENABLE_REMBG:
        try:
            return await remove_background_ai(contents)
        except Exception:
            # fallback إلى الطريقة البسيطة
            return await remove_background_simple(contents)
    else:
        return await remove_background_simple(contents)
