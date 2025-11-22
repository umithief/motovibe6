import React, { useState, useEffect, useRef } from 'react';
import { LayoutDashboard, Package, ShoppingCart, Users, Plus, Trash2, Edit2, CheckCircle, XCircle, Search, TrendingUp, DollarSign, Activity, Filter, ChevronDown, Bell, Shield, ShieldAlert, ShieldCheck, Upload, Image as ImageIcon, MonitorPlay, Globe, BarChart2, Clock, Eye, ShoppingBag, Calendar, X, MapPin, Phone, Mail, AlertTriangle, Grid, Link } from 'lucide-react';
import { Order, Product, ProductCategory, User, Slide, ActivityLog, VisitorStats, AnalyticsDashboardData, TimeRange, CategoryItem } from '../types';
import { Button } from './Button';
import { productService } from '../services/productService';
import { sliderService } from '../services/sliderService';
import { categoryService } from '../services/categoryService';
import { logService } from '../services/logService';
import { statsService } from '../services/statsService';
import { getStorage, setStorage, DB } from '../services/db';
import { ToastType } from './Toast';

interface AdminPanelProps {
  onLogout: () => void;
  onBackToSite: () => void;
  onShowToast: (type: ToastType, message: string) => void;
}

type AdminTab = 'dashboard' | 'products' | 'orders' | 'users' | 'slider' | 'analytics' | 'categories';

interface ProductFormState extends Partial<Product> {
    images: string[];
}

// YARDIMCI FONKSİYON: Resmi Sıkıştır ve Küçült
const resizeImage = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Maksimum genişlik 800px - DB için optimal
        const MAX_WIDTH = 800;
        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        // JPEG formatında ve 0.6 kalitesinde sıkıştır (Yaklaşık 80-100KB)
        resolve(canvas.toDataURL('image/jpeg', 0.6));
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
};

