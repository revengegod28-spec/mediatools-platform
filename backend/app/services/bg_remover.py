"""
خدمة تفريغ الخلفيات
Background removal service
"""
import io
import numpy as np
from PIL import Image


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

    # إذا كانت الصورة تحتوي على قناة ألفا بالفعل، نستخدمها مباشرة
    if len(img_cv.shape) == 3 and img_cv.shape[2] == 4:
        # استخدام قناة الألفا الموجودة
        mask = img_cv[:, :, 3]
        bgr = img_cv[:, :, :3]
    else:
        bgr = img_cv
        # خوارزمية GrabCut لتحديد المقدمة
        mask = np.zeros(bgr.shape[:2], np.uint8)
        bgd_model = np.zeros((1, 65), np.float64)
        fgd_model = np.zeros((1, 65), np.float64)
        rect = (
            max(10, bgr.shape[1] // 20),
            max(10, bgr.shape[0] // 20),
            bgr.shape[1] - max(20, bgr.shape[1] // 10),
            bgr.shape[0] - max(20, bgr.shape[0] // 10),
        )
        try:
            cv2.grabCut(bgr, mask, rect, bgd_model, fgd_model, 5, cv2.GC_INIT_WITH_RECT)
            mask = np.where((mask == 2) | (mask == 0), 0, 1).astype("uint8") * 255
        except Exception:
            # fallback: threshold based
            gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)
            _, mask = cv2.threshold(gray, threshold, 255, cv2.THRESH_BINARY)

    # دمج القناع مع الصورة
    result = cv2.bitwise_and(bgr, bgr, mask=mask)

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
