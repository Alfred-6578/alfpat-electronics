import mongoose from "mongoose";

const pendingPaymentSchema = new mongoose.Schema({
  reference: { type: String, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  cartItems: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
      name: String,
      image: String,
      qty: Number,
      price: Number,
    },
  ],
  shippingAddress: {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
  },
  totalAmount: { type: Number, required: true },
  email: { type: String, required: true },
  status: {
    type: String,
    enum: ["pending", "completed", "failed"],
    default: "pending",
  },
  createdAt: { type: Date, default: Date.now },
});

pendingPaymentSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });

export default mongoose.model("PendingPayment", pendingPaymentSchema);
