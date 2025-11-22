import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// --- VERİTABANI BAĞLANTISI ---
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://umithief:14531453@motovibe.mslnxhq.mongodb.net/?appName=motovibe';

// Middleware
app.use(cors({
  origin: '*', 
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Görsel yükleme limiti (Base64)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// --- MONGODB MODELS ---

const userSchema = new mongoose.Schema({
  id: String, // Frontend ID uyumluluğu için
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  isAdmin: { type: Boolean, default: false },
  joinDate: { type: String, default: () => new Date().toLocaleDateString('tr-TR') },
  phone: String,
  address: String
});
const User = mongoose.models.User || mongoose.model('User', userSchema);

const productSchema = new mongoose.Schema({
  id: { type: Number, unique: true }, // Frontend ID uyumluluğu için (ÖNEMLİ)
  name: { type: String, required: true },
  description: String,
  price: { type: Number, required: true },
  category: String,
  image: String,
  images: [String],
  rating: { type: Number, default: 0 },
  features: [String],
  stock: { type: Number, default: 10 }
});
const Product = mongoose.models.Product || mongoose.model('Product', productSchema);

const orderSchema = new mongoose.Schema({
  id: String, 
  userId: { type: String, required: true },
  date: { type: String, default: () => new Date().toLocaleDateString('tr-TR') },
  status: { type: String, default: 'Hazırlanıyor' },
  total: Number,
  items: [{
    productId: Number,
    name: String,
    price: Number,
    quantity: Number,
    image: String
  }]
});
const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);

const slideSchema = new mongoose.Schema({
    id: Number,
    image: { type: String, required: true },
    title: { type: String, required: true },
    subtitle: String,
    cta: { type: String, default: 'İNCELE' },
    action: { type: String, default: 'shop' }
});
const Slide = mongoose.models.Slide || mongoose.model('Slide', slideSchema);

const visitorSchema = new mongoose.Schema({
  date: { type: String, required: true },
  count: { type: Number, default: 0 }
});
const Visitor = mongoose.models.Visitor || mongoose.model('Visitor', visitorSchema);

const analyticsSchema = new mongoose.Schema({
  type: { type: String, required: true },
  userId: String,
  userName: String,
  productId: Number,
  productName: String,
  duration: Number,
  timestamp: { type: Number, default: Date.now },
  date: { type: String, default: () => new Date().toLocaleDateString('tr-TR') }
});
const Analytics = mongoose.models.Analytics || mongoose.model('Analytics', analyticsSchema);

const categorySchema = new mongoose.Schema({
    id: String,
    name: { type: String, required: true },
    type: { type: String, required: true },
    image: { type: String, required: true },
    desc: String,
    count: String,
    className: String
});
const Category = mongoose.models.Category || mongoose.model('Category', categorySchema);

const forumCommentSchema = new mongoose.Schema({
  id: String,
  authorId: String,
  authorName: String,
  content: String,
  date: String,
  likes: { type: Number, default: 0 }
});

const forumTopicSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  authorId: String,
  authorName: String,
  title: String,
  content: String,
  category: String,
  date: String,
  likes: { type: Number, default: 0 },
  views: { type: Number, default: 0 },
  comments: [forumCommentSchema],
  tags: [String]
});
const ForumTopic = mongoose.models.ForumTopic || mongoose.model('ForumTopic', forumTopicSchema);


