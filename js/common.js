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
                overlay.className = 'fixed inset-0 z-[100] flex flex-col items-center justify-center p-6 text-center';
                // Animated gradient background
                overlay.style.background = 'linear-gradient(135deg, #1a2e1a, #0d1f0d, #1a4731, #1a2e1a)';
                overlay.style.backgroundSize = '400% 400%';
                overlay.style.animation = 'gradientShift 4s ease infinite';

                overlay.innerHTML = [
                    '<style>',
                    '@keyframes gradientShift {',
                    '0% { background-position: 0% 50%; }',
                    '50% { background-position: 100% 50%; }',
                    '100% { background-position: 0% 50%; }',
                    '}',
                    '@keyframes float {',
                    '0%, 100% { transform: translateY(0px); }',
                    '50% { transform: translateY(-8px); }',
                    '}',
                    '@keyframes fadeText {',
                    '0%, 100% { opacity: 0.6; }',
                    '50% { opacity: 1; }',
                    '}',
                    '@keyframes shimmer {',
                    '0% { transform: translateX(-100%); }',
                    '100% { transform: translateX(200%); }',
                    '}',
                    '.shimmer-bg {',
                    'position: relative;',
                    'overflow: hidden;',
                    '}',
                    '.shimmer-bg::after {',
                    'content: "";',
                    'position: absolute;',
                    'top: 0; left: 0; right: 0; bottom: 0;',
                    'background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);',
                    'animation: shimmer 1.5s infinite;',
                    '}',
                    '</style>',
                    '<div class="mb-5" style="animation: float 2.5s ease-in-out infinite;">',
                    '<div class="p-4 bg-white/10 rounded-full border-2 border-emerald-400/40">',
                    '<svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-emerald-400" fill="currentColor" viewBox="0 0 24 24">',
                    '<path d="M12 22C17.1761 20.668 21 15.968 21 10.378V4.378L12 1.378L3 4.378V10.378C3 15.968 6.8239 20.668 12 22Z" fill="currentColor"/>',
                    '<path d="M12 20.4C16.14 19.33 19.2 15.57 19.2 11.1V6.3L12 3.9L4.8 6.3V11.1C4.8 15.57 7.86 19.33 12 20.4Z" fill="none" stroke="#fbc02d" stroke-width="1.2"/>',
                    '<circle cx="12" cy="12" r="3.5" fill="#e65100"/>',
                    '<circle cx="12" cy="12" r="1.5" fill="#fbc02d"/>',
                    '</svg>',
                    '</div>',
                    '</div>',
                    '<h2 class="text-lg font-bold text-white mb-2" style="animation: fadeText 2s ease-in-out infinite;">กำลังตรวจสอบ...</h2>',
                    '<div class="flex space-x-1.5">',
                    '<div class="w-2 h-2 bg-emerald-400 rounded-full" style="animation: float 1s ease-in-out infinite;"></div>',
                    '<div class="w-2 h-2 bg-emerald-400 rounded-full" style="animation: float 1s ease-in-out 0.2s infinite;"></div>',
                    '<div class="w-2 h-2 bg-emerald-400 rounded-full" style="animation: float 1s ease-in-out 0.4s infinite;"></div>',
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

    // ===== Skeleton Item for History Loading =====
    function createSkeletonItem() {
        var isNight = isDarkMode();
        var bgColor = isNight ? 'bg-[#1E3A1E]' : 'bg-white';
        var borderColor = isNight ? 'border-emerald-800/30' : 'border-slate-200';

        var wrapper = document.createElement('div');
        wrapper.className = 'p-2.5 border rounded-xl flex justify-between items-start ' + borderColor + ' ' + bgColor + ' shimmer-bg';
        wrapper.style.position = 'relative';
        wrapper.style.overflow = 'hidden';

        var leftCol = document.createElement('div');
        leftCol.className = 'flex flex-col space-y-1.5 flex-1';
        leftCol.innerHTML = [
            '<div class="h-2.5 w-20 rounded bg-slate-300 dark:bg-emerald-800/50"></div>',
            '<div class="h-3.5 w-32 rounded bg-slate-300 dark:bg-emerald-800/50"></div>'
        ].join('');

        var rightCol = document.createElement('div');
        rightCol.className = 'flex flex-col space-y-1.5 items-end flex-shrink-0 ml-2';
        rightCol.innerHTML = [
            '<div class="h-2.5 w-14 rounded bg-slate-300 dark:bg-emerald-800/50"></div>',
            '<div class="h-3.5 w-20 rounded bg-slate-300 dark:bg-emerald-800/50"></div>'
        ].join('');

        wrapper.appendChild(leftCol);
        wrapper.appendChild(rightCol);
        return wrapper;
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
            accentText: isNight ? 'text-wvo-green-100/60' : 'text-slate-400',
            timeText: isNight ? 'text-wvo-green-100' : 'text-slate-700'
        };
    }

    return {
        showLoading: showLoading,
        createSkeletonItem: createSkeletonItem,
        handleError: handleError,
        formatDateTH: formatDateTH,
        updateLiveTime: updateLiveTime,
        isDarkMode: isDarkMode,
        getHistoryItemClasses: getHistoryItemClasses
    };
})();