"""
مسار أداة تعديل مقاسات الصور
Image resizing router
"""
from fastapi import APIRouter, File, UploadFile, Query, HTTPException
from fastapi.responses import StreamingResponse
from typing import Optional
import io

from app.utils.validators import validate_image_file
from app.utils.image_helpers import hex_to_rgb
from app.services.resizer import resize_for_platform
from app.constants import PLATFORM_SIZES

router = APIRouter(prefix="/resize", tags=["📐 تعديل المقاسات"])


@router.post(
    "",
    summary="تعديل حجم الصورة لمقاس منصة تواصل",
    description="ارفع صورة واختر منصة التواصل للحصول على المقاس المناسب تلقائياً",
)
async def resize(
    file: UploadFile = File(..., description="الصورة المراد تعديلها"),
    platform: str = Query(
        ...,
        description="معرف المنصة (مثل: instagram_story, facebook_post)",
    ),
    fit_mode: str = Query(
        "cover",
        description="طريقة الملاءمة: cover (قص), contain (احتواء), stretch (تمدد)",
    ),
    background_color: str = Query(
        "#FFFFFF",
        description="لون الخلفية (hex) عند استخدام وضع contain",
    ),
):
    """تعديل مقاس الصورة لمقاس منصة تواصل اجتماعي"""
    # التحقق من المنصة
    if platform not in PLATFORM_SIZES:
        available = list(PLATFORM_SIZES.keys())
        raise HTTPException(
            status_code=400,
            detail=f"منصة غير مدعومة. المنصات المتاحة: {available}",
        )

    # التحقق من طريقة الملاءمة
    if fit_mode not in ("cover", "contain", "stretch"):
        raise HTTPException(
            status_code=400,
            detail="طريقة الملاءمة يجب أن تكون: cover, contain, أو stretch",
        )

    platform_config = PLATFORM_SIZES[platform]

    # التحقق من الملف
    contents, _ = await validate_image_file(file)

    try:
        resized_bytes = await resize_for_platform(
            contents=contents,
            target_width=platform_config["width"],
            target_height=platform_config["height"],
            fit_mode=fit_mode,
            background_color=background_color,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"خطأ في المعالجة: {str(e)}")

    return StreamingResponse(
        io.BytesIO(resized_bytes),
        media_type="image/jpeg",
        headers={
            "Content-Disposition": f'attachment; filename="{platform}.jpg"',
            "X-Platform": platform,
            "X-Width": str(platform_config["width"]),
            "X-Height": str(platform_config["height"]),
        },
    )


@router.post("/custom", summary="تعديل مقاس مخصص")
async def resize_custom(
    file: UploadFile = File(..., description="الصورة"),
    width: int = Query(..., ge=100, le=10000),
    height: int = Query(..., ge=100, le=10000),
    fit_mode: str = Query("cover"),
    background_color: str = Query("#FFFFFF"),
):
    """تعديل مقاس مخصص بأبعاد محددة"""
    contents, _ = await validate_image_file(file)

    try:
        resized_bytes = await resize_for_platform(
            contents=contents,
            target_width=width,
            target_height=height,
            fit_mode=fit_mode,
            background_color=background_color,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"خطأ في المعالجة: {str(e)}")

    return StreamingResponse(
        io.BytesIO(resized_bytes),
        media_type="image/jpeg",
        headers={
            "Content-Disposition": f'attachment; filename="{width}x{height}.jpg"',
        },
    )


@router.get("/platforms", summary="قائمة المنصات المدعومة")
async def get_platforms():
    """الحصول على قائمة منصات التواصل المدعومة ومقاساتها"""
    return {
        "platforms": PLATFORM_SIZES,
        "categories": {
            cat: [
                {"id": k, **v}
                for k, v in PLATFORM_SIZES.items()
                if v["category"] == cat
            ]
            for cat in set(p["category"] for p in PLATFORM_SIZES.values())
        },
    }
