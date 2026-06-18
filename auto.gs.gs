/**
 * งานอัปเดตอัตโนมัติ (เรียลไทม์เบื้องหลัง) 
 * อ่านรายการแก้ไขล่าสุดจาก processing แปลงค่าหลัก แล้วสะท้อนลงฐานข้อมูลหมายจับ
 */
function triggerAutoUpdate() {
  const updateSpreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_UPDATE_ID);
  const processingSheet = updateSpreadsheet.getSheetByName(CONFIG.SHEET_PROCESSING_NAME);
  const processingData = processingSheet.getDataRange().getValues();
  
  if (processingData.length <= 1) return; // ไม่มีข้อมูลนอกจาก Header
  
  const masterSpreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_WARRANT_ID);
  const masterSheet = masterSpreadsheet.getSheetByName(CONFIG.SHEET_MASTER_WARRANTS);
  
  // 1. หาความสัมพันธ์ของหมายจับที่ต้องอัปเดตล่าสุด โดยใช้ "ลำดับรายการแก้ไข" เป็นตัวตัดสิน
  // สร้าง Map เพื่อหาแถวล่าสุดของแต่ละ เลขที่หมายจับ ที่มีสถานะ 'pending' หรือต้องประมวลผล
  let latestUpdatesMap = new Map();
  
  for (let i = 1; i < processingData.length; i++) {
    const rowId = processingData[i][0];       // ลำดับรายการแก้ไข
    const warrantNo = processingData[i][2];   // เลขที่หมายจับ
    const displayStatus = processingData[i][3];// ป้ายแสดงผลในพื้นที่ทำงาน เช่น "รอเพิกถอน"
    const internalStatus = processingData[i][7];// สถานะภายใน เช่น "pending"
    
    if (internalStatus === VARS.INTERNAL_STATUS.PENDING) {
      // หากมีหลายรายการแก้ไขในหมายจับเดียวกัน ลำดับรายการแก้ไขที่มากกว่าจะเข้ามาทับ (ล่าสุดเสมอ)
      if (!latestUpdatesMap.has(warrantNo) || latestUpdatesMap.get(warrantNo).rowId < rowId) {
        latestUpdatesMap.set(warrantNo, {
          sheetRowIndex: i + 1, // บันทึกตำแหน่งแถวในชีทจริง (index เริ่มจาก 1 + header)
          rowId: rowId,
          warrantNo: warrantNo,
          displayStatus: displayStatus
        });
      }
    }
  }
  
  if (latestUpdatesMap.size === 0) return; // ไม่มีงานค้างทำ
  
  // ดึงข้อมูลหมายจับทั้งหมดจากฐานข้อมูลหลักมาเตรียมค้นหาแถวเพื่ออัปเดต
  const masterData = masterSheet.getDataRange().getValues();
  let isMasterChanged = false;
  
  // 2. เริ่มประมวลผลสะท้อนข้อมูลทีละรายการ
  latestUpdatesMap.forEach((updateInfo, warrantNo) => {
    try {
      // ค้นหาแถวของหมายจับในฐานข้อมูลหลัก
      let masterRowIndex = -1;
      for (let j = 1; j < masterData.length; j++) {
        if (masterData[j][0] === warrantNo) { // สมมติคอลัมน์แรกคือ เลขที่หมายจับ
          masterRowIndex = j + 1;
          break;
        }
      }
      
      if (masterRowIndex !== -1) {
        // --- ส่วนสำคัญ: การแปลงค่าป้ายแสดงผลพื้นที่ทำงาน เป็น ค่าหลักของฐานข้อมูลหมายจับ ---
        let finalMasterStatus = updateInfo.displayStatus;
        if (updateInfo.displayStatus === VARS.DISPLAY_STATUS.AWAITING_REVOCATION) {
          finalMasterStatus = VARS.WARRANT_STATUS.AWAITING_REVOCATION; // "สิ้นผลรอเพิกถอน"
        }
        
        // เขียนสถานะใหม่ลงฐานข้อมูลหลัก (สมมติคอลัมน์สถานะคือคอลัมน์ที่ 3)
        masterSheet.getRange(masterRowIndex, 3).setValue(finalMasterStatus);
        
        // ปรับสถานะภายในของรายการแก้ไขในแท็บ processing เป็น synced
        processingSheet.getRange(updateInfo.sheetRowIndex, 8).setValue(VARS.INTERNAL_STATUS.SYNCED);
        isMasterChanged = true;
      } else {
        // หาเลขที่หมายจับในระบบหลักไม่เจอ ให้ปรับสถานะภายในเป็น error
        processingSheet.getRange(updateInfo.sheetRowIndex, 8).setValue(VARS.INTERNAL_STATUS.ERROR);
      }
    } catch (err) {
      // หากเกิด Error ระหว่างประมวลผลรายการใดรายการหนึ่ง ให้บันทึกสถานะภายในเป็น error
      processingSheet.getRange(updateInfo.sheetRowIndex, 8).setValue(VARS.INTERNAL_STATUS.ERROR);
    }
  });
  
  // 3. หลังจากอัปเดตฐานข้อมูลหลักเสร็จสิ้น ให้ทำการล้าง Cache เพื่อให้การค้นหาครั้งต่อไปได้ข้อมูลใหม่ล่าสุด
  if (isMasterChanged) {
    clearWarrantCache();
  }
}