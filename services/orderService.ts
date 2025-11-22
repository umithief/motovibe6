import { Order, CartItem, User } from '../types';
import { DB, getStorage, setStorage, delay } from './db';
import { CONFIG } from './config';
import { logService } from './logService';

export const orderService = {
  async createOrder(user: User, items: CartItem[], total: number): Promise<Order> {
    // Kullanıcı ID'sini güvenli al (MongoDB _id veya eski id)
    const safeUserId = user._id || user.id;

    if (CONFIG.USE_MOCK_API) {
        await delay(1000);
        const orders = getStorage<Order[]>(DB.ORDERS, []);
        const newOrder: Order = {
            // Mock modda elle ID veriyoruz
            id: `MV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
            userId: safeUserId,
            date: new Date().toLocaleDateString('tr-TR'),
            status: 'Hazırlanıyor',
            total: total,
            items: items.map(item => ({
                productId: item._id || item.id, // Ürün ID'si (_id öncelikli)
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                image: item.image
            }))
        };
        orders.unshift(newOrder);
        setStorage(DB.ORDERS, orders);

        // LOG: Yeni Sipariş
        await logService.addLog('success', 'Yeni Sipariş', `Sipariş No: ${newOrder.id} - Tutar: ₺${total}`);

        return newOrder;
    } else {
        // REAL BACKEND
        const orderData = {
            userId: safeUserId,
            total: total,
            // Backend otomatik tarih ve durum atıyor, göndermeye gerek yok
            items: items.map(item => ({
                productId: item._id || item.id, // BURASI ÖNEMLİ: Ürünün gerçek ID'sini gönder
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                image: item.image
            }))
        };
        
        const response = await fetch(`${CONFIG.API_URL}/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Sipariş oluşturulamadı: ${errorText}`);
        }

        const result = await response.json();
        
        // Başarılı logu (sadece Frontend tarafında görünmesi için)
        await logService.addLog('success', 'Yeni Sipariş', `Tutar: ₺${total}`);
        
        return result;
    }
  },

  async getUserOrders(userId: string): Promise<Order[]> {
    if (CONFIG.USE_MOCK_API) {
        await delay(500);
        const allOrders = getStorage<Order[]>(DB.ORDERS, []);
        return allOrders.filter(order => order.userId === userId);
    } else {
        // REAL BACKEND
        // userId parametresini backend sorgusuna ekliyoruz
        const response = await fetch(`${CONFIG.API_URL}/orders?userId=${userId}`);
        
        if (!response.ok) return [];
        return await response.json();
    }
  },
  
  // Admin için Sipariş Durumu Güncelleme (Lazım olabilir, ekledim)
  async updateOrderStatus(orderId: string, status: string): Promise<void> {
      if (CONFIG.USE_MOCK_API) {
          const orders = getStorage<Order[]>(DB.ORDERS, []);
          const order = orders.find(o => o.id === orderId);
          if (order) {
              order.status = status;
              setStorage(DB.ORDERS, orders);
          }
      } else {
          // REAL BACKEND
          // orderId burada _id olmalı
          await fetch(`${CONFIG.API_URL}/orders/${orderId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status })
          });
      }
  }
};
