import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// --- VERİTABANI BAĞLANTISI ---
// BURAYA KENDİ MONGODB URI'NIZI YAZIN
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://umithief:14531453@motovibe.mslnxhq.mongodb.net/?appName=motovibe';

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// --- SCHEMAS & MODELS ---

// Product Schema (Düzeltilmiş Hali)
const productSchema = new mongoose.Schema({
    name: String,
    description: String,
    price: Number,
    category: String,
    image: String,
    images: [String],
    rating: Number,
    features: [String],
    stock: Number
});
const Product = mongoose.models.Product || mongoose.model('Product', productSchema);

const userSchema = new mongoose.Schema({
  id: String,
  name: String,
  email: { type: String, unique: true },
  password: String,
  isAdmin: Boolean,
  joinDate: String
});
const User = mongoose.models.User || mongoose.model('User', userSchema);

const orderSchema = new mongoose.Schema({
  id: String,
  userId: String,
  date: String,
  status: String,
  total: Number,
  items: Array
});
const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);

const slideSchema = new mongoose.Schema({
  id: Number,
  image: String,
  title: String,
  subtitle: String,
  cta: String,
  action: String
});
const Slide = mongoose.models.Slide || mongoose.model('Slide', slideSchema);

const categorySchema = new mongoose.Schema({
  id: String,
  name: String,
  type: String,
  image: String,
  desc: String,
  count: String,
  className: String
});
const Category = mongoose.models.Category || mongoose.model('Category', categorySchema);

// --- ROUTES ---

// 1. PRODUCTS
app.get('/api/products', async (req, res) => {
    try {
        const products = await Product.find().sort({ _id: -1 });
        res.json(products);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/products', async (req, res) => {
    try {
        // Frontend ID göndermezse veya null gelirse timestamp kullan
        const finalId = req.body.id ? Number(req.body.id) : Date.now();
        const newProduct = new Product({ ...req.body, id: finalId });
        await newProduct.save();
        res.status(201).json(newProduct);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/products/:id', async (req, res) => {
    try {
        // Frontend'den gelen ID (URL'deki) String'dir, Number'a çevirip arıyoruz
        const pId = Number(req.params.id);
        const updated = await Product.findOneAndUpdate({ id: pId }, req.body, { new: true });
        if (!updated) return res.status(404).json({ error: "Ürün bulunamadı" });
        res.json(updated);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/products/:id', async (req, res) => {
    try {
        const pId = Number(req.params.id);
        await Product.findOneAndDelete({ id: pId });
        res.json({ message: "Deleted" });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// 2. CATEGORIES
app.get('/api/categories', async (req, res) => {
    try {
        const cats = await Category.find();
        res.json(cats);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/categories', async (req, res) => {
    try {
        const cat = new Category(req.body);
        await cat.save();
        res.status(201).json(cat);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/categories/:id', async (req, res) => {
    try {
        const updated = await Category.findOneAndUpdate({ id: req.params.id }, req.body, { new: true });
        res.json(updated);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/categories/:id', async (req, res) => {
    try {
        await Category.findOneAndDelete({ id: req.params.id });
        res.json({ message: "Deleted" });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// 3. AUTH
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email, password });
        if (!user) return res.status(401).json({ message: "Hatalı giriş" });
        res.json(user);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/auth/register', async (req, res) => {
    try {
        const existing = await User.findOne({ email: req.body.email });
        if (existing) return res.status(400).json({ message: "Kullanıcı mevcut" });
        
        const newUser = new User({ ...req.body, id: crypto.randomUUID() });
        await newUser.save();
        res.status(201).json(newUser);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// 4. SLIDES
app.get('/api/slides', async (req, res) => {
    try {
        const slides = await Slide.find();
        res.json(slides);
    } catch (e) { res.status(500).json({ error: e.message }); }
});
app.post('/api/slides', async (req, res) => {
    try {
        const s = new Slide({ ...req.body, id: req.body.id || Date.now() });
        await s.save();
        res.status(201).json(s);
    } catch (e) { res.status(500).json({ error: e.message }); }
});
app.put('/api/slides/:id', async (req, res) => {
    try {
        const sId = Number(req.params.id);
        const updated = await Slide.findOneAndUpdate({ id: sId }, req.body, { new: true });
        res.json(updated);
    } catch (e) { res.status(500).json({ error: e.message }); }
});
app.delete('/api/slides/:id', async (req, res) => {
    try {
        const sId = Number(req.params.id);
        await Slide.findOneAndDelete({ id: sId });
        res.json({ message: "Deleted" });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// 5. ORDERS
app.get('/api/orders', async (req, res) => {
    try {
        const query = req.query.userId ? { userId: req.query.userId } : {};
        const orders = await Order.find(query).sort({ date: -1 });
        res.json(orders);
    } catch (e) { res.status(500).json({ error: e.message }); }
});
app.post('/api/orders', async (req, res) => {
    try {
        const o = new Order(req.body);
        await o.save();
        res.status(201).json(o);
    } catch (e) { res.status(500).json({ error: e.message }); }
});
app.put('/api/orders/:id', async (req, res) => {
    try {
        const updated = await Order.findOneAndUpdate({ id: req.params.id }, req.body, { new: true });
        res.json(updated);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// 6. STATS & ANALYTICS (Dummy Endpoints for now to prevent 404)
app.get('/api/stats', (req, res) => res.json({ totalVisits: 100, todayVisits: 10 }));
app.post('/api/stats/visit', (req, res) => res.json({ success: true }));
app.get('/api/analytics/dashboard', (req, res) => res.json({
    totalProductViews: 0, totalAddToCart: 0, totalCheckouts: 0, 
    avgSessionDuration: 0, topViewedProducts: [], topAddedProducts: [], activityTimeline: []
}));

// --- CONNECT ---
mongoose.connect(MONGO_URI)
    .then(() => {
        console.log("✅ MongoDB Connected");
        app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
    })
    .catch(err => console.error("❌ DB Connection Error:", err));
