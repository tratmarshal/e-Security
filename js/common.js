// ========== common.js ==========
// ฟังก์ชันที่ใช้ร่วมกันระหว่าง DUTY และ SWAP
// ==========================================

var common = (function () {
    // ===== Loading Overlay =====
    function showLoading(show) {
        var overlay = document.getElementById('loadingOverlay');
        if (!overlay) return;
        if (show) {
            overlay.classList.remove('hidden');
            overlay.classList.add('flex');
        } else {
            overlay.classList.remove('flex');
            overlay.classList.add('hidden');
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

    function formatTimeTH(date) {
        if (!date) return '';
        var d = new Date(date);
        if (isNaN(d.getTime())) return String(date);
        return d.toLocaleTimeString('th-TH', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        }) + ' น.';
    }

    function updateLiveTime() {
        var now = new Date();
        var dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', locale: 'th-TH' };
        var timeOptions = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };

        var liveDateEl = document.getElementById('live-date');
        var liveClockEl = document.getElementById('live-clock');
        if (liveDateEl) liveDateEl.innerText = now.toLocaleDateString('th-TH', dateOptions);
        if (liveClockEl) liveClockEl.innerText = 'เวลาปัจจุบัน: ' + now.toLocaleTimeString('th-TH', timeOptions) + ' น.';
    }

    // ===== Dark Mode Helper =====
    function isDarkMode() {
        return document.documentElement.classList.contains('dark');
    }

    // ===== Safe DOM Creation =====
    function createElement(tag, attrs, children) {
        var el = document.createElement(tag);
        if (attrs) {
            Object.keys(attrs).forEach(function (key) {
                if (key === 'className') {
                    el.className = attrs[key];
                } else if (key === 'style' && typeof attrs[key] === 'object') {
                    Object.assign(el.style, attrs[key]);
                } else if (key.startsWith('data-')) {
                    el.setAttribute(key, attrs[key]);
                } else {
                    el[key] = attrs[key];
                }
            });
        }
        if (children) {
            if (Array.isArray(children)) {
                children.forEach(function (child) {
                    if (typeof child === 'string') {
                        el.appendChild(document.createTextNode(child));
                    } else if (child instanceof Node) {
                        el.appendChild(child);
                    }
                });
            } else if (typeof children === 'string') {
                el.textContent = children;
            }
        }
        return el;
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
        formatTimeTH: formatTimeTH,
        updateLiveTime: updateLiveTime,
        isDarkMode: isDarkMode,
        createElement: createElement,
        getHistoryItemClasses: getHistoryItemClasses
    };
})();