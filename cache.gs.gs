/**
 * ชั้นอ่านข้อมูลเร็วของ backend เพื่อลดการอ่านชีทซ้ำ (Cache Policy)
 */
function getWarrantDataCache() {
  const cache = CacheService.getScriptCache();
  const cacheKey = "master_warrant_data";
  const cachedData = cache.get(cacheKey);
  
  if (cachedData != null) {
    return JSON.parse(cachedData);
  }
  
  // ถ้าไม่มี Cache หรือหมดอายุ ให้อ่านจาก Spreadsheet โดยตรง
  const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_WARRANT_ID);
  const sheet = spreadsheet.getSheetByName(CONFIG.SHEET_MASTER_WARRANTS);
  const values = sheet.getDataRange().getValues();
  
  const warrants = [];
  if (values.length > 1) {
    const headers = values[0];
    for (let i = 1; i < values.length; i++) {
      warrants.push({
        warrantNo: values[i][0],      // สมมติคอลัมน์ 1 คือ เลขที่หมายจับ
        defendantName: values[i][1],  // สมมติคอลัมน์ 2 คือ ชื่อจำเลย
        status: values[i][2]          // สมมติคอลัมน์ 3 คือ สถานะหมายจับ
      });
    }
  }
  
  // บันทึกเข้า Cache ตั้งเวลาหมดอายุไว้ 20 นาที (1200 วินาที)
  cache.put(cacheKey, JSON.stringify(warrants), 1200);
  return warrants;
}

/**
 * ล้างข้อมูล Cache เมื่อระบบมีการอัปเดตข้อมูลจริงลงชีทหลัก
 */
function clearWarrantCache() {
  const cache = CacheService.getScriptCache();
  cache.remove("master_warrant_data");
}