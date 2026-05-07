const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require("jsonwebtoken");

// Import Models
const User = require("./models/User");
const Product = require("./models/Product");
const Review = require("./models/Review");

const app = express();
const JWT_SECRET = "watchshop_secret_key_2026_navya";   // You can change this

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect("mongodb+srv://navyavm123_db_user:mypassword123@cluster0.fhppqqd.mongodb.net/watchshop")
  .then(() => console.log("✅ MongoDB connected successfully"))
  .catch((err) => console.log("❌ MongoDB error:", err));

/* ==================== AUTH MIDDLEWARE ==================== */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: "Access Denied. Please Login." });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: "Invalid or Expired Token" });
    req.user = user;
    next();
  });
};

/* ==================== USER ROUTES ==================== */

// Register
app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: "User already exists" });

    const newUser = new User({ name, email, password });
    await newUser.save();
    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Login
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user || user.password !== password) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign(
      { id: user._id, name: user.name, email: user.email },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      token,
      user: { id: user._id, name: user.name, email: user.email }
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

/* ==================== PRODUCT ROUTES ==================== */

// Get All Products
app.get("/products", async (req, res) => {
  try {
    const products = await Product.find({});
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get Single Product
app.get("/products/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ==================== REVIEW ROUTES ==================== */

// Post Review (Protected)
app.post("/reviews", authenticateToken, async (req, res) => {
  try {
    const { productId, rating, comment, photo } = req.body;

    const review = new Review({
      productId,
      userId: req.user.id,
      userName: req.user.name,
      rating,
      comment,
      photo: photo || null
    });

    await review.save();
    res.status(201).json({ success: true, message: "Review posted successfully!", review });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: "You have already reviewed this product" });
    }
    res.status(500).json({ message: err.message });
  }
});

// Get Reviews for a Product
app.get("/reviews/:productId", async (req, res) => {
  try {
    const reviews = await Review.find({ productId: req.params.productId })
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// ==================== CREATE PRODUCT (Sell Watch) ====================
// POST /products - Sell Watch
app.post("/products", async (req, res) => {
  try {
    const { brand, model, watchName, price, condition, description, contact } = req.body;

    if (!brand || !price || !contact) {
      return res.status(400).json({ message: "Brand, Price and Contact are required" });
    }

    const newProduct = new Product({
      name: watchName || `${brand} ${model || ''}`.trim(),
      brand,
      price: price.toString(),
      condition: condition || "New",
      description: description || "",
      contact,
      category: "Watches",
      status: "pending",        // Change to "approved" for testing
      img: "",                  // We'll add later
      createdAt: new Date()
    });

    await newProduct.save();

    console.log("✅ Watch saved successfully:", newProduct.name);

    res.status(201).json({
      success: true,
      message: "Watch submitted successfully!",
      product: newProduct
    });

  } catch (err) {
    console.error("❌ Error saving watch:", err.message);
    res.status(500).json({ 
      message: "Error saving watch",
      error: err.message 
    });
  }
});
/* ==================== START SERVER ==================== */
app.listen(5000, () => {
  console.log("🚀 Server running on http://localhost:5000");
});