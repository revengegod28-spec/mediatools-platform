"""
مسار أداة توليد القوالب الإخبارية
News template generation router
"""
from fastapi import APIRouter, File, UploadFile, Form, Query, HTTPException
from fastapi.responses import StreamingResponse
from typing import Optional
import io

from app.services.template_gen import generate_news_template
from app.constants import NEWS_TEMPLATES

router = APIRouter(prefix="/template", tags=["📰 القوالب الإخبارية"])


@router.post(
    "",
    summary="توليد قالب إخباري احترافي",
    description="اختر قالباً وأدخل العنوان والشعار وصورة الخلفية للحصول على بنر إخباري احترافي",
)
async def create_template(
    template_id: str = Query(
        ...,
        description="معرف القالب (مثل: breaking_news, sports, tech_news)",
    ),
    headline: str = Form(..., description="العنوان الرئيسي", min_length=1, max_length=200),
    subheadline: str = Form("", description="العنوان الفرعي (اختياري)", max_length=200),
    logo: Optional[UploadFile] = File(None, description="شعار (اختياري)"),
    background_image: Optional[UploadFile] = File(
        None, description="صورة خلفية (اختياري)"
    ),
):
    """توليد قالب إخباري احترافي"""
    # التحقق من القالب
    if template_id not in NEWS_TEMPLATES:
        available = [
            {"id": k, "name": v["name"]} for k, v in NEWS_TEMPLATES.items()
        ]
        raise HTTPException(
            status_code=400,
            detail={
                "message": "قالب غير موجود",
                "available": available,
            },
        )

    # قراءة الملفات الاختيارية
    logo_bytes = None
    background_bytes = None

    if logo:
        logo_contents = await logo.read()
        if len(logo_contents) > 5 * 1024 * 1024:
            raise HTTPException(status_code=413, detail="حجم الشعار كبير جداً (5MB max)")
        logo_bytes = logo_contents

    if background_image:
        bg_contents = await background_image.read()
        if len(bg_contents) > 10 * 1024 * 1024:
            raise HTTPException(
                status_code=413, detail="حجم صورة الخلفية كبير جداً (10MB max)"
            )
        background_bytes = bg_contents

    try:
        template_bytes = await generate_news_template(
            template_id=template_id,
            headline=headline,
            subheadline=subheadline,
            logo_bytes=logo_bytes,
            background_image_bytes=background_bytes,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"خطأ في التوليد: {str(e)}")

    return StreamingResponse(
        io.BytesIO(template_bytes),
        media_type="image/jpeg",
        headers={
            "Content-Disposition": f'attachment; filename="news_template_{template_id}.jpg"',
            "X-Template-ID": template_id,
        },
    )


@router.get("/list", summary="قائمة القوالب المتاحة")
async def list_templates():
    """الحصول على قائمة القوالب الإخبارية المتاحة"""
    return {
        "templates": NEWS_TEMPLATES,
        "count": len(NEWS_TEMPLATES),
    }
