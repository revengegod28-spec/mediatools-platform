/**
 * ============================================
 * Main Script - السكربت الرئيسي للواجهة
 * ============================================
 */

const UI = {
    /**
     * عرض إشعار Toast
     */
    showToast(message, type = 'info') {
        const colors = {
            success: 'bg-green-500',
            error: 'bg-red-500',
            info: 'bg-blue-500',
            warning: 'bg-yellow-500'
        };
        const icons = {
            success: '✅',
            error: '❌',
            info: 'ℹ️',
            warning: '⚠️'
        };

        const toast = document.createElement('div');
        toast.className = `toast fixed top-20 left-1/2 -translate-x-1/2 ${colors[type]} text-white px-6 py-3 rounded-xl shadow-2xl z-50 font-bold flex items-center gap-2`;
        toast.innerHTML = `<span>${icons[type]}</span><span>${message}</span>`;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('toast-exit');
            setTimeout(() => toast.remove(), 300);
        }, 3500);
    }
};

window.UI = UI;

// ============================================
// عند تحميل الصفحة
// ============================================
document.addEventListener('DOMContentLoaded', () => {

    // السنة الحالية في الفوتر
    const yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    // ربط أزرار الأدوات
    document.querySelectorAll('.tool-card[data-tool]').forEach(card => {
        card.addEventListener('click', () => {
            const toolId = card.dataset.tool;
            if (window.Tools) {
                Tools.open(toolId);
            }
        });
    });

    // القائمة في الموبايل
    const mobileBtn = document.getElementById('mobileMenuBtn');
    const mobileMenu = document.getElementById('mobileMenu');
    if (mobileBtn && mobileMenu) {
        mobileBtn.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
        });
    }

    // إغلاق Modal عند النقر خارجها
    const modal = document.getElementById('toolModal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal && window.Tools) {
                Tools.close();
            }
        });
    }

    // إغلاق Modal بمفتاح Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && window.Tools) {
            Tools.close();
        }
    });

    // تأثير شفافية النافبار عند التمرير
    const navbar = document.getElementById('navbar');
    if (navbar) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 20) {
                navbar.classList.add('shadow-md');
            } else {
                navbar.classList.remove('shadow-md');
            }
        });
    }

    // Smooth scroll للروابط الداخلية
    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', (e) => {
            const target = document.querySelector(link.getAttribute('href'));
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                // إغلاق القائمة في الموبايل
                if (mobileMenu && !mobileMenu.classList.contains('hidden')) {
                    mobileMenu.classList.add('hidden');
                }
            }
        });
    });

    // ✅ فحص أولي للسيرفر في الخلفية (لا يمنع تحميل الصفحة)
    if (window.HealthManager) {
        HealthManager.initialCheck();
    }

    console.log('%c🚀 MediaTools Platform', 'font-size: 24px; font-weight: bold; color: #7c3aed;');
    console.log('%cصُنع بحب ❤️ للمحتوى العربي', 'font-size: 14px; color: #6b7280;');
});
