import mongoose from "mongoose";

const MAX_RETRIES = 3;
const RETRY_DELAY = 5000;

const connectDB = async () => {
  let retries = 0;

  while (retries < MAX_RETRIES) {
    try {
      const conn = await mongoose.connect(process.env.MONGO_URI, {
        serverSelectionTimeoutMS: 20000,
        socketTimeoutMS: 45000,
        maxPoolSize: 10,
      });

      console.log(`MongoDB connected: ${conn.connection.host}`);

      mongoose.connection.on("error", (err) => {
        console.error("MongoDB connection error:", err.message);
      });

      mongoose.connection.on("disconnected", () => {
        console.warn("MongoDB disconnected. Mongoose will auto-reconnect.");
      });

      return;
    } catch (error) {
      retries++;
      console.error(`MongoDB connection attempt ${retries}/${MAX_RETRIES} failed: ${error.message}`);

      if (retries >= MAX_RETRIES) {
        console.error("All MongoDB connection attempts failed. Exiting.");
        process.exit(1);
      }

      console.log(`Retrying in ${RETRY_DELAY / 1000}s...`);
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
    }
  }
};

export default connectDB;
