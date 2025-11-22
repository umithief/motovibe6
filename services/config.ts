// config.ts dosyasının yeni hali:

// Render'dan aldığın "Backend" adresini buraya tırnak içine yaz:
// ÖNEMLİ: Sonunda /api olsun.
const API_URL = 'https://motovibe2.onrender.com/api'; 

// (Not: motovibe2 yerine senin Render'daki gerçek ismin neyse onu yazacaksın)

export const CONFIG = {
  USE_MOCK_API: false,
  API_URL: API_URL
};
