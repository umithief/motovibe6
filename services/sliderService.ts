import { Slide } from '../types';
import { DB, getStorage, setStorage, delay } from './db';
import { DEFAULT_SLIDES } from '../constants';
import { CONFIG } from './config';

export const sliderService = {
  async getSlides(): Promise<Slide[]> {
    if (CONFIG.USE_MOCK_API) {
        await delay(300);
        const storedSlides = getStorage<Slide[]>(DB.SLIDES, []);
        if (storedSlides.length === 0) {
            setStorage(DB.SLIDES, DEFAULT_SLIDES);
            return DEFAULT_SLIDES;
        }
        return storedSlides;
    } else {
        // REAL BACKEND
        try {
            const response = await fetch(`${CONFIG.API_URL}/slides`);
            if (!response.ok) return DEFAULT_SLIDES;
            return await response.json();
        } catch {
            return DEFAULT_SLIDES;
        }
    }
  },

  // DÜZELTME 1: id alanını hariç tutuyoruz, backend verecek.
  async addSlide(slide: Omit<Slide, '_id' | 'id'>): Promise<Slide> {
    if (CONFIG.USE_MOCK_API) {
        await delay(500);
        const slides = getStorage<Slide[]>(DB.SLIDES, []);
        const newSlide: Slide = {
            ...slide,
            // Mock için hala sayı kullanabiliriz veya string yapabiliriz
            id: Date.now(), 
        } as any; // Tip uyuşmazlığını önlemek için as any
        slides.push(newSlide);
        setStorage(DB.SLIDES, slides);
        return newSlide;
    } else {
        // REAL BACKEND
        const response = await fetch(`${CONFIG.API_URL}/slides`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(slide)
        });
        return await response.json();
    }
  },

  // DÜZELTME 2: id tipi 'number' değil 'string' olmalı
  async deleteSlide(id: string): Promise<void> {
    if (CONFIG.USE_MOCK_API) {
        await delay(300);
        const slides = getStorage<Slide[]>(DB.SLIDES, []);
        // Mock verilerde id number olabilir, string'e çevirip kıyasla
        const filtered = slides.filter(s => String(s.id) !== id);
        setStorage(DB.SLIDES, filtered);
    } else {
        // REAL BACKEND
        await fetch(`${CONFIG.API_URL}/slides/${id}`, {
            method: 'DELETE'
        });
    }
  },

  async updateSlide(slide: Slide): Promise<void> {
    if (CONFIG.USE_MOCK_API) {
        await delay(300);
        const slides = getStorage<Slide[]>(DB.SLIDES, []);
        const index = slides.findIndex(s => s.id === slide.id);
        if (index !== -1) {
            slides[index] = slide;
            setStorage(DB.SLIDES, slides);
        }
    } else {
        // REAL BACKEND
        // DÜZELTME 3: slide._id kullanıyoruz
        const idToUpdate = slide._id || slide.id;
        
        await fetch(`${CONFIG.API_URL}/slides/${idToUpdate}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(slide)
        });
    }
  }
};
