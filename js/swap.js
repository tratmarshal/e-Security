// ========== swap.js ==========
// เฉพาะ Business Logic ระบบลา/แทนเวร
// ใช้ App Pattern: init(), load(), bindEvents(), destroy()
// ================================

var App = (function () {
    var currentUser = {
        userId: null,
        displayName: null,
        pictureUrl: null,
        name: null,
        employeeId: null
    };

    var loadedSubstitutes = [];
    var liveTimeInterval = null;

    // ===== INIT =====
    function init() {
        document.addEventListener('DOMContentLoaded', initApp);
    }

    // ===== LOAD =====
    async function load() {
        await loadSubstituteList();
        await updateSwapHistoryUI();
        resetForm();
    }

    // ===== BIND EVENTS =====
    function bindEvents() {
        document.getElementById('submitSwapBtn').addEventListener('click', onSubmitSwap);

        // Multi-day toggle
        document.getElementById('multiDayToggle').addEventListener('change', function () {
            var wrapper = document.getElementById('dateEndWrapper');
            var dateInput = document.getElementById('swapDate');
            if (this.checked) {
                wrapper.classList.remove('hidden');
                wrapper.classList.add('flex');
                dateInput.className = 'w-1/2 px-3 py-2.5 bg-white dark:bg-emerald-900 border border-slate-200 dark:border-emerald-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition text-sm text-slate-800 dark:text-white theme-transition';
            } else {
                wrapper.classList.add('hidden');
                wrapper.classList.remove('flex');
                dateInput.className = 'w-full px-3 py-2.5 bg-white dark:bg-emerald-900 border border-slate-200 dark:border-emerald-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition text-sm text-slate-800 dark:text-white theme-transition';
                document.getElementById('swapDateEnd').value = '';
            }
        });

        // Shift toggle
        document.querySelectorAll('input[name="swapShift"]').forEach(function (el) {
            el.addEventListener('change', handleShiftToggle);
        });
        handleShiftToggle();

        // Live time
        liveTimeInterval = setInterval(common.updateLiveTime, 1000);
        common.updateLiveTime();
    }

    // ===== DESTROY =====
    function destroy() {
        if (liveTimeInterval) {
            clearInterval(liveTimeInterval);
            liveTimeInterval = null;
        }
        loadedSubstitutes = [];
    }

    // ===== PRIVATE FUNCTIONS =====

    // จัดการ toggle ผลัดกลางวัน/กลางคืน
    function handleShiftToggle() {
        var radios = document.querySelectorAll('input[name="swapShift"]');
        var isNight = false;

        radios.forEach(function (radio) {
            if (radio.checked && radio.value === 'กลางคืน') {
                isNight = true;
            }
        });

        var toggleBg = document.getElementById('toggle-bg');
        var labelDay = document.getElementById('label-day');
        var labelNight = document.getElementById('label-night');
        var textDay = document.getElementById('text-day');
        var textNight = document.getElementById('text-night');
        var shiftTimeDesc = document.getElementById('shift-time-desc');

        if (!isNight) {
            if (toggleBg) toggleBg.style.left = '6px';
            if (labelDay) {
                var svg = labelDay.querySelector('svg');
                if (svg) svg.setAttribute('class', 'h-4 w-4 mr-1 text-orange-500');
            }
            if (textDay) textDay.className = 'text-xs font-bold text-emerald-700';
            if (labelNight) {
                var svg = labelNight.querySelector('svg');
                if (svg) svg.setAttribute('class', 'h-4 w-4 mr-1 text-slate-400');
            }
            if (textNight) textNight.className = 'text-xs font-semibold text-slate-500';

            if (shiftTimeDesc) {
                shiftTimeDesc.innerText = '07:00 - 19:00 น.';
                shiftTimeDesc.className = 'text-[10px] text-orange-600 font-semibold bg-orange-50 px-2 py-0.5 rounded-md';
            }
        } else {
            if (toggleBg) toggleBg.style.left = 'calc(50% - 6px)';
            if (labelDay) {
                var svg = labelDay.querySelector('svg');
                if (svg) svg.setAttribute('class', 'h-4 w-4 mr-1 text-slate-400');
            }
            if (textDay) textDay.className = 'text-xs font-semibold text-slate-500';
            if (labelNight) {
                var svg = labelNight.querySelector('svg');
                if (svg) svg.setAttribute('class', 'h-4 w-4 mr-1 text-indigo-500');
            }
            if (textNight) textNight.className = 'text-xs font-bold text-indigo-700';

            if (shiftTimeDesc) {
                shiftTimeDesc.innerText = '19:00 - 07:00 น.';
                shiftTimeDesc.className = 'text-[10px] text-indigo-600 font-semibold bg-indigo-50 px-2 py-0.5 rounded-md';
            }
        }
    }

    // ดึงรายชื่อผู้แทนเวรมาแสดงใน select
    function populateSubstitutes() {
        var select = document.getElementById('substituteSelect');
        select.innerHTML = '';

        var placeholderOpt = document.createElement('option');
        placeholderOpt.value = '';
        placeholderOpt.disabled = true;
        placeholderOpt.selected = true;
        placeholderOpt.textContent = '-- เลือกผู้แทน --';
        select.appendChild(placeholderOpt);

        loadedSubstitutes.forEach(function (person) {
            // ซ่อนตัวเองออกจากรายการ (เทียบ employeeId)
            if (person.employeeId === currentUser.employeeId) return;

            var opt = document.createElement('option');
            opt.value = person.employeeId;
            opt.textContent = person.name;
            select.appendChild(opt);
        });
    }

    // โหลดรายชื่อผู้แทนเวร
    async function loadSubstituteList() {
        try {
            var res = await api.getSubstituteList();
            if (res && res.success && res.data) {
                loadedSubstitutes = res.data;
            } else {
                loadedSubstitutes = [];
                console.warn('No substitute data:', res ? res.message : 'no response');
            }
        } catch (err) {
            console.error('Failed to load substitutes:', err);
            loadedSubstitutes = [];
        }
        populateSubstitutes();
    }

    // แสดงประวัติการลา
    async function updateSwapHistoryUI() {
        var historySection = document.getElementById('swap-history-section');
        var historyContainer = document.getElementById('swap-history-container');
        if (!historySection || !historyContainer) return;

        historySection.classList.remove('hidden');
        historyContainer.innerHTML = '<p class="text-xs text-slate-400 text-center py-4">กำลังโหลดประวัติ...</p>';

        try {
            var res = await api.getSwapHistory(currentUser.userId);
            if (res && res.success && res.data) {
                var history = res.data;
                if (history.length === 0) {
                    historyContainer.innerHTML = '<p class="text-xs text-slate-400 text-center py-4">ไม่พบประวัติการลา</p>';
                    return;
                }
                historyContainer.innerHTML = '';
                var classes = common.getHistoryItemClasses();

                history.forEach(function (log) {
                    // แปลงวันที่จาก yyyy-mm-dd เป็นรูปแบบไทย
                    var displayDate = common.formatDateTH(log.date);
                    var shiftLabel = log.shift || '';
                    var subName = log.substituteName || '(ไม่ระบุ)';

                    var logItem = document.createElement('div');
                    logItem.className = 'p-2.5 border rounded-xl flex justify-between items-center text-xs transition shadow-sm ' + classes.itemBg;
                    logItem.innerHTML = [
                        '<div class="flex items-center space-x-2">',
                        '<span class="font-semibold ' + classes.mainText + '">' + escapeHtml(displayDate) + '</span>',
                        shiftLabel ? '<span class="text-[10px] px-1.5 py-0.5 rounded ' + (shiftLabel === 'กลางวัน' ? 'bg-orange-100 text-orange-700' : 'bg-indigo-100 text-indigo-700') + '">' + escapeHtml(shiftLabel) + '</span>' : '',
                        '</div>',
                        '<div class="font-medium ' + classes.subText + ' text-right">' + escapeHtml(subName) + '</div>'
                    ].join('');
                    historyContainer.appendChild(logItem);
                });
            } else {
                historyContainer.innerHTML = '<p class="text-xs text-red-500 text-center py-4">โหลดประวัติไม่สำเร็จ: ' + escapeHtml(res ? res.message : '') + '</p>';
            }
        } catch (err) {
            console.error('Swap history load error:', err);
            historyContainer.innerHTML = '<p class="text-xs text-red-500 text-center py-4">โหลดประวัติไม่สำเร็จ</p>';
        }
    }

    // รีเซ็ตฟอร์ม
    function resetForm() {
        document.getElementById('swapDate').value = '';
        document.getElementById('swapDateEnd').value = '';
        var toggle = document.getElementById('multiDayToggle');
        if (toggle) toggle.checked = false;
        // ซ่อน end date wrapper
        var wrapper = document.getElementById('dateEndWrapper');
        if (wrapper) {
            wrapper.classList.add('hidden');
            wrapper.classList.remove('flex');
        }
        var dateInput = document.getElementById('swapDate');
        if (dateInput) dateInput.className = 'w-full px-3 py-2.5 bg-white dark:bg-emerald-900 border border-slate-200 dark:border-emerald-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition text-sm text-slate-800 dark:text-white theme-transition';
        document.querySelector('input[name="swapShift"][value="กลางวัน"]').checked = true;
        handleShiftToggle();
        var select = document.getElementById('substituteSelect');
        if (select) select.selectedIndex = 0;
    }

    // ส่งคำขอลา
    async function onSubmitSwap() {
        var swapDate = document.getElementById('swapDate').value;
        var isMultiDay = document.getElementById('multiDayToggle').checked;
        var swapDateEnd = isMultiDay ? document.getElementById('swapDateEnd').value : swapDate;
        var shiftEl = document.querySelector('input[name="swapShift"]:checked');
        var shift = shiftEl ? shiftEl.value : 'กลางวัน';
        var substituteSelect = document.getElementById('substituteSelect');
        var substituteUserId = substituteSelect.value;

        // Validate ฝั่ง Front-end
        if (!swapDate) {
            await modal.showError('กรุณาเลือกวันที่ลา');
            return;
        }

        if (isMultiDay && !swapDateEnd) {
            await modal.showError('กรุณาเลือกวันที่สิ้นสุด');
            return;
        }

        if (isMultiDay && swapDateEnd < swapDate) {
            await modal.showError('วันที่สิ้นสุดต้องไม่ก่อนวันที่เริ่ม');
            return;
        }

        if (!substituteUserId) {
            await modal.showError('กรุณาเลือกผู้แทนเวร');
            return;
        }

        // หาชื่อผู้แทนจาก select option ที่เลือก
        var substituteName = substituteSelect.options[substituteSelect.selectedIndex].text;
        // ถ้าเป็น placeholder ให้ clear
        if (substituteName === '-- เลือกผู้แทน --') substituteName = '';

        // แสดง Modal ยืนยัน
        var confirmResult = await modal.confirmSwap({
            swapDateStart: swapDate,
            swapDateEnd: swapDateEnd,
            shift: shift,
            requesterName: currentUser.name,
            substituteName: substituteName
        });
        if (!confirmResult.isConfirmed) return;

        common.showLoading(true);
        try {
            var payload = {
                lineUserId: currentUser.userId,
                swapDateStart: swapDate,
                swapDateEnd: swapDateEnd,
                shift: shift,
                substituteEmployeeId: substituteUserId
            };

            var result = await api.submitSwap(payload);

            common.showLoading(false);

            if (result && result.success) {
                await modal.showSuccess('บันทึกการลาเรียบร้อย ✅');
                resetForm();
                await updateSwapHistoryUI();
            } else {
                throw new Error(result ? result.message : 'บันทึกการลาไม่สำเร็จ');
            }
        } catch (err) {
            common.showLoading(false);
            await modal.showError(err.message || 'บันทึกข้อมูลไม่สำเร็จ');
        }
    }

    // เริ่มต้นแอปพลิเคชัน
    async function initApp() {
        common.showLoading(true);

        try {
            var profile = await liffApp.initLiff(CONFIG.LIFF_ID_SWAP);
            currentUser.userId = profile.userId;
            currentUser.displayName = profile.displayName;
            currentUser.pictureUrl = profile.pictureUrl;

            var verifyResult = await api.verifyUser(currentUser.userId);

            common.showLoading(false);

            if (verifyResult.success && verifyResult.data) {
                currentUser.name = verifyResult.data.name || '';
                currentUser.employeeId = verifyResult.data.employeeId || '';

                var nameDisplay = document.getElementById('user-name-display');
                var idDisplay = document.getElementById('user-id-display');
                var userAvatar = document.getElementById('user-avatar');
                if (nameDisplay) {
                    nameDisplay.textContent = currentUser.name;
                }
                if (idDisplay) {
                    idDisplay.textContent = 'รหัส: ' + currentUser.employeeId;
                }
                if (userAvatar && currentUser.pictureUrl) {
                    userAvatar.src = currentUser.pictureUrl;
                    userAvatar.classList.remove('hidden');
                }

                document.getElementById('app').style.display = 'block';
                document.getElementById('swapForm').style.display = 'block';

                await load();
                bindEvents();
            } else {
                common.showLoading(false);
                await modal.showNotRegistered();
                document.getElementById('app').style.display = 'block';
                document.getElementById('swapForm').style.display = 'none';

                var nameDisplay = document.getElementById('user-name-display');
                if (nameDisplay) nameDisplay.textContent = 'ยังไม่ได้ลงทะเบียน';
            }
        } catch (err) {
            common.showLoading(false);
            if (err.message && err.message.includes('redirecting')) return;
            common.handleError(err);
        }
    }

    return {
        init: init,
        load: load,
        bindEvents: bindEvents,
        destroy: destroy
    };
})();

// Auto-start
App.init();