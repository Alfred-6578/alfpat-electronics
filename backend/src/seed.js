import "dotenv/config";
import mongoose from "mongoose";
import User from "./models/User.js";

const users = [
  {
    name: "Admin User",
    email: "admin@alfpat.com",
    password: "admin123456",
    role: "admin",
    phone: "08012345678",
    address: { street: "1 Admin Street", city: "Lagos", state: "Lagos" },
  },
  {
    name: "John Customer",
    email: "john@example.com",
    password: "password123",
    role: "user",
    phone: "08098765432",
    address: { street: "5 Market Road", city: "Ikeja", state: "Lagos" },
  },
  {
    name: "Jane Buyer",
    email: "jane@example.com",
    password: "password123",
    role: "user",
    phone: "07011223344",
    address: { street: "10 Allen Avenue", city: "Abuja", state: "FCT" },
  },
];

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");

    await User.deleteMany();
    console.log("Existing users cleared");

    const created = await User.create(users);
    console.log(`${created.length} users seeded:`);
    created.forEach((u) => console.log(`  - ${u.email} (${u.role})`));

    process.exit(0);
  } catch (error) {
    console.error("Seed error:", error.message);
    process.exit(1);
  }
};

seed();