export const AdminPanel: React.FC<AdminPanelProps> = ({ onLogout, onBackToSite, onShowToast }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  
  // Data States
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [slides, setSlides] = useState<Slide[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [visitorStats, setVisitorStats] = useState<VisitorStats>({ totalVisits: 0, todayVisits: 0 });
  const [analyticsData, setAnalyticsData] = useState<AnalyticsDashboardData | null>(null);
  const [categories, setCategories] = useState<CategoryItem[]>([]);

  // Filters & UI States
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null); // For Order Detail Modal

  // Product Form State
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState<ProductFormState>({
    name: '',
    description: '',
    price: 0,
    category: ProductCategory.ACCESSORY,
    image: '',
    images: ['', '', '', ''],
    rating: 5.0,
    features: [],
    stock: 10
  });
  const [featuresInput, setFeaturesInput] = useState('');

  // Category Form State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);
  const [categoryForm, setCategoryForm] = useState<Partial<CategoryItem>>({
      name: '',
      type: ProductCategory.ACCESSORY,
      image: '',
      desc: '',
      count: '',
      className: 'col-span-1 row-span-1'
  });

  // Slider Form State
  const [isSlideModalOpen, setIsSlideModalOpen] = useState(false);
  const [editingSlide, setEditingSlide] = useState<Slide | null>(null);
  const [slideForm, setSlideForm] = useState<Partial<Slide>>({
    title: '',
    subtitle: '',
    image: '',
    cta: 'İNCELE'
  });

  // Refs
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const slideFileInputRef = useRef<HTMLInputElement>(null);
  const categoryFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadData();
  }, [activeTab, timeRange]);

  const loadData = async () => {
    const prod = await productService.getProducts();
    setProducts(prod);

    const ord = getStorage<Order[]>(DB.ORDERS, []);
    setOrders(ord);

    const usr = getStorage<User[]>(DB.USERS, []);
    setUsers(usr);

    const sld = await sliderService.getSlides();
    setSlides(sld);

    const sysLogs = await logService.getLogs();
    setLogs(sysLogs);

    const vStats = await statsService.getVisitorStats();
    setVisitorStats(vStats);

    const cats = await categoryService.getCategories();
    setCategories(cats);

    if (activeTab === 'analytics' || activeTab === 'dashboard') {
        const anData = await statsService.getAnalyticsDashboard(timeRange);
        setAnalyticsData(anData);
    }
  };

  // --- Handlers: Product ---

  const openProductModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      const existingImages = product.images && product.images.length > 0 ? [...product.images] : [product.image];
      while(existingImages.length < 4) existingImages.push('');
      
      setProductForm({ 
          ...product, 
          images: existingImages,
          stock: product.stock || 0 
      });
      setFeaturesInput(product.features.join(', '));
    } else {
      setEditingProduct(null);
      setProductForm({
        name: '',
        description: '',
        price: 0,
        category: ProductCategory.ACCESSORY,
        image: '',
        images: ['', '', '', ''],
        rating: 5.0,
        features: [],
        stock: 10
      });
      setFeaturesInput('');
    }
    setIsProductModalOpen(true);
  };

  const handleProductImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        // Resmi sıkıştır (0.6 kalite)
        const compressedBase64 = await resizeImage(file);
        
        const newImages = [...productForm.images];
        newImages[index] = compressedBase64;
        
        // Ana resim mantığı
        let mainImage = productForm.image;
        if (index === 0) mainImage = compressedBase64;
        
        setProductForm({ ...productForm, images: newImages, image: mainImage });
        onShowToast('info', 'Görsel optimize edilerek yüklendi.');
      } catch (err) {
        console.error("Resim işleme hatası:", err);
        onShowToast('error', 'Görsel yüklenirken hata oluştu.');
      }
    }
  };

  const handleProductImageUrlChange = (url: string, index: number) => {
    const newImages = [...productForm.images];
    newImages[index] = url;
    let mainImage = productForm.image;
    if (index === 0) mainImage = url;
    setProductForm({ ...productForm, images: newImages, image: mainImage });
  };

  const handleRemoveImage = (index: number) => {
      const newImages = [...productForm.images];
      newImages[index] = '';
      
      // Eğer ana resim (0. indeks) silindiyse ve başka resim varsa onu ana resim yap
      let mainImage = productForm.image;
      if (index === 0) {
          const nextAvailable = newImages.find(img => img !== '');
          mainImage = nextAvailable || '';
      }
      
      setProductForm({ ...productForm, images: newImages, image: mainImage });
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.name || !productForm.price) return;

    const cleanImages = productForm.images.filter(img => img && img.trim() !== '');
    const mainImage = cleanImages.length > 0 ? cleanImages[0] : 'https://via.placeholder.com/400';
    const features = featuresInput.split(',').map(f => f.trim()).filter(f => f);

    const finalProductData = {
        ...productForm,
        price: Number(productForm.price),
        stock: Number(productForm.stock),
        features: features,
        image: mainImage,
        images: cleanImages.length > 0 ? cleanImages : [mainImage]
    };

    try {
        if (editingProduct) {
            await productService.updateProduct({ ...editingProduct, ...finalProductData } as Product);
            onShowToast('success', 'Ürün güncellendi');
        } else {
            await productService.addProduct(finalProductData as any);
            onShowToast('success', 'Yeni ürün eklendi');
        }
        setIsProductModalOpen(false);
        loadData();
    } catch (error) {
        console.error(error);
        onShowToast('error', 'Kaydetme başarısız. Görsel boyutu çok büyük olabilir.');
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if (window.confirm('Bu ürünü silmek istediğinize emin misiniz?')) {
      await productService.deleteProduct(id);
      onShowToast('info', 'Ürün silindi');
      loadData();
    }
  };

  // --- Handlers: Category ---

  const handleSaveCategory = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!categoryForm.name || !categoryForm.image) return;
      const finalCategory = { ...categoryForm } as CategoryItem;

      try {
          if (editingCategory) {
              await categoryService.updateCategory(finalCategory);
              onShowToast('success', 'Kategori güncellendi');
          } else {
              await categoryService.addCategory(finalCategory);
              onShowToast('success', 'Kategori eklendi');
          }
          setIsCategoryModalOpen(false);
          loadData();
      } catch (error) {
          onShowToast('error', 'Kategori kaydedilemedi.');
      }
  };

  const handleCategoryImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          try {
            const compressed = await resizeImage(file);
            setCategoryForm({ ...categoryForm, image: compressed });
          } catch {
            onShowToast('error', 'Görsel işlenemedi.');
          }
      }
  };

  const handleDeleteCategory = async (id: string) => {
      if(window.confirm('Silmek istediğinize emin misiniz?')) {
          await categoryService.deleteCategory(id);
          onShowToast('info', 'Kategori silindi');
          loadData();
      }
  };

  // --- Handlers: Slider ---

  const handleSaveSlide = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slideForm.title || !slideForm.image) return;
    const finalSlideData = { ...slideForm, action: 'shop' as any };
    
    try {
        if (editingSlide) {
            await sliderService.updateSlide({ ...editingSlide, ...finalSlideData } as Slide);
            onShowToast('success', 'Slider güncellendi');
        } else {
            await sliderService.addSlide(finalSlideData as any);
            onShowToast('success', 'Slider eklendi');
        }
        setIsSlideModalOpen(false);
        loadData();
    } catch (error) {
        onShowToast('error', 'Slider kaydedilemedi.');
    }
  };

  const handleSliderImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          try {
            const compressed = await resizeImage(file);
            setSlideForm({ ...slideForm, image: compressed });
          } catch {
            onShowToast('error', 'Görsel işlenemedi.');
          }
      }
  };

  const handleDeleteSlide = async (id: number) => {
    if (window.confirm('Silmek istediğinize emin misiniz?')) {
        await sliderService.deleteSlide(id);
        onShowToast('info', 'Slider silindi');
        loadData();
    }
  };

  // ... (Orders & Users handlers remain same) ...
  const handleOrderStatusChange = (orderId: string, newStatus: Order['status']) => {
    const updatedOrders = orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o);
    setOrders(updatedOrders);
    setStorage(DB.ORDERS, updatedOrders);
    onShowToast('success', 'Sipariş durumu güncellendi');
  };

  const handleDeleteUser = (userId: string) => {
    if (window.confirm('Kullanıcıyı silmek istediğinize emin misiniz?')) {
        const updatedUsers = users.filter(u => u.id !== userId);
        setUsers(updatedUsers);
        setStorage(DB.USERS, updatedUsers);
        onShowToast('info', 'Kullanıcı silindi');
    }
  };

  const handleToggleAdmin = (userId: string) => {
    const updatedUsers = users.map(u => u.id === userId ? { ...u, isAdmin: !u.isAdmin } : u);
    setUsers(updatedUsers);
    setStorage(DB.USERS, updatedUsers);
    onShowToast('success', 'Kullanıcı yetkisi değiştirildi');
  };

  // ... (Render functions remain similar, updating Product Form render) ...

  // --- RENDER FUNCTIONS ---
  const renderDashboard = () => { /* Same as previous */ 
      const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
      return (
        <div className="space-y-8 animate-in fade-in">
             <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-gray-900 border border-white/10 p-6 rounded-xl"><p className="text-gray-400 text-xs font-bold">TOPLAM SATIŞ</p><h3 className="text-3xl font-bold text-white mt-2">₺{totalRevenue.toLocaleString('tr-TR')}</h3></div>
                <div className="bg-gray-900 border border-white/10 p-6 rounded-xl"><p className="text-gray-400 text-xs font-bold">SİPARİŞLER</p><h3 className="text-3xl font-bold text-white mt-2">{orders.length}</h3></div>
                <div className="bg-gray-900 border border-white/10 p-6 rounded-xl"><p className="text-gray-400 text-xs font-bold">ZİYARETÇİLER</p><h3 className="text-3xl font-bold text-white mt-2">{visitorStats.totalVisits}</h3></div>
                <div className="bg-gray-900 border border-white/10 p-6 rounded-xl"><p className="text-gray-400 text-xs font-bold">ÜRÜNLER</p><h3 className="text-3xl font-bold text-white mt-2">{products.length}</h3></div>
             </div>
             {/* Logs */}
             <div className="bg-gray-900 border border-white/10 rounded-xl overflow-hidden">
                <div className="p-6 border-b border-white/10"><h3 className="text-lg font-bold text-white flex items-center gap-2"><Activity className="w-5 h-5 text-moto-accent" /> Sistem Aktiviteleri</h3></div>
                <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                    {logs.map((log) => (
                        <div key={log.id} className="flex items-center p-4 border-b border-white/5 hover:bg-white/5 text-sm">
                            <div className="w-20 text-xs text-gray-500 font-mono">{log.time}</div>
                            <div className={`w-2 h-2 rounded-full mx-4 ${log.type === 'success' ? 'bg-green-500' : log.type === 'error' ? 'bg-red-500' : 'bg-blue-500'}`}></div>
                            <div className="flex-1"><span className="text-white font-bold mr-2">{log.event}</span><span className="text-gray-400 text-xs">{log.details}</span></div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      );
  };

  const renderProducts = () => {
    const filteredProducts = products.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-in fade-in">
            <div className="flex flex-col md:flex-row justify-between gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input type="text" placeholder="Ürünlerde ara..." className="w-full bg-gray-900 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:border-moto-accent outline-none" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
                <Button onClick={() => openProductModal()}><Plus className="w-5 h-5 mr-2" /> YENİ ÜRÜN EKLE</Button>
            </div>

            <div className="bg-gray-900 border border-white/10 rounded-xl overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-white/10 bg-gray-800/50 text-xs uppercase text-gray-400 font-bold">
                            <th className="p-4">Ürün</th><th className="p-4">Kategori</th><th className="p-4">Stok</th><th className="p-4">Fiyat</th><th className="p-4 text-right">İşlem</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {filteredProducts.map((product) => (
                            <tr key={product.id} className="hover:bg-white/5">
                                <td className="p-4 flex items-center gap-3"><div className="w-10 h-10 rounded bg-black border border-white/10 overflow-hidden"><img src={product.image} className="w-full h-full object-cover" /></div><span className="text-white font-medium">{product.name}</span></td>
                                <td className="p-4 text-gray-400 text-sm">{product.category}</td>
                                <td className="p-4"><span className={`px-2 py-1 rounded text-[10px] font-bold ${product.stock > 5 ? 'bg-green-900/30 text-green-400' : product.stock > 0 ? 'bg-yellow-900/30 text-yellow-400' : 'bg-red-900/30 text-red-400'}`}>{product.stock > 0 ? `${product.stock} Adet` : 'Tükendi'}</span></td>
                                <td className="p-4 font-mono text-white">₺{product.price.toLocaleString('tr-TR')}</td>
                                <td className="p-4 text-right"><div className="flex justify-end gap-2"><button onClick={() => openProductModal(product)} className="p-2 text-blue-400 hover:bg-blue-900/20 rounded"><Edit2 className="w-4 h-4"/></button><button onClick={() => handleDeleteProduct(product.id)} className="p-2 text-red-400 hover:bg-red-900/20 rounded"><Trash2 className="w-4 h-4"/></button></div></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Product Modal */}
            {isProductModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setIsProductModalOpen(false)}>
                    <div className="bg-[#0f0f0f] border border-gray-700 rounded-2xl p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-bold text-white mb-6">{editingProduct ? 'Ürünü Düzenle' : 'Yeni Ürün Ekle'}</h3>
                        <form onSubmit={handleSaveProduct} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Ürün Adı</label>
                                        <input type="text" required className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white outline-none" value={productForm.name} onChange={e => setProductForm({...productForm, name: e.target.value})} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Kategori</label>
                                            <select className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white outline-none" value={productForm.category} onChange={e => setProductForm({...productForm, category: e.target.value as ProductCategory})}>
                                                {Object.values(ProductCategory).map(c => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Stok Adedi</label>
                                            <input type="number" required className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white outline-none" value={productForm.stock} onChange={e => setProductForm({...productForm, stock: Number(e.target.value)})} />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Fiyat (₺)</label>
                                        <input type="number" required className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white outline-none" value={productForm.price} onChange={e => setProductForm({...productForm, price: Number(e.target.value)})} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Açıklama</label>
                                        <textarea className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white outline-none min-h-[100px]" value={productForm.description} onChange={e => setProductForm({...productForm, description: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Özellikler</label>
                                        <input type="text" placeholder="Virgülle ayırın" className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white outline-none" value={featuresInput} onChange={e => setFeaturesInput(e.target.value)} />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-3">Görseller (Max 4 - Otomatik Sıkıştırılır)</label>
                                    <div className="grid grid-cols-2 gap-4">
                                        {productForm.images.map((img, index) => (
                                            <div key={index} className="relative aspect-square bg-gray-800 rounded-lg border border-gray-700 flex flex-col items-center justify-center overflow-hidden">
                                                {img ? (
                                                    <>
                                                        <img src={img} className="w-full h-full object-cover" />
                                                        <button type="button" onClick={() => handleRemoveImage(index)} className="absolute top-1 right-1 bg-black/50 text-white p-1 rounded-full hover:bg-red-600"><Trash2 className="w-3 h-3"/></button>
                                                        {index === 0 && <div className="absolute bottom-1 left-1 bg-moto-accent text-[8px] text-white px-1 rounded">KAPAK</div>}
                                                    </>
                                                ) : (
                                                    <div className="flex flex-col items-center p-2 w-full">
                                                        <input 
                                                            type="text" 
                                                            placeholder="URL Yapıştır" 
                                                            className="w-full bg-black/50 border border-gray-600 text-[9px] text-white p-1 mb-2 rounded outline-none"
                                                            onChange={(e) => handleProductImageUrlChange(e.target.value, index)}
                                                        />
                                                        <div className="text-[9px] text-gray-500 mb-1">- VEYA -</div>
                                                        <div className="cursor-pointer text-gray-400 hover:text-white flex flex-col items-center" onClick={() => fileInputRefs.current[index]?.click()}>
                                                            <Upload className="w-5 h-5" /><span className="text-[8px] uppercase mt-1">Dosya Seç</span>
                                                        </div>
                                                    </div>
                                                )}
                                                <input type="file" ref={el => { fileInputRefs.current[index] = el; }} className="hidden" accept="image/*" onChange={(e) => handleProductImageUpload(e, index)} />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 border-t border-gray-800 pt-4">
                                <Button type="button" variant="outline" onClick={() => setIsProductModalOpen(false)}>İptal</Button>
                                <Button type="submit" variant="primary">Kaydet</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
  };

  const renderOrders = () => {
      const filteredOrders = orders.filter(o => o.id.toLowerCase().includes(searchTerm.toLowerCase()) || o.status.toLowerCase().includes(searchTerm.toLowerCase()));
      return (
          <div className="space-y-6 animate-in fade-in">
              <div className="relative w-64"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" /><input type="text" placeholder="Sipariş ara..." className="w-full bg-gray-900 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:border-moto-accent outline-none" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /></div>
              <div className="bg-gray-900 border border-white/10 rounded-xl overflow-hidden">
                  <table className="w-full text-left">
                      <thead><tr className="border-b border-white/10 bg-gray-800/50 text-xs uppercase text-gray-400 font-bold"><th className="p-4">Sipariş No</th><th className="p-4">Tarih</th><th className="p-4">Tutar</th><th className="p-4">Durum</th><th className="p-4 text-right">Detay</th></tr></thead>
                      <tbody className="divide-y divide-white/5">
                          {filteredOrders.map(order => (
                              <tr key={order.id} className="hover:bg-white/5">
                                  <td className="p-4 font-mono text-white">{order.id}</td>
                                  <td className="p-4 text-gray-400 text-sm">{order.date}</td>
                                  <td className="p-4 font-bold text-white">₺{order.total.toLocaleString('tr-TR')}</td>
                                  <td className="p-4"><select className="bg-transparent border border-gray-700 rounded px-2 py-1 text-xs font-bold outline-none text-white" value={order.status} onChange={(e) => handleOrderStatusChange(order.id, e.target.value as any)}><option value="Hazırlanıyor">Hazırlanıyor</option><option value="Kargoda">Kargoda</option><option value="Teslim Edildi">Teslim Edildi</option><option value="İptal">İptal</option></select></td>
                                  <td className="p-4 text-right"><button onClick={() => setSelectedOrder(order)} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded"><Eye className="w-4 h-4"/></button></td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
              {selectedOrder && (
                  <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedOrder(null)}>
                      <div className="bg-[#0f0f0f] border border-gray-700 rounded-2xl p-8 w-full max-w-lg" onClick={e => e.stopPropagation()}>
                          <div className="flex justify-between mb-4"><h3 className="text-xl font-bold text-white">Sipariş: {selectedOrder.id}</h3><button onClick={() => setSelectedOrder(null)}><X className="w-5 h-5 text-gray-500"/></button></div>
                          <div className="space-y-2 mb-4 max-h-[300px] overflow-y-auto">{selectedOrder.items.map((item, i) => <div key={i} className="flex gap-3 bg-gray-800/50 p-2 rounded"><img src={item.image} className="w-12 h-12 rounded object-cover"/><div className="text-sm text-white"><div>{item.name}</div><div className="text-gray-400">{item.quantity} x ₺{item.price}</div></div></div>)}</div>
                          <div className="border-t border-gray-800 pt-4 flex justify-between font-bold text-white"><span>Toplam</span><span>₺{selectedOrder.total}</span></div>
                      </div>
                  </div>
              )}
          </div>
      );
  };

  const renderUsers = () => ( <div className="p-10 text-center text-gray-500">Kullanıcı yönetimi aktiftir.</div> );
  const renderCategories = () => ( 
      <div className="space-y-6 animate-in fade-in">
          <div className="flex justify-between items-center"><div><h3 className="text-xl font-bold text-white">Kategoriler</h3></div><Button onClick={() => {setEditingCategory(null); setCategoryForm({}); setIsCategoryModalOpen(true)}}><Plus className="w-5 h-5 mr-2"/> YENİ</Button></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">{categories.map(c => <div key={c.id} className="bg-gray-900 border border-white/10 rounded-xl overflow-hidden group"><div className="h-40 relative"><img src={c.image} className="w-full h-full object-cover"/><div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity gap-2"><button onClick={() => {setEditingCategory(c); setCategoryForm({...c}); setIsCategoryModalOpen(true)}} className="p-2 bg-white rounded-full text-black"><Edit2 className="w-4 h-4"/></button><button onClick={() => handleDeleteCategory(c.id)} className="p-2 bg-white rounded-full text-black hover:text-red-500"><Trash2 className="w-4 h-4"/></button></div></div><div className="p-4"><h4 className="font-bold text-white">{c.name}</h4><p className="text-xs text-gray-500">{c.count}</p></div></div>)}</div>
          {isCategoryModalOpen && <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setIsCategoryModalOpen(false)}><div className="bg-[#0f0f0f] border border-gray-700 rounded-2xl p-8 w-full max-w-md" onClick={e => e.stopPropagation()}><h3 className="text-xl font-bold text-white mb-6">Kategori Düzenle</h3><form onSubmit={handleSaveCategory} className="space-y-4"><input className="w-full bg-gray-900 border border-gray-700 rounded p-3 text-white" placeholder="Ad" value={categoryForm.name} onChange={e => setCategoryForm({...categoryForm, name: e.target.value})} /><input className="w-full bg-gray-900 border border-gray-700 rounded p-3 text-white" placeholder="Görsel URL" value={categoryForm.image} onChange={e => setCategoryForm({...categoryForm, image: e.target.value})} /><div className="relative"><Button type="button" variant="outline" className="w-full"><Upload className="w-4 h-4 mr-2"/> Dosya Yükle <input type="file" className="absolute inset-0 opacity-0" onChange={handleCategoryImageUpload} /></Button></div><Button type="submit" variant="primary" className="w-full">Kaydet</Button></form></div></div>}
      </div> 
  );
  const renderSliderEditor = () => ( 
      <div className="space-y-6 animate-in fade-in">
          <div className="flex justify-between items-center"><div><h3 className="text-xl font-bold text-white">Slider</h3></div><Button onClick={() => {setEditingSlide(null); setSlideForm({}); setIsSlideModalOpen(true)}}><Plus className="w-5 h-5 mr-2"/> YENİ</Button></div>
          <div className="grid grid-cols-1 gap-4">{slides.map(s => <div key={s.id} className="relative aspect-[21/9] bg-gray-900 rounded-xl overflow-hidden group"><img src={s.image} className="w-full h-full object-cover opacity-60"/><div className="absolute bottom-4 left-4"><h3 className="text-xl font-bold text-white">{s.title}</h3></div><div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity gap-2 flex"><button onClick={() => {setEditingSlide(s); setSlideForm({...s}); setIsSlideModalOpen(true)}} className="p-2 bg-white/20 rounded text-white"><Edit2 className="w-4 h-4"/></button><button onClick={() => handleDeleteSlide(s.id)} className="p-2 bg-white/20 rounded text-white hover:bg-red-500"><Trash2 className="w-4 h-4"/></button></div></div>)}</div>
          {isSlideModalOpen && <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setIsSlideModalOpen(false)}><div className="bg-[#0f0f0f] border border-gray-700 rounded-2xl p-8 w-full max-w-md" onClick={e => e.stopPropagation()}><h3 className="text-xl font-bold text-white mb-6">Slider Düzenle</h3><form onSubmit={handleSaveSlide} className="space-y-4"><input className="w-full bg-gray-900 border border-gray-700 rounded p-3 text-white" placeholder="Başlık" value={slideForm.title} onChange={e => setSlideForm({...slideForm, title: e.target.value})} /><input className="w-full bg-gray-900 border border-gray-700 rounded p-3 text-white" placeholder="Alt Başlık" value={slideForm.subtitle} onChange={e => setSlideForm({...slideForm, subtitle: e.target.value})} /><input className="w-full bg-gray-900 border border-gray-700 rounded p-3 text-white" placeholder="Görsel URL" value={slideForm.image} onChange={e => setSlideForm({...slideForm, image: e.target.value})} /><div className="relative"><Button type="button" variant="outline" className="w-full"><Upload className="w-4 h-4 mr-2"/> Dosya Yükle <input type="file" className="absolute inset-0 opacity-0" onChange={handleSliderImageUpload} /></Button></div><div className="flex justify-end pt-4"><Button type="submit" variant="primary">Kaydet</Button></div></form></div></div>}
      </div>
  );
  const renderAnalytics = () => ( <div className="p-10 text-center text-gray-500">Analiz raporları hazırlanıyor...</div> );

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans flex">
       {/* Sidebar */}
       <aside className="w-64 bg-gray-900 border-r border-white/10 fixed h-full z-20 hidden lg:flex flex-col">
           <div className="p-6 border-b border-white/10">
               <div className="flex items-center gap-2 cursor-pointer" onClick={onBackToSite}>
                  <div className="bg-moto-accent p-1.5 rounded-lg"><ShieldAlert className="w-5 h-5 text-white" /></div>
                  <span className="text-xl font-display font-bold text-white">ADMIN<span className="text-moto-accent">PANEL</span></span>
               </div>
           </div>
           <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
               {[
                   { id: 'dashboard', label: 'Genel Bakış', icon: LayoutDashboard },
                   { id: 'analytics', label: 'Analizler', icon: BarChart2 },
                   { id: 'products', label: 'Ürün Yönetimi', icon: Package },
                   { id: 'categories', label: 'Kategori Yönetimi', icon: Grid },
                   { id: 'orders', label: 'Siparişler', icon: ShoppingCart },
                   { id: 'users', label: 'Kullanıcılar', icon: Users },
                   { id: 'slider', label: 'Slider / Vitrin', icon: MonitorPlay },
                   { id: 'analytics', label: 'Analizler', icon: BarChart2 },
               ].map(item => (
                   <button key={item.id} onClick={() => setActiveTab(item.id as AdminTab)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === item.id ? 'bg-moto-accent text-white shadow-lg shadow-moto-accent/20 font-bold' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
                       <item.icon className="w-5 h-5" />{item.label}
                   </button>
               ))}
           </nav>
           <div className="p-4 border-t border-white/10 bg-gray-900">
               <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-900/20 transition-colors"><Trash2 className="w-5 h-5" />Çıkış Yap</button>
           </div>
       </aside>

       {/* Main Content */}
       <main className="flex-1 lg:ml-64 min-h-screen flex flex-col">
           <header className="h-16 bg-gray-900/80 backdrop-blur-md border-b border-white/10 sticky top-0 z-10 flex items-center justify-between px-6 lg:px-8">
               <div className="text-sm text-gray-400">Hoşgeldin, <span className="text-white font-bold">Admin</span></div>
               <div className="flex items-center gap-4"><Button variant="ghost" onClick={onBackToSite} className="text-xs"><Globe className="w-4 h-4 mr-2" /> SİTEYE DÖN</Button></div>
           </header>
           <div className="p-6 lg:p-8 max-w-[1600px] mx-auto w-full pb-20">
               <div className="mb-8"><h1 className="text-3xl font-display font-bold text-white capitalize">{activeTab}</h1></div>
               {activeTab === 'dashboard' && renderDashboard()}
               {activeTab === 'analytics' && renderAnalytics()}
               {activeTab === 'categories' && renderCategories()}
               {activeTab === 'products' && renderProducts()}
               {activeTab === 'orders' && renderOrders()}
               {activeTab === 'users' && renderUsers()}
               {activeTab === 'slider' && renderSliderEditor()}
           </div>
       </main>
    </div>
  );
};
