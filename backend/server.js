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

// --- MONGODB MODELS (HEPSİ DÜZELTİLDİ) ---
// Artık hiçbirinde manuel 'id' alanı yok. Hepsi '_id' kullanacak.

const userSchema = new mongoose.Schema({
  // id alanı silindi.
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
  productId: String,
  productName: String,
  duration: Number,
  timestamp: { type: Number, default: Date.now },
  date: { type: String, default: () => new Date().toLocaleDateString('tr-TR') }
});
const Analytics = mongoose.models.Analytics || mongoose.model('Analytics', analyticsSchema);

const categorySchema = new mongoose.Schema({
    name: { type: String, required: true },
    type: { type: String, default: 'Genel' },
    image: { type: String, required: true },
    desc: String,
    count: String,
    className: String
});
const Category = mongoose.models.Category || mongoose.model('Category', categorySchema);

const forumTopicSchema = new mongoose.Schema({
  authorId: String,
  authorName: String,
  title: String,
  content: String,
  category: String,
  date: String,
  likes: { type: Number, default: 0 },
  comments: [{
      authorId: String,
      authorName: String,
      content: String,
      date: String
  }]
});
const ForumTopic = mongoose.models.ForumTopic || mongoose.model('ForumTopic', forumTopicSchema);


// --- DATA SEEDING (OTOMATİK VERİ EKLEME - DÜZELTİLDİ) ---
const seedDatabase = async () => {
    try {
        // Admin User
        const adminCount = await User.countDocuments({ isAdmin: true });
        if (adminCount === 0) {
            console.log('🔒 Varsayılan Admin oluşturuluyor...');
            await User.create({
                name: 'MotoVibe Admin',
                email: 'admin@motovibe.tr',
                password: 'admin123', 
                isAdmin: true
            });
        }
    } catch (error) {
        console.error('Veri tohumlama hatası:', error);
    }
};

// --- ROUTES (YOLLAR - HEPSİ findById OLARAK GÜNCELLENDİ) ---

// 1. Auth Routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'Bu e-posta zaten kayıtlı.' });

    // id: uuid() KISMINI SİLDİK. Mongo halledecek.
    const newUser = new User({ name, email, password });
    await newUser.save();
    res.status(201).json(newUser);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email, password });
    if (!user) return res.status(401).json({ message: 'Hatalı giriş.' });
    res.json(user);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// 2. Product Routes
app.get('/api/products', async (req, res) => { 
    try { const p = await Product.find().sort({ _id: -1 }); res.json(p); } catch (e) { res.status(500).json({ message: e.message }); }
});
app.post('/api/products', async (req, res) => { 
    try { const p = new Product(req.body); await p.save(); res.status(201).json(p); } catch (e) { res.status(500).json({ message: e.message }); }
});
app.put('/api/products/:id', async (req, res) => { 
    try { const p = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true }); res.json(p); } catch (e) { res.status(500).json({ message: e.message }); }
});
app.delete('/api/products/:id', async (req, res) => { 
    try { await Product.findByIdAndDelete(req.params.id); res.json({ message: 'Silindi' }); } catch (e) { res.status(500).json({ message: e.message }); }
});

// 3. Order Routes
app.get('/api/orders', async (req, res) => { 
    try { const q = req.query.userId ? { userId: req.query.userId } : {}; const o = await Order.find(q).sort({ date: -1 }); res.json(o); } catch (e) { res.status(500).json({ message: e.message }); }
});
app.post('/api/orders', async (req, res) => { 
    try { const o = new Order(req.body); await o.save(); res.status(201).json(o); } catch (e) { res.status(500).json({ message: e.message }); }
});
app.put('/api/orders/:id', async (req, res) => { 
    try { const o = await Order.findByIdAndUpdate(req.params.id, req.body, { new: true }); res.json(o); } catch (e) { res.status(500).json({ message: e.message }); }
});

// 4. Slide Routes
app.get('/api/slides', async (req, res) => { 
    try { const s = await Slide.find(); res.json(s); } catch (e) { res.status(500).json({ message: e.message }); }
});
app.post('/api/slides', async (req, res) => { 
    try { const s = new Slide(req.body); await s.save(); res.status(201).json(s); } catch (e) { res.status(500).json({ message: e.message }); }
});
app.delete('/api/slides/:id', async (req, res) => { 
    try { await Slide.findByIdAndDelete(req.params.id); res.json({ message: 'Deleted' }); } catch (e) { res.status(500).json({ message: e.message }); }
});

// 5. Stats
app.get('/api/stats', async (req, res) => { 
    try { const all = await Visitor.find(); const total = all.reduce((s,v)=>s+v.count,0); res.json({totalVisits: total, todayVisits: 0}); } catch (e) { res.status(500).json({ message: e.message }); }
});
app.post('/api/stats/visit', async (req, res) => {
    try { const d = new Date().toLocaleDateString('tr-TR'); let v = await Visitor.findOne({date: d}); if(v) v.count++; else v = new Visitor({date: d, count: 1}); await v.save(); res.json({success: true}); } catch (e) { res.status(500).json({ message: e.message }); }
});

// 6. Category Routes
app.get('/api/categories', async (req, res) => { 
    try { const c = await Category.find(); res.json(c); } catch (e) { res.status(500).json({ message: e.message }); }
});
app.post('/api/categories', async (req, res) => { 
    try { const c = new Category(req.body); await c.save(); res.status(201).json(c); } catch (e) { res.status(500).json({ message: e.message }); }
});
app.delete('/api/categories/:id', async (req, res) => { 
    try { await Category.findByIdAndDelete(req.params.id); res.json({ message: 'Deleted' }); } catch (e) { res.status(500).json({ message: e.message }); }
});

// 7. Forum Routes
app.get('/api/forum/topics', async (req, res) => { try { const topics = await ForumTopic.find().sort({ _id: -1 }); res.json(topics); } catch (e) { res.status(500).json({ message: e.message }); } });
app.post('/api/forum/topics', async (req, res) => { try { const newTopic = new ForumTopic(req.body); await newTopic.save(); res.status(201).json(newTopic); } catch (e) { res.status(500).json({ message: e.message }); } });
app.post('/api/forum/topics/:id/comments', async (req, res) => {
    try {
        const topic = await ForumTopic.findById(req.params.id); // DÜZELDİ
        if (!topic) return res.status(404).json({ message: 'Konu bulunamadı' });
        topic.comments.push(req.body);
        await topic.save();
        res.status(201).json(req.body);
    } catch (e) { res.status(500).json({ message: e.message }); }
});
app.post('/api/forum/topics/:id/like', async (req, res) => {
    try {
        const topic = await ForumTopic.findById(req.params.id); // DÜZELDİ
        if (topic) { topic.likes += 1; await topic.save(); res.json({ likes: topic.likes }); } 
        else { res.status(404).json({ message: 'Konu bulunamadı' }); }
    } catch (e) { res.status(500).json({ message: e.message }); }
});

// --- START SERVER ---
mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('✅ MongoDB Connected');
    await seedDatabase();
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch(err => console.error('❌ DB Connection Error:', err));