// --- DATA SEEDING ---
const seedDatabase = async () => {
    try {
        // Seed Categories if empty
        const catCount = await Category.countDocuments();
        if (catCount === 0) {
            console.log('📦 Kategoriler veritabanına ekleniyor...');
            await Category.insertMany([
                { id: 'cat-1', name: 'KASKLAR', type: 'Kask', image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=800&auto=format&fit=crop', desc: 'Maksimum Güvenlik', count: '142 Model', className: 'col-span-2 row-span-2' },
                { id: 'cat-2', name: 'MONTLAR', type: 'Mont', image: 'https://images.unsplash.com/photo-1559582930-bb01987cf4dd?q=80&w=800&auto=format&fit=crop', desc: '4 Mevsim Koruma', count: '85 Model', className: 'col-span-2 row-span-1' },
                { id: 'cat-3', name: 'ELDİVENLER', type: 'Eldiven', image: 'https://images.unsplash.com/photo-1555481771-16417c6f656c?q=80&w=800&auto=format&fit=crop', desc: 'Hassas Kontrol', count: '64 Model', className: 'col-span-1 row-span-1' },
                { id: 'cat-4', name: 'BOTLAR', type: 'Bot', image: 'https://images.unsplash.com/photo-1555813456-96e25216239e?q=80&w=800&auto=format&fit=crop', desc: 'Sağlam Adımlar', count: '32 Model', className: 'col-span-1 row-span-1' },
                { id: 'cat-5', name: 'EKİPMAN', type: 'Koruma', image: 'https://images.unsplash.com/photo-1584556966052-c229e215e03f?q=80&w=800&auto=format&fit=crop', desc: 'Zırh & Koruma', count: '95 Parça', className: 'col-span-1 md:col-span-2 row-span-1' },
                { id: 'cat-6', name: 'İNTERKOM', type: 'İnterkom', image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=800&auto=format&fit=crop', desc: 'İletişim', count: '12 Model', className: 'col-span-1 md:col-span-2 row-span-1' }
            ]);
        }

        // Seed Slides if empty
        const slideCount = await Slide.countDocuments();
        if (slideCount === 0) {
            console.log('📦 Slider görselleri veritabanına ekleniyor...');
            await Slide.insertMany([
                { id: 1, image: "https://images.unsplash.com/photo-1609630875171-b1321377ee65?q=80&w=1920&auto=format&fit=crop", title: "RIDE THE FUTURE", subtitle: "YAPAY ZEKA DESTEKLİ EKİPMAN SEÇİMİ İLE TANIŞIN.", cta: "ALIŞVERİŞE BAŞLA", action: 'shop' },
                { id: 2, image: "https://images.unsplash.com/photo-1558981408-db0ecd8a1ee4?q=80&w=1920&auto=format&fit=crop", title: "CARBON & SPEED", subtitle: "PROFESYONELLER İÇİN GELİŞTİRİLMİŞ KASK KOLEKSİYONU.", cta: "KASKLARI GÖR", action: 'shop' },
                { id: 3, image: "https://images.unsplash.com/photo-1547053265-a0c602077e65?q=80&w=1920&auto=format&fit=crop", title: "OFFROAD SPIRIT", subtitle: "SINIRLARI ZORLAYAN MACERALAR İÇİN HAZIR OL.", cta: "KEŞFET", action: 'shop' }
            ]);
        }

        // Seed Products if empty
        const prodCount = await Product.countDocuments();
        if (prodCount === 0) {
            console.log('📦 Ürünler veritabanına ekleniyor...');
            await Product.insertMany([
                { id: 1, name: "AeroSpeed Carbon Pro Kask", description: "Yüksek hız aerodinamiği için tasarlanmış ultra hafif karbon fiber kask. Maksimum görüş açısı ve gelişmiş havalandırma sistemi.", price: 8500, category: "Kask", image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=800&auto=format&fit=crop", images: ["https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=800&auto=format&fit=crop"], rating: 4.8, features: ["Karbon Fiber", "Pinlock"], stock: 15 },
                { id: 2, name: "Urban Rider Deri Mont", description: "Şehir içi sürüşler için şık ve korumalı deri mont. D3O korumalar ile maksimum güvenlik, vintage görünüm.", price: 5200, category: "Mont", image: "https://images.unsplash.com/photo-1559582930-bb01987cf4dd?q=80&w=800&auto=format&fit=crop", images: ["https://images.unsplash.com/photo-1559582930-bb01987cf4dd?q=80&w=800&auto=format&fit=crop"], rating: 4.6, features: ["%100 Deri", "D3O"], stock: 8 },
                { id: 3, name: "ProVision İnterkom", description: "Grup sürüşleri için kristal netliğinde ses sağlayan, uzun menzilli Bluetooth interkom.", price: 2900, category: "İnterkom", image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=800&auto=format&fit=crop", images: ["https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=800&auto=format&fit=crop"], rating: 4.7, features: ["1.2km Menzil", "Su Geçirmez"], stock: 30 }
            ]);
        }
    } catch (error) {
        console.error('Veri tohumlama hatası:', error);
    }
};

// --- ROUTES ---

// 1. Auth Routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'Bu e-posta zaten kayıtlı.' });
    
    const newUser = new User({ 
        id: crypto.randomUUID(), // GUID
        name, email, password 
    });
    await newUser.save();
    
    const userObj = newUser.toObject();
    delete userObj.password;
    res.status(201).json(userObj);
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email, password });
    
    if (!user) return res.status(400).json({ message: 'Hatalı e-posta veya şifre.' });
    
    const userObj = user.toObject();
    delete userObj.password;
    res.json(userObj);
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
});

