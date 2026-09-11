"""
اختبارات أساسية للـ Backend
Basic tests for the API
"""
import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_root_endpoint():
    """اختبار المسار الرئيسي"""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "active"
    assert "tools" in data


def test_health_endpoint():
    """اختبار فحص الصحة"""
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"


def test_compress_formats():
    """اختبار الحصول على صيغ الضغط"""
    response = client.get("/api/v1/compress/formats")
    assert response.status_code == 200
    data = response.json()
    assert "JPEG" in data["formats"]


def test_resize_platforms():
    """اختبار الحصول على المنصات المدعومة"""
    response = client.get("/api/v1/resize/platforms")
    assert response.status_code == 200
    data = response.json()
    assert "instagram_story" in data["platforms"]


def test_template_list():
    """اختبار قائمة القوالب"""
    response = client.get("/api/v1/template/list")
    assert response.status_code == 200
    data = response.json()
    assert "breaking_news" in data["templates"]


def test_watermark_positions():
    """اختبار مواقع العلامة المائية"""
    response = client.get("/api/v1/watermark/positions")
    assert response.status_code == 200
    data = response.json()
    assert "bottom-right" in data["positions"]


def test_background_methods():
    """اختبار طرق تفريغ الخلفيات"""
    response = client.get("/api/v1/background/methods")
    assert response.status_code == 200
    data = response.json()
    methods = [m["id"] for m in data["methods"]]
    assert "auto" in methods


def test_invalid_resize_platform():
    """اختبار منصة غير موجودة"""
    # نرفع طلب بدون ملف لاختبار الاستجابة
    response = client.post(
        "/api/v1/resize?platform=invalid_platform",
    )
    assert response.status_code == 422  # Validation error (missing file)


# اختبارات إضافية يمكن توسيعها لاحقاً
def test_docs_available():
    """اختبار توفر توثيق API"""
    response = client.get("/docs")
    assert response.status_code == 200
