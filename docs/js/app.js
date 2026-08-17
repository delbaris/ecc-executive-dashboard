// معماری ضدگلوله برای پیدا کردن کامپوننت‌ها مستقل از Root سرور
async function loadComponent(elementId, pathsArray) {
    for (let path of pathsArray) {
        try {
            const response = await fetch(path);
            if (response.ok) {
                const html = await response.text();
                document.getElementById(elementId).innerHTML = html;
                return; // در صورت موفقیت، از حلقه خارج شو
            }
        } catch (error) {
            // نادیده گرفتن خطا برای تست مسیر بعدی
        }
    }
    console.error(`خطای بحرانی: کامپوننت ${elementId} در هیچ یک از مسیرها یافت نشد.`);
}

async function initApp() {
    // آرایه‌ای از مسیرهای محتمل برای حل مشکل 404 در لایوسرور
    await Promise.all([
        loadComponent('sidebar-container', ['../components/sidebar.html', './components/sidebar.html', '../../components/sidebar.html', '/components/sidebar.html']),
        loadComponent('header-container', ['../components/header.html', './components/header.html', '../../components/header.html', '/components/header.html']),
        loadComponent('cards-container', ['../components/cards.html', './components/cards.html', '../../components/cards.html', '/components/cards.html'])
    ]);

    if (window.initCharts) window.initCharts();
    startPersianClock();
}

// چک کردن وضعیت لودینگ DOM برای جلوگیری از عدم اجرای اسکریپت
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

// =====================================
// منطق ساعت و تاریخ شمسی (تایم زون ایران)
// =====================================
function startPersianClock() {
    const timeEl = document.getElementById('live-time');
    const dateEl = document.getElementById('live-date');
    if (!timeEl || !dateEl) return;

    const updateClock = () => {
        const now = new Date();
        const timeOptions = { timeZone: 'Asia/Tehran', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };
        const dateOptions = { timeZone: 'Asia/Tehran', year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };

        timeEl.textContent = new Intl.DateTimeFormat('fa-IR', timeOptions).format(now);
        dateEl.textContent = new Intl.DateTimeFormat('fa-IR', dateOptions).format(now);
    };

    updateClock();
    setInterval(updateClock, 1000);
}

// =====================================
// سیستم کلاپس سایدبار
// =====================================
window.toggleSidebar = function () {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('mobile-overlay');
    const texts = document.querySelectorAll('.sidebar-text');
    const logoWrapper = document.getElementById('logo-wrapper');

    if (sidebar) {
        if (window.innerWidth < 768) {
            sidebar.classList.toggle('translate-x-full');
            if (overlay) overlay.classList.toggle('hidden');
        } else {
            sidebar.classList.toggle('w-64');
            sidebar.classList.toggle('w-20');
            texts.forEach(text => text.classList.toggle('hidden'));
            if (logoWrapper) {
                logoWrapper.classList.toggle('p-2');
                logoWrapper.classList.toggle('p-1');
            }
            setTimeout(() => { window.dispatchEvent(new Event('resize')); }, 300);
        }
    }
};

// =====================================
// منطق مودال خروج 
// =====================================
window.showLogoutModal = function () {
    const modal = document.getElementById('logout-modal');
    const content = document.getElementById('logout-modal-content');
    if (modal && content) {
        modal.classList.remove('hidden');
        setTimeout(() => {
            modal.classList.remove('opacity-0');
            content.classList.remove('scale-95');
        }, 10);
    }
};

window.hideLogoutModal = function () {
    const modal = document.getElementById('logout-modal');
    const content = document.getElementById('logout-modal-content');
    if (modal && content) {
        modal.classList.add('opacity-0');
        content.classList.add('scale-95');
        setTimeout(() => {
            modal.classList.add('hidden');
        }, 300);
    }
};

window.executeLogout = function () {
    window.location.href = 'login.html';
};