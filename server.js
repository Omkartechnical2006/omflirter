require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017/sayari-app';

// MongoDB Connection
mongoose.connect(MONGODB_URL)
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch(err => console.error('❌ MongoDB connection error:', err));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// View Engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Import Item Model
const Item = require('./models/Item');

// Routes
// Home Page
app.get('/', async (req, res) => {
    try {
        const items = await Item.find().sort({ createdAt: -1 });
        res.render('index', { items });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all items by category
app.get('/api/items/:category', async (req, res) => {
    try {
        const items = await Item.find({ category: req.params.category }).sort({ createdAt: -1 });
        res.json(items);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all items
app.get('/api/items', async (req, res) => {
    try {
        const items = await Item.find().sort({ createdAt: -1 });
        res.json(items);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create new item
app.post('/api/items', async (req, res) => {
    try {
        const newItem = new Item({
            content: req.body.content,
            category: req.body.category
        });
        const savedItem = await newItem.save();
        res.json(savedItem);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Update item
app.put('/api/items/:id', async (req, res) => {
    // Check Password
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    const userPassword = req.headers['x-admin-password'];

    if (userPassword !== adminPassword) {
        return res.status(401).json({ error: 'Incorrect password' });
    }

    try {
        const updatedItem = await Item.findByIdAndUpdate(
            req.params.id,
            { content: req.body.content },
            { new: true }
        );
        res.json(updatedItem);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Delete item
app.delete('/api/items/:id', async (req, res) => {
    // Check Password
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    const userPassword = req.headers['x-admin-password'];

    if (userPassword !== adminPassword) {
        return res.status(401).json({ error: 'Incorrect password' });
    }

    try {
        await Item.findByIdAndDelete(req.params.id);
        res.json({ message: 'Item deleted successfully' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Export items to text file
app.get('/api/export/:category', async (req, res) => {
    try {
        const items = await Item.find({ category: req.params.category }).sort({ createdAt: -1 });

        // Create text content
        let textContent = `Om The Flirter - ${req.params.category.charAt(0).toUpperCase() + req.params.category.slice(1)}\n`;
        textContent += `Export Date: ${new Date().toLocaleString()}\n`;
        textContent += `Total Items: ${items.length}\n`;
        textContent += `${'='.repeat(50)}\n\n`;

        items.forEach((item, index) => {
            textContent += `${index + 1}. ${item.content}\n\n`;
        });

        // Set headers for file download
        res.setHeader('Content-Type', 'text/plain');
        res.setHeader('Content-Disposition', `attachment; filename="${req.params.category}-${Date.now()}.txt"`);
        res.send(textContent);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