// 2. Product Routes
// ÖNEMLİ DÜZELTME: findById... yerine findOne({ id: ... }) kullanıyoruz.
// Çünkü frontend sayısal ID (timestamp) gönderiyor, MongoDB ise _id (ObjectId) kullanıyor.

app.get('/api/products', async (req, res) => { 
    try {
        const p = await Product.find().sort({ _id: -1 }); 
        res.json(p); 
    } catch (e) { res.status(500).json({message: e.message}); }
});

app.post('/api/products', async (req, res) => { 
    try {
        // Yeni ürün eklerken ID'yi timestamp olarak ata (Frontend ile uyum için)
        const productData = { ...req.body, id: req.body.id || Date.now() };
        const p = new Product(productData); 
        await p.save(); 
        res.status(201).json(p); 
    } catch (e) { 
        console.error("Ürün ekleme hatası:", e);
        res.status(500).json({message: "Ürün eklenemedi. Görsel boyutu büyük olabilir."}); 
    }
});

app.put('/api/products/:id', async (req, res) => { 
    try {
        // findOneAndUpdate kullanarak bizim verdiğimiz 'id' alanına göre güncelle
        const p = await Product.findOneAndUpdate({ id: req.params.id }, req.body, { new: true }); 
        if (!p) return res.status(404).json({ message: 'Ürün bulunamadı' });
        res.json(p); 
    } catch (e) { res.status(500).json({message: e.message}); }
});

app.delete('/api/products/:id', async (req, res) => { 
    try {
        // findOneAndDelete kullanarak bizim verdiğimiz 'id' alanına göre sil
        await Product.findOneAndDelete({ id: req.params.id }); 
        res.json({ message: 'Deleted' }); 
    } catch (e) { res.status(500).json({message: e.message}); }
});

// 3. Order Routes
app.get('/api/orders', async (req, res) => { 
    try {
        const { userId } = req.query; 
        const q = userId ? { userId } : {};
        const o = await Order.find(q).sort({ date: -1 }); 
        res.json(o); 
    } catch (e) { res.status(500).json({message: e.message}); }
});
app.post('/api/orders', async (req, res) => { 
    try {
        const o = new Order(req.body); await o.save(); res.status(201).json(o); 
    } catch (e) { res.status(500).json({message: e.message}); }
});
app.put('/api/orders/:id', async (req, res) => { 
    try {
        // Sipariş ID'si string olduğu için (MV-2024-...) string olarak ara
        const o = await Order.findOneAndUpdate({ id: req.params.id }, req.body, { new: true }); 
        res.json(o); 
    } catch (e) { res.status(500).json({message: e.message}); }
});

