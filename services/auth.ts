import { User } from '../types';
import { DB, getStorage, setStorage, delay } from './db';
import { CONFIG } from './config';
import { logService } from './logService';

export const authService = {
  async register(data: Omit<User, 'id' | 'joinDate'>): Promise<User> {
    if (CONFIG.USE_MOCK_API) {
        await delay(800); 
        const users = getStorage<User[]>(DB.USERS, []);
        
        if (users.find(u => u.email === data.email)) {
        throw new Error('Bu e-posta adresi zaten kayıtlı.');
        }

        const newUser: User = {
        ...data,
        id: crypto.randomUUID(),
        joinDate: new Date().toLocaleDateString('tr-TR'),
        isAdmin: false
        };

        users.push(newUser);
        setStorage(DB.USERS, users);
        this.setSession(newUser, true); // Kayıt sonrası varsayılan olarak oturum açık kalsın

        // LOG: Yeni üye kaydı
        await logService.addLog('info', 'Yeni Üye Kaydı', `Kullanıcı: ${newUser.name} (${newUser.email})`);

        return newUser;
    } else {
        // REAL BACKEND
        try {
            const response = await fetch(`${CONFIG.API_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Kayıt başarısız');
            }
            const user = await response.json();
            this.setSession(user, true);
            
            return user;
        } catch (error: any) {
            console.error("Register Error:", error);
            throw error;
        }
    }
  },

  async login(email: string, password: string, rememberMe: boolean = false): Promise<User> {
    if (CONFIG.USE_MOCK_API) {
        await delay(800);
        const users = getStorage<User[]>(DB.USERS, []);
        const user = users.find(u => u.email === email && u.password === password);

        if (!user) {
            throw new Error('E-posta veya şifre hatalı.');
        }

        this.setSession(user, rememberMe);
        return user;
    } else {
        // REAL BACKEND - BACKDOOR REMOVED
        try {
            const response = await fetch(`${CONFIG.API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Giriş başarısız');
            }
            const user = await response.json();
            this.setSession(user, rememberMe);
            return user;
        } catch (error: any) {
            console.error("Login Error:", error);
            throw error;
        }
    }
  },

  async logout(): Promise<void> {
    await delay(300);
    localStorage.removeItem(DB.SESSION);
    sessionStorage.removeItem(DB.SESSION);
  },

  async getCurrentUser(): Promise<User | null> {
    // Check Local Storage first (Persistent)
    const localSession = localStorage.getItem(DB.SESSION);
    if (localSession) {
        try { return JSON.parse(localSession); } catch { return null; }
    }

    // Check Session Storage (Tab only)
    const sessionSession = sessionStorage.getItem(DB.SESSION);
    if (sessionSession) {
        try { return JSON.parse(sessionSession); } catch { return null; }
    }

    return null;
  },

  setSession(user: User, remember: boolean) {
    const safeUser = { ...user };
    if (remember) {
        localStorage.setItem(DB.SESSION, JSON.stringify(safeUser));
    } else {
        sessionStorage.setItem(DB.SESSION, JSON.stringify(safeUser));
    }
  }
};
