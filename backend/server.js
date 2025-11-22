import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// --- VERİTABANI BAĞLANTISI ---
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://umithief:14531453@motovibe.mslnxhq.mongodb.net/?appName=motovibe';

if (MONGO_URI.includes('14531453')) {
  console.warn('⚠️ UYARI: MongoDB bağlantı adresindeki <password> alanını değiştirmediniz.');
}

// Middleware
app.use(cors({
  origin: '*', 
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// --- MONGODB MODELS ---

const userSchema = new mongoose.Schema({
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
  userId: { type: String, required: true },
  date: { type: String, default: () => new Date().toLocaleDateString('tr-TR') },
  status: { type: String, default: 'Hazırlanıyor' },
  total: Number,
  items: [{
    productId: String,
    name: String,
    price: Number,
    quantity: Number,
    image: String
  }]
});
const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);

const slideSchema = new mongoose.Schema({
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
        // 0. Seed Admin User if not exists
        const adminCount = await User.countDocuments({ isAdmin: true });
        if (adminCount === 0) {
            console.log('🔒 Varsayılan Admin hesabı oluşturuluyor...');
            const adminUser = new User({
                name: 'MotoVibe Admin',
                email: 'admin@motovibe.tr',
                password: 'admin123', // Gerçek projede hashlenmeli
                isAdmin: true,
                joinDate: new Date().toLocaleDateString('tr-TR')
            });
            await adminUser.save();
        }

        const catCount = await Category.countDocuments();
        if (catCount === 0) {
            console.log('📦 Kategoriler veritabanına ekleniyor...');
            await Category.insertMany([
                { name: 'KASKLAR', type: 'Kask', image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=800&auto=format&fit=crop', desc: 'Maksimum Güvenlik', count: '142 Model', className: 'col-span-2 row-span-2' },
                { name: 'MONTLAR', type: 'Mont', image: 'https://images.unsplash.com/photo-1559582930-bb01987cf4dd?q=80&w=800&auto=format&fit=crop', desc: '4 Mevsim Koruma', count: '85 Model', className: 'col-span-2 row-span-1' },
                { name: 'ELDİVENLER', type: 'Eldiven', image: 'https://images.unsplash.com/photo-1555481771-16417c6f656c?q=80&w=800&auto=format&fit=crop', desc: 'Hassas Kontrol', count: '64 Model', className: 'col-span-1 row-span-1' },
                { name: 'BOTLAR', type: 'Bot', image: 'https://images.unsplash.com/photo-1555813456-96e25216239e?q=80&w=800&auto=format&fit=crop', desc: 'Sağlam Adımlar', count: '32 Model', className: 'col-span-1 row-span-1' },
                { name: 'EKİPMAN', type: 'Koruma', image: 'https://images.unsplash.com/photo-1584556966052-c229e215e03f?q=80&w=800&auto=format&fit=crop', desc: 'Zırh & Koruma', count: '95 Parça', className: 'col-span-1 md:col-span-2 row-span-1' },
                { name: 'İNTERKOM', type: 'İnterkom', image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=800&auto=format&fit=crop', desc: 'İletişim', count: '12 Model', className: 'col-span-1 md:col-span-2 row-span-1' }
            ]);
        }

        const slideCount = await Slide.countDocuments();
        if (slideCount === 0) {
            console.log('📦 Slider görselleri veritabanına ekleniyor...');
            await Slide.insertMany([
                { image: "https://images.unsplash.com/photo-1609630875171-b1321377ee65?q=80&w=1920&auto=format&fit=crop", title: "RIDE THE FUTURE", subtitle: "YAPAY ZEKA DESTEKLİ EKİPMAN SEÇİMİ İLE TANIŞIN.", cta: "ALIŞVERİŞE BAŞLA", action: 'shop' },
                { image: "https://images.unsplash.com/photo-1558981408-db0ecd8a1ee4?q=80&w=1920&auto=format&fit=crop", title: "CARBON & SPEED", subtitle: "PROFESYONELLER İÇİN GELİŞTİRİLMİŞ KASK KOLEKSİYONU.", cta: "KASKLARI GÖR", action: 'shop' },
                { image: "https://images.unsplash.com/photo-1547053265-a0c602077e65?q=80&w=1920&auto=format&fit=crop", title: "OFFROAD SPIRIT", subtitle: "SINIRLARI ZORLAYAN MACERALAR İÇİN HAZIR OL.", cta: "KEŞFET", action: 'shop' }
            ]);
        }

        const prodCount = await Product.countDocuments();
        if (prodCount === 0) {
            console.log('📦 Ürünler veritabanına ekleniyor...');
            await Product.insertMany([
                { name: "AeroSpeed Carbon Pro Kask", description: "Yüksek hız aerodinamiği için tasarlanmış ultra hafif karbon fiber kask. Maksimum görüş açısı ve gelişmiş havalandırma sistemi.", price: 8500, category: "Kask", image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=800&auto=format&fit=crop", images: ["https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=800&auto=format&fit=crop"], rating: 4.8, features: ["Karbon Fiber", "Pinlock"], stock: 15 },
                { name: "Urban Rider Deri Mont", description: "Şehir içi sürüşler için şık ve korumalı deri mont. D3O korumalar ile maksimum güvenlik, vintage görünüm.", price: 5200, category: "Mont", image: "https://images.unsplash.com/photo-1559582930-bb01987cf4dd?q=80&w=800&auto=format&fit=crop", images: ["https://images.unsplash.com/photo-1559582930-bb01987cf4dd?q=80&w=800&auto=format&fit=crop"], rating: 4.6, features: ["%100 Deri", "D3O"], stock: 8 },
                { name: "ProVision İnterkom", description: "Grup sürüşleri için kristal netliğinde ses sağlayan, uzun menzilli Bluetooth interkom.", price: 2900, category: "İnterkom", image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=800&auto=format&fit=crop", images: ["https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=800&auto=format&fit=crop"], rating: 4.7, features: ["1.2km Menzil", "Su Geçirmez"], stock: 30 }
            ]);
        }

        const forumCount = await ForumTopic.countDocuments();
        if (forumCount === 0) {
            console.log('📦 Forum konuları veritabanına ekleniyor...');
            await ForumTopic.insertMany([
                {
                    id: 'TOPIC-INIT-1',
                    authorId: 'admin-001',
                    authorName: 'MotoVibe Admin',
                    title: 'MotoVibe Topluluğuna Hoş Geldiniz!',
                    content: 'Merhaba arkadaşlar, burası motosiklet tutkunlarının buluşma noktası. Deneyimlerinizi paylaşabilir, teknik sorular sorabilir veya gezi planlarınızı duyurabilirsiniz. Saygı çerçevesinde keyifli forumlar!',
                    category: 'Genel',
                    date: new Date().toLocaleDateString('tr-TR'),
                    likes: 42,
                    views: 1250,
                    comments: [],
                    tags: ['Duyuru', 'Kurallar']
                }
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
    const newUser = new User({ name, email, password });
    await newUser.save();
    const userObj = newUser.toObject();
    delete userObj.password;
    res.status(201).json(userObj);
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
});

// ADMIN LOGIN (ONLY DB CHECK - NO BACKDOOR)
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Sadece veritabanını kontrol et
    const user = await User.findOne({ email, password });
    
    if (!user) {
        return res.status(400).json({ message: 'Hatalı e-posta veya şifre.' });
    }
    
    const userObj = user.toObject();
    delete userObj.password;
    res.json(userObj);
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
});

// 2. Product Routes
app.get('/api/products', async (req, res) => { 
    try {
        const p = await Product.find().sort({ _id: -1 }); 
        res.json(p); 
    } catch (e) { res.status(500).json({message: e.message}); }
});
app.post('/api/products', async (req, res) => { 
    try {
        const p = new Product(req.body); await p.save(); res.status(201).json(p); 
    } catch (e) { res.status(500).json({message: e.message}); }
});
app.put('/api/products/:id', async (req, res) => { 
    try {
        const p = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true }); res.json(p); 
    } catch (e) { res.status(500).json({message: e.message}); }
});
app.delete('/api/products/:id', async (req, res) => { 
    try {
        await Product.findByIdAndDelete(req.params.id); res.json({ message: 'Deleted' }); 
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
        const o = await Order.findByIdAndUpdate(req.params.id, req.body, { new: true }); res.json(o); 
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
        const s = new Slide(req.body); await s.save(); res.status(201).json(s); 
    } catch (e) { res.status(500).json({message: e.message}); }
});
app.put('/api/slides/:id', async (req, res) => { 
    try {
        const s = await Slide.findByIdAndUpdate(req.params.id, req.body, { new: true }); res.json(s); 
    } catch (e) { res.status(500).json({message: e.message}); }
});
app.delete('/api/slides/:id', async (req, res) => { 
    try {
        await Slide.findByIdAndDelete(req.params.id); res.json({message:'Deleted'}); 
    } catch (e) { res.status(500).json({message: e.message}); }
});

// 5. Stats Routes
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

// 6. Analytics Routes
app.get('/api/analytics/dashboard', async (req, res) => { 
    try {
        const { range } = req.query;
        const now = Date.now();
        let startTime = 0;
        if (range === '24h') startTime = now - (24 * 60 * 60 * 1000);
        else if (range === '7d') startTime = now - (7 * 24 * 60 * 60 * 1000);
        else if (range === '30d') startTime = now - (30 * 24 * 60 * 60 * 1000);
        
        const events = await Analytics.find({ timestamp: { $gte: startTime } });
        
        // Aggregation Logic
        const productViews = {};
        const productAdds = {};
        let totalProductViews = 0;
        let totalAddToCart = 0;
        let totalCheckouts = 0;
        let totalDuration = 0;
        let durationCount = 0;

        let activityTimeline = [];
        if (range === '24h') {
            const currentHour = new Date().getHours();
            activityTimeline = Array.from({length: 12}, (_, i) => {
                const h = (currentHour - 11 + i + 24) % 24;
                return { label: `${h}:00`, value: 0 };
            });
            events.forEach(e => {
                const h = new Date(e.timestamp).getHours();
                const label = `${h}:00`;
                const bucket = activityTimeline.find(b => b.label === label);
                if(bucket) bucket.value++;
            });
        } else {
             const daysCount = range === '7d' ? 7 : 30;
             for (let i = daysCount - 1; i >= 0; i--) {
                 const d = new Date(now - (i * 24 * 60 * 60 * 1000));
                 const label = d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
                 activityTimeline.push({ label, value: 0 });
             }
             events.forEach(e => {
                 const d = new Date(e.timestamp);
                 const label = d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
                 const bucket = activityTimeline.find(b => b.label === label);
                 if(bucket) bucket.value++;
             });
        }

        events.forEach(e => {
            if (e.type === 'view_product') {
                totalProductViews++;
                if (e.productName) productViews[e.productName] = (productViews[e.productName] || 0) + 1;
            } else if (e.type === 'add_to_cart') {
                totalAddToCart++;
                if (e.productName) productAdds[e.productName] = (productAdds[e.productName] || 0) + 1;
            } else if (e.type === 'checkout_start') {
                totalCheckouts++;
            } else if (e.type === 'session_duration' && e.duration) {
                totalDuration += e.duration;
                durationCount++;
            }
        });

        const topViewedProducts = Object.entries(productViews).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 5);
        const topAddedProducts = Object.entries(productAdds).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 5);
        const avgSessionDuration = durationCount > 0 ? Math.round(totalDuration / durationCount) : 0;

        res.json({
            totalProductViews, totalAddToCart, totalCheckouts, avgSessionDuration, topViewedProducts, topAddedProducts, activityTimeline
        });
    } catch (e) { res.status(500).json({message: e.message}); }
});
app.post('/api/analytics/event', async (req, res) => { 
    try {
        const e = new Analytics(req.body); await e.save(); res.json({success:true}); 
    } catch (e) { res.status(500).json({message: e.message}); }
});

// 7. Category Routes
app.get('/api/categories', async (req, res) => { 
    try {
        const c = await Category.find(); res.json(c); 
    } catch (e) { res.status(500).json({message: e.message}); }
});
app.post('/api/categories', async (req, res) => { 
    try {
        const c = new Category(req.body); await c.save(); res.status(201).json(c); 
    } catch (e) { res.status(500).json({message: e.message}); }
});
app.put('/api/categories/:id', async (req, res) => { 
    try {
        const c = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true }); res.json(c); 
    } catch (e) { res.status(500).json({message: e.message}); }
});
app.delete('/api/categories/:id', async (req, res) => { 
    try {
        await Category.findByIdAndDelete(req.params.id); res.json({message:'Deleted'}); 
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