// 4. Slide Routes
app.get('/api/slides', async (req, res) => { 
    try {
        const s = await Slide.find(); res.json(s); 
    } catch (e) { res.status(500).json({message: e.message}); }
});
app.post('/api/slides', async (req, res) => { 
    try {
        const slideData = { ...req.body, id: req.body.id || Date.now() };
        const s = new Slide(slideData); await s.save(); res.status(201).json(s); 
    } catch (e) { res.status(500).json({message: e.message}); }
});
app.put('/api/slides/:id', async (req, res) => { 
    try {
        const s = await Slide.findOneAndUpdate({ id: req.params.id }, req.body, { new: true }); res.json(s); 
    } catch (e) { res.status(500).json({message: e.message}); }
});
app.delete('/api/slides/:id', async (req, res) => { 
    try {
        await Slide.findOneAndDelete({ id: req.params.id }); res.json({message:'Deleted'}); 
    } catch (e) { res.status(500).json({message: e.message}); }
});

// 5. Stats & Analytics (Standart)
app.get('/api/stats', async (req, res) => { 
    try {
        const all = await Visitor.find(); 
        const total = all.reduce((s,v)=>s+v.count,0); 
        res.json({totalVisits: total, todayVisits: 0}); 
    } catch (e) { res.status(500).json({message: e.message}); }
});
app.post('/api/stats/visit', async (req, res) => {
    try {
        const today = new Date().toLocaleDateString('tr-TR');
        let v = await Visitor.findOne({date: today});
        if(v) v.count++; else v = new Visitor({date: today, count: 1});
        await v.save();
        res.json({success: true});
    } catch (e) { res.status(500).json({message: e.message}); }
});
app.get('/api/analytics/dashboard', async (req, res) => { res.json({totalProductViews:0, totalAddToCart:0, totalCheckouts:0, avgSessionDuration:0, topViewedProducts:[], topAddedProducts:[], activityTimeline:[]}); });
app.post('/api/analytics/event', async (req, res) => { try { const e = new Analytics(req.body); await e.save(); res.json({success:true}); } catch (e) { res.status(500).json({message: e.message}); } });

// 7. Category Routes
app.get('/api/categories', async (req, res) => { 
    try {
        const c = await Category.find(); res.json(c); 
    } catch (e) { res.status(500).json({message: e.message}); }
});
app.post('/api/categories', async (req, res) => { 
    try {
        const catData = { ...req.body, id: req.body.id || `cat-${Date.now()}` };
        const c = new Category(catData); await c.save(); res.status(201).json(c); 
    } catch (e) { res.status(500).json({message: e.message}); }
});
app.put('/api/categories/:id', async (req, res) => { 
    try {
        const c = await Category.findOneAndUpdate({ id: req.params.id }, req.body, { new: true }); res.json(c); 
    } catch (e) { res.status(500).json({message: e.message}); }
});
app.delete('/api/categories/:id', async (req, res) => { 
    try {
        await Category.findOneAndDelete({ id: req.params.id }); res.json({message:'Deleted'}); 
    } catch (e) { res.status(500).json({message: e.message}); }
});

// 8. Forum Routes
app.get('/api/forum/topics', async (req, res) => {
    try {
        const topics = await ForumTopic.find().sort({ _id: -1 });
        res.json(topics);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});
app.post('/api/forum/topics', async (req, res) => {
    try {
        const newTopic = new ForumTopic(req.body);
        await newTopic.save();
        res.status(201).json(newTopic);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});
app.post('/api/forum/topics/:id/comments', async (req, res) => {
    try {
        const topic = await ForumTopic.findOne({ id: req.params.id });
        if (!topic) return res.status(404).json({ message: 'Konu bulunamadı' });
        topic.comments.push(req.body);
        await topic.save();
        res.status(201).json(req.body);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});
app.post('/api/forum/topics/:id/like', async (req, res) => {
    try {
        const topic = await ForumTopic.findOne({ id: req.params.id });
        if (topic) {
            topic.likes += 1;
            await topic.save();
            res.json({ likes: topic.likes });
        } else {
            res.status(404).json({ message: 'Konu bulunamadı' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// --- START SERVER ---
mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('✅ MongoDB bağlantısı başarılı');
    await seedDatabase();
    app.listen(PORT, () => console.log(`🚀 Server çalışıyor: http://localhost:${PORT}`));
  })
  .catch(err => {
    console.error('❌ MongoDB bağlantı hatası:', err.message);
  });
