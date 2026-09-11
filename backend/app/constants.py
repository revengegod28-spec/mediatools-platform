"""
ثوابت التطبيق - مقاسات، قوالب، إعدادات
Application constants - sizes, templates, settings
"""

# ============================================================
# مقاسات منصات التواصل الاجتماعي
# Social Media Platform Dimensions
# ============================================================
PLATFORM_SIZES = {
    # Instagram
    "instagram_square": {
        "name": "Instagram - Post مربع",
        "width": 1080,
        "height": 1080,
        "category": "instagram",
    },
    "instagram_portrait": {
        "name": "Instagram - Post طولي",
        "width": 1080,
        "height": 1350,
        "category": "instagram",
    },
    "instagram_landscape": {
        "name": "Instagram - Post عرضي",
        "width": 1080,
        "height": 566,
        "category": "instagram",
    },
    "instagram_story": {
        "name": "Instagram - Story / Reels",
        "width": 1080,
        "height": 1920,
        "category": "instagram",
    },
    "instagram_reels_cover": {
        "name": "Instagram - Reels Cover",
        "width": 420,
        "height": 654,
        "category": "instagram",
    },
    # Facebook
    "facebook_post": {
        "name": "Facebook - Post",
        "width": 1200,
        "height": 630,
        "category": "facebook",
    },
    "facebook_story": {
        "name": "Facebook - Story",
        "width": 1080,
        "height": 1920,
        "category": "facebook",
    },
    "facebook_cover": {
        "name": "Facebook - Cover Photo",
        "width": 820,
        "height": 312,
        "category": "facebook",
    },
    "facebook_ad": {
        "name": "Facebook - Ad",
        "width": 1200,
        "height": 628,
        "category": "facebook",
    },
    # Twitter / X
    "twitter_post": {
        "name": "Twitter - Post",
        "width": 1200,
        "height": 675,
        "category": "twitter",
    },
    "twitter_header": {
        "name": "Twitter - Header",
        "width": 1500,
        "height": 500,
        "category": "twitter",
    },
    # LinkedIn
    "linkedin_post": {
        "name": "LinkedIn - Post",
        "width": 1200,
        "height": 627,
        "category": "linkedin",
    },
    "linkedin_cover": {
        "name": "LinkedIn - Cover",
        "width": 1584,
        "height": 396,
        "category": "linkedin",
    },
    # YouTube
    "youtube_thumbnail": {
        "name": "YouTube - Thumbnail",
        "width": 1280,
        "height": 720,
        "category": "youtube",
    },
    "youtube_banner": {
        "name": "YouTube - Channel Banner",
        "width": 2560,
        "height": 1440,
        "category": "youtube",
    },
    # TikTok
    "tiktok_video": {
        "name": "TikTok - Video Cover",
        "width": 1080,
        "height": 1920,
        "category": "tiktok",
    },
    # Pinterest
    "pinterest_pin": {
        "name": "Pinterest - Pin",
        "width": 1000,
        "height": 1500,
        "category": "pinterest",
    },
    # WhatsApp
    "whatsapp_status": {
        "name": "WhatsApp - Status",
        "width": 1080,
        "height": 1920,
        "category": "whatsapp",
    },
}


# ============================================================
# القوالب الإخبارية
# News Templates
# ============================================================
NEWS_TEMPLATES = {
    "breaking_news": {
        "name": "Breaking News - عاجل",
        "width": 1920,
        "height": 1080,
        "bg_color": "#DC2626",
        "accent_color": "#FBBF24",
        "text_color": "#FFFFFF",
        "description": "قالب أحمر تقليدي للأخبار العاجلة",
    },
    "daily_news": {
        "name": "Daily News - أخبار يومية",
        "width": 1920,
        "height": 1080,
        "bg_color": "#1E3A8A",
        "accent_color": "#FBBF24",
        "text_color": "#FFFFFF",
        "description": "قالب أزرق أنيق للأخبار اليومية",
    },
    "sports": {
        "name": "Sports - رياضة",
        "width": 1920,
        "height": 1080,
        "bg_color": "#047857",
        "accent_color": "#FFFFFF",
        "text_color": "#FFFFFF",
        "description": "قالب أخضر ديناميكي للأخبار الرياضية",
    },
    "tech_news": {
        "name": "Tech News - تكنولوجيا",
        "width": 1920,
        "height": 1080,
        "bg_color": "#0F172A",
        "accent_color": "#06B6D4",
        "text_color": "#FFFFFF",
        "description": "قالب داكن عصري لأخبار التكنولوجيا",
    },
    "promo": {
        "name": "Promo - ترويجي",
        "width": 1920,
        "height": 1080,
        "bg_color": "#7C3AED",
        "accent_color": "#FDE047",
        "text_color": "#FFFFFF",
        "description": "قالب بنفسجي جذاب للحملات الترويجية",
    },
    "business": {
        "name": "Business - أعمال",
        "width": 1920,
        "height": 1080,
        "bg_color": "#374151",
        "accent_color": "#F59E0B",
        "text_color": "#FFFFFF",
        "description": "قالب رمادي احترافي لأخبار الأعمال",
    },
    "entertainment": {
        "name": "Entertainment - ترفيه",
        "width": 1920,
        "height": 1080,
        "bg_color": "#DB2777",
        "accent_color": "#FFFFFF",
        "text_color": "#FFFFFF",
        "description": "قالب وردي مبهج للأخبار الترفيهية",
    },
    "health": {
        "name": "Health - صحة",
        "width": 1920,
        "height": 1080,
        "bg_color": "#0891B2",
        "accent_color": "#FFFFFF",
        "text_color": "#FFFFFF",
        "description": "قالب سماوي هادئ للأخبار الصحية",
    },
}


# ============================================================
# المواقع المدعومة للعلامة المائية
# Watermark Positions
# ============================================================
WATERMARK_POSITIONS = [
    "top-left",
    "top-right",
    "bottom-left",
    "bottom-right",
    "center",
]


# ============================================================
# صيغ الإخراج المدعومة
# Supported Output Formats
# ============================================================
OUTPUT_FORMATS = ["JPEG", "PNG", "WEBP"]

# امتدادات الملفات المقبولة
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".bmp", ".tiff"}
