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

// GERÇEK SUNUCUDA ÇALIŞMASI İÇİN FALSE YAPILDI.
// Backend (node server.js) çalışıyor olmalıdır.
const USE_MOCK = false;

export const CONFIG = {
    USE_MOCK_API: USE_MOCK, 
    API_URL: env.VITE_API_URL || 'https://motovibe2.onrender.com/api'
};
