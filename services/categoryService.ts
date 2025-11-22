import { CategoryItem, ProductCategory } from '../types';
import { DB, getStorage, setStorage, delay } from './db';
import { CONFIG } from './config';

// Varsayılan Kategoriler (Yedek - Backend çalışmazsa bunlar görünür)
const DEFAULT_CATEGORIES: CategoryItem[] = [
  {
    id: 'cat-1',
    name: 'KASKLAR',
    type: ProductCategory.HELMET,
    image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=800&auto=format&fit=crop',
    desc: 'Maksimum Güvenlik',
    count: '142 Model',
    className: 'col-span-2 row-span-2'
  },
  {
    id: 'cat-2',
    name: 'MONTLAR',
    type: ProductCategory.JACKET,
    image: 'https://images.unsplash.com/photo-1559582930-bb01987cf4dd?q=80&w=800&auto=format&fit=crop',
    desc: '4 Mevsim Koruma',
    count: '85 Model',
    className: 'col-span-2 row-span-1'
  },
  {
    id: 'cat-3',
    name: 'ELDİVENLER',
    type: ProductCategory.GLOVES,
    image: 'https://images.unsplash.com/photo-1555481771-16417c6f656c?q=80&w=800&auto=format&fit=crop',
    desc: 'Hassas Kontrol',
    count: '64 Model',
    className: 'col-span-1 row-span-1'
  },
  {
    id: 'cat-4',
    name: 'BOTLAR',
    type: ProductCategory.BOOTS,
    image: 'https://images.unsplash.com/photo-1555813456-96e25216239e?q=80&w=800&auto=format&fit=crop',
    desc: 'Sağlam Adımlar',
    count: '32 Model',
    className: 'col-span-1 row-span-1'
  },
  {
    id: 'cat-5',
    name: 'EKİPMAN',
    type: ProductCategory.PROTECTION,
    image: 'https://images.unsplash.com/photo-1584556966052-c229e215e03f?q=80&w=800&auto=format&fit=crop',
    desc: 'Zırh & Koruma',
    count: '95 Parça',
    className: 'col-span-1 md:col-span-2 row-span-1'
  },
  {
    id: 'cat-6',
    name: 'İNTERKOM',
    type: ProductCategory.INTERCOM,
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=800&auto=format&fit=crop',
    desc: 'İletişim',
    count: '12 Model',
    className: 'col-span-1 md:col-span-2 row-span-1'
  },
];

export const categoryService = {
  async getCategories(): Promise<CategoryItem[]> {
    if (CONFIG.USE_MOCK_API) {
        await delay(300);
        const stored = getStorage<CategoryItem[]>(DB.CATEGORIES, []);
        if (stored.length === 0) {
            setStorage(DB.CATEGORIES, DEFAULT_CATEGORIES);
            return DEFAULT_CATEGORIES;
        }
        return stored;
    } else {
        // REAL BACKEND
        try {
            const response = await fetch(`${CONFIG.API_URL}/categories`);
            if (!response.ok) return DEFAULT_CATEGORIES;
            return await response.json();
        } catch {
            return DEFAULT_CATEGORIES;
        }
    }
  },

  async addCategory(category: Omit<CategoryItem, 'id'>): Promise<CategoryItem> {
    if (CONFIG.USE_MOCK_API) {
        await delay(500);
        const categories = getStorage<CategoryItem[]>(DB.CATEGORIES, []);
        const newCat: CategoryItem = {
            ...category,
            id: `cat-${Date.now()}`,
        };
        categories.push(newCat);
        setStorage(DB.CATEGORIES, categories);
        return newCat;
    } else {
        // REAL BACKEND
        const response = await fetch(`${CONFIG.API_URL}/categories`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(category)
        });
        return await response.json();
    }
  },

  async updateCategory(category: CategoryItem): Promise<void> {
    if (CONFIG.USE_MOCK_API) {
        await delay(300);
        const categories = getStorage<CategoryItem[]>(DB.CATEGORIES, []);
        const index = categories.findIndex(c => c.id === category.id);
        if (index !== -1) {
            categories[index] = category;
            setStorage(DB.CATEGORIES, categories);
        }
    } else {
        // REAL BACKEND (DÜZELTİLDİ)
        // category.id yerine category._id kullanıyoruz.
        await fetch(`${CONFIG.API_URL}/categories/${category._id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(category)
        });
    }
  },

  async deleteCategory(id: string): Promise<void> {
    if (CONFIG.USE_MOCK_API) {
        await delay(300);
        const categories = getStorage<CategoryItem[]>(DB.CATEGORIES, []);
        const filtered = categories.filter(c => c.id !== id);
        setStorage(DB.CATEGORIES, filtered);
    } else {
        // REAL BACKEND (DÜZELTİLDİ)
        // Buraya gelen 'id' parametresinin _id olduğundan emin olmalıyız.
        await fetch(`${CONFIG.API_URL}/categories/${id}`, {
            method: 'DELETE'
        });
    }
  }
};
