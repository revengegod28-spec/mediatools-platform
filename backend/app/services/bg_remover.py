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
        h, w = bgr.shape[:2]

        # خوارزمية GrabCut مع bounding box واسع (لتجنب إزالة الأمامية)
        mask = np.zeros((h, w), np.uint8)
        bgd_model = np.zeros((1, 65), np.float64)
        fgd_model = np.zeros((1, 65), np.float64)

        # هامش 3% من كل جانب (أوسع من السابق لتجنب قطع الأمامية)
        margin_x = int(w * 0.03)
        margin_y = int(h * 0.03)
        rect = (margin_x, margin_y, w - 2 * margin_x, h - 2 * margin_y)

        try:
            # 5 تكرارات للحصول على نتيجة أدق
            cv2.grabCut(bgr, mask, rect, bgd_model, fgd_model, 5, cv2.GC_INIT_WITH_RECT)
            # تحويل القناع: 0/2 = خلفية، 1/3 = أمامية
            mask = np.where((mask == 0) | (mask == 2), 0, 255).astype("uint8")
        except Exception:
            # fallback: threshold based
            gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)
            _, mask = cv2.threshold(gray, threshold, 255, cv2.THRESH_BINARY)

    # عمليات مورفولوجية لتحسين القناع
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))

    # إغلاق: ملء الثقوب الصغيرة في الأمامية
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)
    # فتح: إزالة الضوضاء الصغيرة في الخلفية
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel)
    # تنعيم الحواف
    mask = cv2.GaussianBlur(mask, (5, 5), 0)

    # دمج القناع مع الصورة
    result = cv2.bitwise_and(bgr, bgr, mask=mask)

    # إعادة تكبير القناع للحجم الأصلي إذا تم التصغير
    if scale != 1.0:
        # إعادة قراءة الصورة الأصلية بالحجم الكامل
        original = cv2.imdecode(nparr, cv2.IMREAD_UNCHANGED)
        if len(original.shape) == 3 and original.shape[2] == 4:
            bgr_full = original[:, :, :3]
        else:
            bgr_full = original
        # تكبير القناع للحجم الأصلي
        mask_full = cv2.resize(
            mask,
            (bgr_full.shape[1], bgr_full.shape[0]),
            interpolation=cv2.INTER_LINEAR
        )
        # تطبيق القناع على الصورة الأصلية للحفاظ على الجودة
        result = cv2.bitwise_and(bgr_full, bgr_full, mask=mask_full)
        bgra = np.dstack([result, mask_full])
    else:
        bgra = np.dstack([result, mask])

    # حفظ كـ PNG مع شفافية
    is_success, buffer = cv2.imencode(".png", bgra)
    if not is_success:
        raise RuntimeError("فشل حفظ الصورة")

    return buffer.tobytes()


async def remove_background_ai(contents: bytes) -> bytes:
    """
    تفريغ الخلفية بالذكاء الاصطناعي (rembg + u2netp)

    Args:
        contents: محتوى الصورة

    Returns:
        bytes: الصورة بشفافية
    """
    try:
        from rembg import remove, new_session
        # استخدام أصغر نموذج (u2netp) لتوفير الذاكرة
        session = new_session("u2netp")
        result_bytes = remove(contents, session=session)
        return result_bytes
    except ImportError:
        raise RuntimeError(
            "مكتبة rembg غير مثبتة. استخدم الطريقة البسيطة بدلاً منها."
        )
    except Exception as e:
        raise RuntimeError(
            f"خطأ في معالجة AI: {str(e)}. حاول بطريقة بسيطة."
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
        except Exception as e:
            # fallback إلى الطريقة البسيطة إذا فشل AI
            print(f"[bg_remover] AI failed: {e}, falling back to simple")
            return await remove_background_simple(contents)
    else:
        return await remove_background_simple(contents)
