import { Product } from '../types';
import { CONFIG } from './config';

export const productService = {
  async getProducts(): Promise<Product[]> {
    try {
        const response = await fetch(`${CONFIG.API_URL}/products`);
        if (!response.ok) throw new Error('Network response was not ok');
        return await response.json();
    } catch (error) {
        console.error("Failed to fetch products:", error);
        return [];
    }
  },

  // DÜZELTME 1: Artık frontend tarafında 'id' üretmiyoruz.
  async addProduct(product: Omit<Product, '_id' | 'id'>): Promise<Product> {
    const safeProduct = {
        ...product,
        // id: Date.now(),  <-- BU SATIRI SİLDİK! MongoDB kendisi _id verecek.
        images: product.images && product.images.length > 0 ? product.images : [product.image],
        image: product.image || (product.images && product.images[0]) || '',
        stock: product.stock || 0
    };

    const response = await fetch(`${CONFIG.API_URL}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(safeProduct)
    });
    
    if (!response.ok) {
        const err = await response.text();
        throw new Error(`Failed to add product: ${err}`);
    }
    return await response.json();
  },

  // DÜZELTME 2: id tipi 'number' değil 'string' olmalı (MongoDB _id için)
  async deleteProduct(id: string): Promise<void> {
    await fetch(`${CONFIG.API_URL}/products/${id}`, {
        method: 'DELETE'
    });
  },

  async updateProduct(product: Product): Promise<void> {
    const safeProduct = {
        ...product,
        images: product.images && product.images.length > 0 ? product.images : [product.image],
        image: product.image || (product.images && product.images[0]) || '',
        stock: product.stock || 0
    };

    // DÜZELTME 3: product.id yerine product._id kullanıyoruz
    // (Eğer types.ts güncellendiyse product._id hata vermez)
    const idToUpdate = product._id || product.id;

    const response = await fetch(`${CONFIG.API_URL}/products/${idToUpdate}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(safeProduct)
    });
    
    if (!response.ok) {
        const err = await response.text();
        throw new Error(`Failed to update product: ${err}`);
    }
  }
};
