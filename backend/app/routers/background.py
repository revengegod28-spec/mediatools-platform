"""
مسار أداة تفريغ الخلفيات
Background removal router
"""
from fastapi import APIRouter, File, UploadFile, Query, HTTPException
from fastapi.responses import StreamingResponse
import io

from app.utils.validators import validate_image_file
from app.services.bg_remover import (
    remove_background_simple,
    remove_background_ai,
    remove_background_auto,
)

router = APIRouter(prefix="/background", tags=["✂️ تفريغ الخلفيات"])


@router.post(
    "/remove",
    summary="تفريغ خلفية الصورة",
    description="إزالة خلفية الصورة تلقائياً وإرجاعها بصيغة PNG مع شفافية",
)
async def remove_bg(
    file: UploadFile = File(..., description="الصورة المراد تفريغ خلفيتها"),
    method: str = Query(
        "auto",
        description="الطريقة: auto (تلقائي), ai (ذكاء اصطناعي), simple (بسيطة)",
    ),
    threshold: int = Query(
        240, ge=200, le=255, description="حد الكشف (للطريقة البسيطة فقط)"
    ),
):
    """تفريغ خلفية الصورة وإرجاعها بصيغة PNG شفافة"""
    if method not in ("auto", "ai", "simple"):
        raise HTTPException(
            status_code=400,
            detail="الطريقة يجب أن تكون: auto, ai, أو simple",
        )

    # التحقق من الصورة
    contents, _ = await validate_image_file(file)

    try:
        if method == "ai":
            result_bytes = await remove_background_ai(contents)
        elif method == "simple":
            result_bytes = await remove_background_simple(contents, threshold)
        else:
            result_bytes = await remove_background_auto(contents)
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"خطأ في المعالجة: {str(e)}")

    return StreamingResponse(
        io.BytesIO(result_bytes),
        media_type="image/png",
        headers={
            "Content-Disposition": 'attachment; filename="no_background.png"',
            "X-Method": method,
        },
    )


@router.get("/methods", summary="الطرق المتاحة")
async def get_methods():
    """الطرق المتاحة لتفريغ الخلفيات"""
    from app.config import settings

    return {
        "methods": [
            {
                "id": "auto",
                "name": "تلقائي",
                "description": "يستخدم AI إذا كان متاحاً، وإلا الطريقة البسيطة",
                "recommended": True,
            },
            {
                "id": "ai",
                "name": "ذكاء اصطناعي (rembg)",
                "description": "أفضل جودة باستخدام نموذج AI",
                "requires": "rembg library",
            },
            {
                "id": "simple",
                "name": "بسيطة (OpenCV)",
                "description": "سريعة ومناسبة للخلفيات البسيطة",
            },
        ],
        "rembg_enabled": settings.ENABLE_REMBG,
    }
