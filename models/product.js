const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema({
  name: String,
  brand: String,
  price: String,
  condition: String,
  description: String,
  contact: String,
  category: String,
  img: String,
  status: { type: String, default: "pending" },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Product", ProductSchema);