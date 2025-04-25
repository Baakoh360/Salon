const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
require('dotenv').config();

// Import route files
const bookingRoutes = require('./routes/booking.routes');

// Initialize express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure Cloudinary storage for multer
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'product-images',
        allowed_formats: ['jpeg', 'jpg', 'png', 'gif']
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: function(req, file, cb) {
        const filetypes = /jpeg|jpg|png|gif/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'));
        }
    }
});

// Connect to MongoDB Atlas
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
    console.error('MONGODB_URI is not defined in .env file');
    process.exit(1);
}

mongoose.connect(MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    })
    .then(() => console.log('MongoDB Atlas connected'))
    .catch(err => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    });

// Mount routes
app.use('/api/bookings', bookingRoutes);

// Keep product routes in this file for now, can be extracted later
const Product = require('./models/Product');

// API Routes for Products
// Get all products
app.get('/api/products', async(req, res) => {
    try {
        const products = await Product.find().sort({ createdAt: -1 });
        res.json(products);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ message: 'Failed to fetch products' });
    }
});

// Get products by category
app.get('/api/products/category/:category', async(req, res) => {
    try {
        const { category } = req.params;
        const products = await Product.find({ category }).sort({ createdAt: -1 });
        res.json(products);
    } catch (error) {
        console.error(`Error fetching products in category ${req.params.category}:`, error);
        res.status(500).json({ message: 'Failed to fetch products by category' });
    }
});

// Get a single product by ID
app.get('/api/products/:id', async(req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.json(product);
    } catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).json({ message: 'Failed to fetch product' });
    }
});

// Create a new product
app.post('/api/products', upload.single('image'), async(req, res) => {
    try {
        const { name, description, price, category, stock } = req.body;

        const newProduct = new Product({
            name,
            description,
            price,
            category,
            stock: stock || 0,
            imageUrl: req.file ? req.file.path : ''
        });

        const savedProduct = await newProduct.save();
        res.status(201).json(savedProduct);
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({ message: 'Failed to create product' });
    }
});

// Update a product
app.put('/api/products/:id', upload.single('image'), async(req, res) => {
    try {
        const { name, description, price, category, stock } = req.body;

        // Find the existing product
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Update fields
        product.name = name || product.name;
        product.description = description || product.description;
        product.price = price || product.price;
        product.category = category || product.category;
        product.stock = stock !== undefined ? stock : product.stock;

        // Update image if a new one was uploaded
        if (req.file) {
            // If there's an existing image, delete it from Cloudinary
            if (product.imageUrl) {
                // Extract public_id from the URL
                const publicId = product.imageUrl.split('/').pop().split('.')[0];
                await cloudinary.uploader.destroy(`product-images/${publicId}`);
            }
            product.imageUrl = req.file.path;
        }

        const updatedProduct = await product.save();
        res.json(updatedProduct);
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ message: 'Failed to update product' });
    }
});

// Delete a product
app.delete('/api/products/:id', async(req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Delete image from Cloudinary if exists
        if (product.imageUrl) {
            // Extract public_id from the URL
            const publicId = product.imageUrl.split('/').pop().split('.')[0];
            await cloudinary.uploader.destroy(`product-images/${publicId}`);
        }

        await Product.findByIdAndDelete(req.params.id);
        res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ message: 'Failed to delete product' });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
