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

  async addProduct(product: Omit<Product, 'id'>): Promise<Product> {
    const safeProduct = {
        ...product,
        // Frontend ID üretsin (Timestamp) - Sayısal çakışmayı önler
        id: Date.now(), 
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

  async deleteProduct(id: number): Promise<void> {
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

    const response = await fetch(`${CONFIG.API_URL}/products/${product._id}`, {
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
