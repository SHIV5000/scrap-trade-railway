const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/scraptrade';

mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('✅ Connected to MongoDB'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// Post Schema
const postSchema = new mongoose.Schema({
    type: String,
    category: String,
    details: String,
    rate: Number,
    unit: String,
    city: String,
    userName: String,
    views: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
});

const Post = mongoose.model('Post', postSchema);

// API Routes
app.get('/api/posts', async (req, res) => {
    try {
        const { type, category, city } = req.query;
        let filter = {};
        
        if (type) filter.type = type;
        if (category) filter.category = category;
        if (city) filter.city = new RegExp(city, 'i');
        
        const posts = await Post.find(filter).sort({ createdAt: -1 });
        res.json(posts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/posts', async (req, res) => {
    try {
        const post = new Post(req.body);
        await post.save();
        res.status(201).json(post);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.patch('/api/posts/:id/view', async (req, res) => {
    try {
        await Post.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.patch('/api/posts/:id/contact', async (req, res) => {
    try {
        const post = await Post.findByIdAndUpdate(
            req.params.id,
            { $inc: { clicks: 1 } },
            { new: true }
        );
        
        res.json({
            contactEmail: 'contact@scraptrade.com',
            message: 'In real implementation: Actual contact details after Gmail login'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Serve frontend for all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📧 MongoDB URI: ${MONGODB_URI ? 'Set' : 'Not set'}`);
});