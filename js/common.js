// ========== common.js ==========
// ฟังก์ชันที่ใช้ร่วมกันระหว่าง DUTY และ SWAP
// ==========================================

var common = (function () {
    // ===== Loading Overlay (Dynamic) =====
    function showLoading(show) {
        var overlayId = 'dynamicLoadingOverlay';
        var overlay = document.getElementById(overlayId);

        if (show) {
            if (!overlay) {
                overlay = document.createElement('div');
                overlay.id = overlayId;
                overlay.className = 'fixed inset-0 z-[100] bg-[#1A2E1A] flex flex-col items-center justify-center p-6 text-center';
                overlay.innerHTML = [
                    '<div class="mb-4 p-3 bg-white/10 rounded-full border border-emerald-400/30 animate-pulse">',
                    '<div class="w-10 h-10 border-3 border-white/20 border-t-emerald-400 rounded-full animate-spin"></div>',
                    '</div>',
                    '<h2 class="text-lg font-bold text-white mb-1">กำลังตรวจสอบ...</h2>',
                    '<p class="text-xs text-emerald-200">กรุณารอสักครู่</p>',
                    '</div>'
                ].join('');
                document.body.appendChild(overlay);
            } else {
                overlay.classList.remove('hidden');
                overlay.classList.add('flex');
            }
        } else {
            if (overlay) {
                overlay.classList.remove('flex');
                overlay.classList.add('hidden');
            }
        }
    }

    // ===== Error Handler กลาง =====
    function handleError(err) {
        console.error('Error:', err);
        modal.showError(err.message || 'เกิดข้อผิดพลาด');
    }

    // ===== Date/Time Format =====
    function formatDateTH(date) {
        if (!date) return '';
        var d = new Date(date);
        if (isNaN(d.getTime())) return String(date);
        return d.toLocaleDateString('th-TH', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    }

    function updateLiveTime() {
        var now = new Date();
        var dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', locale: 'th-TH' };
        var timeOptions = { hour: '2-digit', minute: '2-digit', hour12: false };

        var liveDateEl = document.getElementById('live-date');
        var liveClockEl = document.getElementById('live-clock');
        if (liveDateEl) liveDateEl.innerText = now.toLocaleDateString('th-TH', dateOptions);
        if (liveClockEl) liveClockEl.innerText = 'เวลาปัจจุบัน: ' + now.toLocaleTimeString('th-TH', timeOptions) + ' น.';
    }

    // ===== Dark Mode Helper =====
    function isDarkMode() {
        return document.documentElement.classList.contains('dark');
    }

    // ===== History Item Renderer (ใช้ร่วมกัน) =====
    function getHistoryItemClasses() {
        var isNight = isDarkMode();
        return {
            itemBg: isNight ? 'bg-[#173b1b] border-wvo-green-800 text-white' : 'bg-slate-50 border-slate-100 text-slate-800',
            mainText: isNight ? 'text-white' : 'text-slate-800',
            subText: isNight ? 'text-wvo-green-100' : 'text-slate-500',
            accentText: isNight ? 'text-wvo-gold-400' : 'text-slate-400',
            timeText: isNight ? 'text-wvo-green-100' : 'text-slate-700'
        };
    }

    return {
        showLoading: showLoading,
        handleError: handleError,
        formatDateTH: formatDateTH,
        updateLiveTime: updateLiveTime,
        isDarkMode: isDarkMode,
        getHistoryItemClasses: getHistoryItemClasses
    };
})();