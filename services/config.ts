// Bu dosya uygulamanın nerede çalıştığını (Local vs Canlı) otomatik algılar.

const getEnv = () => {
    try {
        // @ts-ignore
        return (import.meta && import.meta.env) ? import.meta.env : {};
    } catch {
        return {};
    }
};

const env = getEnv();

// VITE_API_URL varsa onu kullan (Canlı Sunucu), yoksa Localhost kullan
const API_URL = env.VITE_API_URL || 'http://localhost:5000/api';

// Eğer API_URL 'localhost' içeriyorsa ve environment production değilse Mock kapalı
const USE_MOCK = false;

export const CONFIG = {
    USE_MOCK_API: USE_MOCK, 
    API_URL: API_URL
};
