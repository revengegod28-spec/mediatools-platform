"""
مسار أداة العلامة المائية
Watermark router
"""
from fastapi import APIRouter, File, UploadFile, Form, Query, HTTPException
from fastapi.responses import StreamingResponse
from typing import Optional
import io

from app.utils.validators import validate_image_file
from app.services.watermarker import add_text_watermark, add_image_watermark
from app.constants import WATERMARK_POSITIONS

router = APIRouter(prefix="/watermark", tags=["💧 العلامة المائية"])


@router.post(
    "",
    summary="إضافة علامة مائية",
    description="أضف علامة مائية نصية أو شعار على الصورة",
)
async def add_watermark(
    file: UploadFile = File(..., description="الصورة الأصلية"),
    watermark_text: str = Form("", description="نص العلامة المائية (إذا لم يُرفع شعار)"),
    watermark_image: Optional[UploadFile] = File(
        None, description="صورة العلامة المائية/الشعار (اختياري)"
    ),
    position: str = Query(
        "bottom-right",
        description=f"الموقع. المتاحة: {', '.join(WATERMARK_POSITIONS)}",
    ),
    opacity: float = Query(
        0.5, ge=0.1, le=1.0, description="الشفافية (0.1 - 1.0)"
    ),
    scale: float = Query(
        0.15, ge=0.05, le=0.5, description="حجم العلامة نسبة لعرض الصورة (للشعارات فقط)"
    ),
    color: str = Query("#FFFFFF", description="لون النص (hex)"),
):
    """إضافة علامة مائية نصية أو صورية على الصورة"""
    # التحقق من الموقع
    if position not in WATERMARK_POSITIONS:
        raise HTTPException(
            status_code=400,
            detail=f"موقع غير مدعوم. المواقع المتاحة: {WATERMARK_POSITIONS}",
        )

    # يجب توفير نص أو شعار على الأقل
    if not watermark_text and not watermark_image:
        raise HTTPException(
            status_code=400,
            detail="يجب توفير نص العلامة المائية أو صورة الشعار",
        )

    # التحقق من الصورة
    contents, _ = await validate_image_file(file)

    try:
        if watermark_image:
            # علامة مائية صورية
            wm_contents = await watermark_image.read()
            if len(wm_contents) > 5 * 1024 * 1024:
                raise HTTPException(
                    status_code=413, detail="حجم الشعار كبير جداً (5MB max)"
                )
            result_bytes = await add_image_watermark(
                contents=contents,
                watermark_bytes=wm_contents,
                position=position,
                opacity=opacity,
                scale=scale,
            )
        else:
            # علامة مائية نصية
            result_bytes = await add_text_watermark(
                contents=contents,
                text=watermark_text,
                position=position,
                opacity=opacity,
                color=color,
            )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"خطأ في المعالجة: {str(e)}")

    return StreamingResponse(
        io.BytesIO(result_bytes),
        media_type="image/jpeg",
        headers={
            "Content-Disposition": 'attachment; filename="watermarked.jpg"',
            "X-Position": position,
            "X-Opacity": str(opacity),
        },
    )


@router.get("/positions", summary="المواقع المتاحة")
async def get_positions():
    """قائمة المواقع المتاحة للعلامة المائية"""
    return {
        "positions": WATERMARK_POSITIONS,
        "descriptions": {
            "top-left": "الزاوية العلوية اليسرى",
            "top-right": "الزاوية العلوية اليمنى",
            "bottom-left": "الزاوية السفلية اليسرى",
            "bottom-right": "الزاوية السفلية اليمنى",
            "center": "وسط الصورة",
        },
    }
