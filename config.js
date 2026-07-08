/**
 * e-Security - Configuration
 * All environment-specific settings in one place.
 */

const CONFIG = {
  // Backend API URL (Google Apps Script Web App)
  // เปลี่ยนเป็น URL ของ Web App ที่ deploy แล้ว
  API_URL: 'https://script.google.com/macros/s/AKfycbyrigshyMUC6u3cJeWBseJW1GAYGfzeyb5MjEgj995xX4BZXgkX2UghQUrkGMXvVkBh/exec',

  // LIFF App ID (จาก LINE Developers)
  LIFF_ID: '2010616678-GGszdIBe',

  // Duty points - สามารถเพิ่ม/แก้ไขได้ที่นี่
  DUTY_POINTS: [
    'ประตูหน้า',
    'ประตูหลัง',
    'อาคาร A',
    'อาคาร B',
    'อาคาร C',
    'ลานจอดรถ',
    'ศูนย์ควบคุม',
    'รอบนอก'
  ],

  // API timeout (milliseconds)
  API_TIMEOUT: 15000,

  // Number of retries on network error
  API_RETRY_COUNT: 2,

  // Retry delay (ms)
  API_RETRY_DELAY: 1000,
};

// Freeze to prevent accidental modification
Object.freeze(CONFIG);