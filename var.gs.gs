// ประกาศค่าคงที่ภาษากลางของระบบ (Domain Language)

const VARS = {
  // สถานะหมายจับหลัก (ค่าหลักของฐานข้อมูลหมายจับ)
  WARRANT_STATUS: {
    WANTED: "ต้องการตัว",
    AWAITING_REVOCATION: "สิ้นผลรอเพิกถอน",
    REVOKED: "เพิกถอน"
  },
  
  // สถานะสำนวน (งานธุรการของรายการดำเนินการ)
  CASE_STATUS: {
    PENDING: "รอดำเนินการ",
    SUBMITTED: "เสนอศาล",
    AWAITING_FORWARD: "รอส่งต่อ",
    FORWARDED: "ส่งต่อแล้ว"
  },
  
  // ป้ายแสดงผลในพื้นที่ทำงาน / processing
  DISPLAY_STATUS: {
    AWAITING_REVOCATION: "รอเพิกถอน"
  },
  
  // เหตุผลที่ทำให้หมายจับสิ้นผล
  REASONS: {
    SURRENDER: "มอบตัว",
    ARRESTED: "ตำรวจจับ",
    OTHER_PRISON: "อยู่เรือนจำอื่น",
    OTHERS: "อื่น ๆ"
  },
  
  // สถานะภายในของรายการแก้ไข
  INTERNAL_STATUS: {
    PENDING: "pending",
    SYNCED: "synced",
    ERROR: "error"
  }
};