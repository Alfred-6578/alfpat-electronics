import "dotenv/config";
import mongoose from "mongoose";
import User from "./models/User.js";
import Category from "./models/Category.js";
import Product from "./models/Product.js";
import Order from "./models/Order.js";

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");

    // Clear all collections
    await Promise.all([
      User.deleteMany(),
      Category.deleteMany(),
      Product.deleteMany(),
      Order.deleteMany(),
    ]);
    console.log("All collections cleared");

    // --- Admin user ---
    const admin = await User.create({
      name: "ALFPAT Admin",
      email: "admin@alfpat.com",
      password: "admin123",
      role: "admin",
    });
    console.log(`Admin created: ${admin.email}`);

    // --- Categories ---
    const categories = await Category.create([
      { name: "Laptops", image: "https://placehold.co/400x300/1a1a2e/ffffff?text=Laptops", description: "High-performance laptops for work and play" },
      { name: "Smartphones", image: "https://placehold.co/400x300/16213e/ffffff?text=Smartphones", description: "Latest smartphones from top brands" },
      { name: "Televisions", image: "https://placehold.co/400x300/0f3460/ffffff?text=Televisions", description: "Smart TVs and LED displays" },
      { name: "Audio", image: "https://placehold.co/400x300/533483/ffffff?text=Audio", description: "Speakers, headphones, and sound systems" },
      { name: "Accessories", image: "https://placehold.co/400x300/e94560/ffffff?text=Accessories", description: "Chargers, cables, cases, and more" },
      { name: "Gaming", image: "https://placehold.co/400x300/0a1931/ffffff?text=Gaming", description: "Gaming consoles, controllers, and gear" },
    ]);
    console.log(`${categories.length} categories created`);

    const [laptops, smartphones, televisions, audio, accessories, gaming] = categories;

    // --- Products (2 per category, 12 total) ---
    const products = await Product.create([
      // Laptops
      {
        name: "HP Pavilion 15 Core i5",
        description: "HP Pavilion 15 with 11th Gen Intel Core i5, 8GB RAM, 512GB SSD, 15.6-inch Full HD display. Perfect for everyday computing and light productivity.",
        price: 485000,
        discountPrice: 450000,
        images: [
          "https://placehold.co/600x400/1a1a2e/ffffff?text=HP+Pavilion+15",
          "https://placehold.co/600x400/2d2d44/ffffff?text=HP+Pavilion+Side",
        ],
        category: laptops._id,
        brand: "HP",
        stock: 12,
        specs: [
          { key: "Processor", value: "Intel Core i5-1135G7" },
          { key: "RAM", value: "8GB DDR4" },
          { key: "Storage", value: "512GB SSD" },
          { key: "Display", value: "15.6-inch FHD" },
        ],
        isFeatured: true,
        isActive: true,
      },
      {
        name: "Lenovo ThinkPad E14 Gen 5",
        description: "Business-class Lenovo ThinkPad E14 with AMD Ryzen 5, 16GB RAM, 512GB SSD. Built for professionals who demand reliability and performance.",
        price: 620000,
        images: [
          "https://placehold.co/600x400/1a1a2e/ffffff?text=ThinkPad+E14",
          "https://placehold.co/600x400/2d2d44/ffffff?text=ThinkPad+Open",
        ],
        category: laptops._id,
        brand: "Lenovo",
        stock: 8,
        specs: [
          { key: "Processor", value: "AMD Ryzen 5 7530U" },
          { key: "RAM", value: "16GB DDR4" },
          { key: "Storage", value: "512GB SSD" },
          { key: "Display", value: "14-inch FHD IPS" },
        ],
        isFeatured: false,
        isActive: true,
      },

      // Smartphones
      {
        name: "Samsung Galaxy A54 5G",
        description: "Samsung Galaxy A54 5G with 6.4-inch Super AMOLED display, 128GB storage, 50MP triple camera system, and 5000mAh battery for all-day power.",
        price: 265000,
        discountPrice: 245000,
        images: [
          "https://placehold.co/600x400/16213e/ffffff?text=Galaxy+A54",
          "https://placehold.co/600x400/1a3a5c/ffffff?text=Galaxy+A54+Back",
        ],
        category: smartphones._id,
        brand: "Samsung",
        stock: 20,
        specs: [
          { key: "Display", value: "6.4-inch Super AMOLED" },
          { key: "Storage", value: "128GB" },
          { key: "Camera", value: "50MP + 12MP + 5MP" },
          { key: "Battery", value: "5000mAh" },
        ],
        isFeatured: true,
        isActive: true,
      },
      {
        name: "iPhone 15 128GB",
        description: "Apple iPhone 15 with A16 Bionic chip, 48MP camera, Dynamic Island, USB-C, and ceramic shield front for durability. Premium smartphone experience.",
        price: 850000,
        images: [
          "https://placehold.co/600x400/16213e/ffffff?text=iPhone+15",
          "https://placehold.co/600x400/1a3a5c/ffffff?text=iPhone+15+Back",
        ],
        category: smartphones._id,
        brand: "Apple",
        stock: 10,
        specs: [
          { key: "Chip", value: "A16 Bionic" },
          { key: "Storage", value: "128GB" },
          { key: "Camera", value: "48MP Main" },
          { key: "Display", value: "6.1-inch Super Retina XDR" },
        ],
        isFeatured: false,
        isActive: true,
      },

      // Televisions
      {
        name: "LG 55-inch 4K Smart TV",
        description: "LG 55-inch 4K UHD Smart TV with webOS, ThinQ AI, HDR10, and Dolby Digital. Stream your favourite content in stunning picture quality.",
        price: 380000,
        discountPrice: 350000,
        images: [
          "https://placehold.co/600x400/0f3460/ffffff?text=LG+55+4K+TV",
          "https://placehold.co/600x400/1a4a7a/ffffff?text=LG+TV+Side",
        ],
        category: televisions._id,
        brand: "LG",
        stock: 7,
        specs: [
          { key: "Screen Size", value: "55 inches" },
          { key: "Resolution", value: "4K UHD (3840x2160)" },
          { key: "Smart TV", value: "webOS" },
          { key: "HDR", value: "HDR10" },
        ],
        isFeatured: true,
        isActive: true,
      },
      {
        name: "Hisense 43-inch Full HD TV",
        description: "Hisense 43-inch Full HD LED TV with built-in satellite decoder, HDMI and USB ports. Affordable quality for your living room.",
        price: 185000,
        images: [
          "https://placehold.co/600x400/0f3460/ffffff?text=Hisense+43+TV",
          "https://placehold.co/600x400/1a4a7a/ffffff?text=Hisense+Front",
        ],
        category: televisions._id,
        brand: "Hisense",
        stock: 15,
        specs: [
          { key: "Screen Size", value: "43 inches" },
          { key: "Resolution", value: "1920x1080 Full HD" },
          { key: "Ports", value: "2x HDMI, 1x USB" },
          { key: "Decoder", value: "Built-in satellite" },
        ],
        isFeatured: false,
        isActive: true,
      },

      // Audio
      {
        name: "JBL Charge 5 Bluetooth Speaker",
        description: "JBL Charge 5 portable Bluetooth speaker with powerful bass, IP67 waterproof rating, 20-hour playtime, and built-in powerbank.",
        price: 120000,
        images: [
          "https://placehold.co/600x400/533483/ffffff?text=JBL+Charge+5",
          "https://placehold.co/600x400/6a4c93/ffffff?text=JBL+Side",
        ],
        category: audio._id,
        brand: "JBL",
        stock: 18,
        specs: [
          { key: "Type", value: "Portable Bluetooth Speaker" },
          { key: "Battery", value: "20 hours" },
          { key: "Waterproof", value: "IP67" },
          { key: "Connectivity", value: "Bluetooth 5.1" },
        ],
        isFeatured: true,
        isActive: true,
      },
      {
        name: "Sony WH-1000XM5 Headphones",
        description: "Sony WH-1000XM5 wireless noise-cancelling headphones with 30-hour battery life, adaptive sound control, and premium comfort for extended listening.",
        price: 295000,
        images: [
          "https://placehold.co/600x400/533483/ffffff?text=Sony+WH1000XM5",
          "https://placehold.co/600x400/6a4c93/ffffff?text=Sony+Folded",
        ],
        category: audio._id,
        brand: "Sony",
        stock: 9,
        specs: [
          { key: "Type", value: "Over-ear Wireless" },
          { key: "ANC", value: "Active Noise Cancelling" },
          { key: "Battery", value: "30 hours" },
          { key: "Driver", value: "30mm" },
        ],
        isFeatured: false,
        isActive: true,
      },

      // Accessories
      {
        name: "Anker 65W USB-C Fast Charger",
        description: "Anker Nano II 65W USB-C GaN fast charger. Compact design powers laptops, tablets, and phones. Universal compatibility with PD 3.0.",
        price: 25000,
        discountPrice: 22000,
        images: [
          "https://placehold.co/600x400/e94560/ffffff?text=Anker+65W",
          "https://placehold.co/600x400/ff6b6b/ffffff?text=Anker+Box",
        ],
        category: accessories._id,
        brand: "Anker",
        stock: 20,
        specs: [
          { key: "Wattage", value: "65W" },
          { key: "Ports", value: "1x USB-C" },
          { key: "Technology", value: "GaN II, PD 3.0" },
          { key: "Compatibility", value: "Universal" },
        ],
        isFeatured: false,
        isActive: true,
      },
      {
        name: "Logitech MX Master 3S Mouse",
        description: "Logitech MX Master 3S wireless mouse with 8K DPI sensor, quiet clicks, MagSpeed scroll wheel, and USB-C charging. Works on any surface.",
        price: 85000,
        images: [
          "https://placehold.co/600x400/e94560/ffffff?text=MX+Master+3S",
          "https://placehold.co/600x400/ff6b6b/ffffff?text=MX+Master+Top",
        ],
        category: accessories._id,
        brand: "Logitech",
        stock: 14,
        specs: [
          { key: "DPI", value: "8000" },
          { key: "Connectivity", value: "Bluetooth, USB receiver" },
          { key: "Battery", value: "70 days" },
          { key: "Buttons", value: "7" },
        ],
        isFeatured: false,
        isActive: true,
      },

      // Gaming
      {
        name: "PlayStation 5 Slim Console",
        description: "Sony PlayStation 5 Slim with 1TB SSD, 4K gaming, ray tracing, DualSense controller, and access to the latest PS5 exclusive titles.",
        price: 750000,
        discountPrice: 720000,
        images: [
          "https://placehold.co/600x400/0a1931/ffffff?text=PS5+Slim",
          "https://placehold.co/600x400/1a2940/ffffff?text=PS5+Controller",
        ],
        category: gaming._id,
        brand: "Sony",
        stock: 5,
        specs: [
          { key: "Storage", value: "1TB SSD" },
          { key: "Resolution", value: "4K @ 120fps" },
          { key: "Ray Tracing", value: "Yes" },
          { key: "Controller", value: "DualSense" },
        ],
        isFeatured: false,
        isActive: true,
      },
      {
        name: "Xbox Wireless Controller",
        description: "Xbox Wireless Controller in Carbon Black. Textured grip, hybrid D-pad, 3.5mm audio jack. Compatible with Xbox Series X|S, PC, and mobile.",
        price: 45000,
        images: [
          "https://placehold.co/600x400/0a1931/ffffff?text=Xbox+Controller",
          "https://placehold.co/600x400/1a2940/ffffff?text=Xbox+Back",
        ],
        category: gaming._id,
        brand: "Microsoft",
        stock: 16,
        specs: [
          { key: "Connectivity", value: "Bluetooth, USB-C" },
          { key: "Audio", value: "3.5mm jack" },
          { key: "Compatibility", value: "Xbox, PC, Mobile" },
          { key: "Battery", value: "AA batteries (up to 40hrs)" },
        ],
        isFeatured: false,
        isActive: true,
      },
    ]);

    console.log(`${products.length} products created`);
    console.log(`  Featured: ${products.filter((p) => p.isFeatured).length}`);

    console.log("\nSeed complete!");
    process.exit(0);
  } catch (error) {
    console.error("Seed error:", error.message);
    process.exit(1);
  }
};

seed();
