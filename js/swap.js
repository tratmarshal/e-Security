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
                    var displayTime = log.timestamp ? common.formatDateTH(log.timestamp) + ' ' + log.timestamp.split(' ')[1] : '';

                    var logItem = document.createElement('div');
                    logItem.className = 'p-3 border rounded-xl flex justify-between items-start text-xs transition shadow-sm ' + classes.itemBg;
                    logItem.innerHTML = [
                        '<div class="space-y-1">',
                        '<div class="flex items-center space-x-1.5">',
                        '<span class="font-semibold ' + classes.mainText + '">วันที่ลา: ' + escapeHtml(displayDate) + '</span>',
                        '</div>',
                        '<p class="font-medium ' + classes.subText + '">ผู้แทน: ' + escapeHtml(log.substituteName) + '</p>',
                        '</div>',
                        '<div class="text-right">',
                        '<span class="block text-[10px] ' + classes.accentText + '">' + escapeHtml(displayTime) + '</span>',
                        '</div>'
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
        var select = document.getElementById('substituteSelect');
        if (select) select.selectedIndex = 0;
    }

    // ส่งคำขอลา
    async function onSubmitSwap() {
        var swapDate = document.getElementById('swapDate').value;
        var substituteSelect = document.getElementById('substituteSelect');
        var substituteUserId = substituteSelect.value;

        // Validate ฝั่ง Front-end
        if (!swapDate) {
            await modal.showError('กรุณาเลือกวันที่ลา');
            return;
        }

        if (!substituteUserId) {
            await modal.showError('กรุณาเลือกผู้แทนเวร');
            return;
        }

        // หาชื่อผู้แทน
        var substituteName = '';
        for (var i = 0; i < loadedSubstitutes.length; i++) {
            if (loadedSubstitutes[i].employeeId === substituteUserId) {
                substituteName = loadedSubstitutes[i].name;
                break;
            }
        }

        // แสดง Modal ยืนยัน
        var confirmResult = await modal.confirmSwap({
            swapDate: swapDate,
            requesterName: currentUser.name,
            substituteName: substituteName
        });
        if (!confirmResult.isConfirmed) return;

        common.showLoading(true);
        try {
            var payload = {
                lineUserId: currentUser.userId,
                swapDate: swapDate,
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

                var welcomeText = document.getElementById('user-welcome');
                var userAvatar = document.getElementById('user-avatar');
                if (welcomeText) {
                    welcomeText.textContent = currentUser.name + ' (' + currentUser.employeeId + ')';
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

                var welcomeText = document.getElementById('user-welcome');
                if (welcomeText) welcomeText.textContent = 'ยังไม่ได้ลงทะเบียน';
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