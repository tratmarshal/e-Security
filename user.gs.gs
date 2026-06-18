/**
 * ดึงโปรไฟล์และข้อมูลการตั้งค่าเฉพาะของเจ้าหน้าที่ตำรวจศาลปัจจุบัน
 */
function getCurrentUserProfile() {
  const email = Session.getActiveUser().getEmail();
  return {
    email: email,
    role: "เจ้าหน้าที่ตำรวจศาล",
    permissions: { canEdit: true, canViewLog: true }
  };
}