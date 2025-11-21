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

// ÖNEMLİ: Verilerin kalıcı olması için Backend'i zorunlu kılıyoruz.
// Lütfen backend klasöründe 'node server.js' komutunu çalıştırın.
const USE_MOCK = false; 

export const CONFIG = {
    USE_MOCK_API: USE_MOCK, 
    API_URL: env.VITE_API_URL || 'http://localhost:5000/api'
};