"""
مسار أداة ضغط وتحويل الصور
Image compression and conversion router
"""
from fastapi import APIRouter, File, UploadFile, Query, HTTPException
from fastapi.responses import StreamingResponse
import io

from app.utils.validators import validate_image_file
from app.services.compressor import compress_image
from app.constants import OUTPUT_FORMATS

router = APIRouter(prefix="/compress", tags=["📦 ضغط الصور"])


@router.post(
    "",
    summary="ضغط وتحويل الصور",
    description="ارفع صورة واحصل على نسخة مضغوطة بالصيغة والجودة المطلوبتين",
)
async def compress(
    file: UploadFile = File(..., description="الصورة المراد ضغطها"),
    quality: int = Query(
        85,
        ge=1,
        le=100,
        description="مستوى الجودة (1-100). الافتراضي 85",
    ),
    output_format: str = Query(
        "JPEG",
        description=f"صيغة الإخراج. المتاحة: {', '.join(OUTPUT_FORMATS)}",
    ),
    max_width: int = Query(None, ge=100, le=10000, description="أقصى عرض بالبكسل"),
    max_height: int = Query(None, ge=100, le=10000, description="أقصى ارتفاع بالبكسل"),
):
    """
    ضغط وتحويل الصور:
    - **file**: ملف الصورة
    - **quality**: مستوى الجودة
    - **output_format**: صيغة الإخراج (JPEG, PNG, WEBP)
    - **max_width / max_height**: تحديد أقصى أبعاد (اختياري)
    """
    # التحقق من الصيغة
    if output_format.upper() not in OUTPUT_FORMATS:
        raise HTTPException(
            status_code=400,
            detail=f"صيغة الإخراج غير مدعومة. الصيغ المتاحة: {OUTPUT_FORMATS}",
        )

    # التحقق من الملف
    contents, _ = await validate_image_file(file)

    # تنفيذ الضغط
    try:
        compressed_bytes, stats = await compress_image(
            contents=contents,
            quality=quality,
            output_format=output_format.upper(),
            max_width=max_width,
            max_height=max_height,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"خطأ في المعالجة: {str(e)}")

    # تحديد نوع MIME
    mime_map = {"JPEG": "image/jpeg", "PNG": "image/png", "WEBP": "image/webp"}
    mime_type = mime_map.get(output_format.upper(), "image/jpeg")

    # تحديد الامتداد
    ext_map = {"JPEG": "jpg", "PNG": "png", "WEBP": "webp"}
    ext = ext_map.get(output_format.upper(), "jpg")

    return StreamingResponse(
        io.BytesIO(compressed_bytes),
        media_type=mime_type,
        headers={
            "Content-Disposition": f'attachment; filename="compressed_{quality}q.{ext}"',
            "X-Original-Size": str(stats["original_size"]),
            "X-Compressed-Size": str(stats["compressed_size"]),
            "X-Compression-Ratio": f"{stats['compression_ratio']}%",
            "X-Savings-KB": str(stats["savings_kb"]),
        },
    )


@router.get("/formats", summary="الصيغ المتاحة")
async def get_formats():
    """الحصول على قائمة الصيغ المتاحة"""
    return {
        "formats": OUTPUT_FORMATS,
        "default_quality": 85,
        "max_file_size_mb": 10,
    }
