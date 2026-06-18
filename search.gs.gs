/**
 * ค้นหาข้อมูลหมายจับและข้อมูลจำเลย โดยอ่านผ่าน Cache ชั้นแรก
 * @param {Object} criteria เงื่อนไขการค้นหา เช่น { nationalId: '...', warrantNo: '...' }
 * @return {Array<Object>} รายการหมายจับที่ตรงตามเงื่อนไข
 */
function searchWarrants(criteria) {
  logActivity('searchWarrants', `ค้นหาหมายจับด้วยเงื่อนไข: ${JSON.stringify(criteria)}`, 'หน้าค้นหา');
  
  //ดึงข้อมูลทั้งหมดจาก Cache (ถ้าไม่มีจะโหลดจาก Spreadsheet อัตโนมัติ)
  const masterWarrants = getWarrantDataCache();
  
  // ทำการ Filter ข้อมูลตามเงื่อนไขที่ส่งมา
  return masterWarrants.filter(warrant => {
    let match = true;
    if (criteria.warrantNo && warrant.warrantNo !== criteria.warrantNo) match = false;
    if (criteria.defendantName && !warrant.defendantName.includes(criteria.defendantName)) match = false;
    return match;
  });
}