import crypto from "crypto";
import asyncHandler from "express-async-handler";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import PendingPayment from "../models/PendingPayment.js";
import { initializePayment as initPaystack, verifyPayment as verifyPaystack } from "../services/paystackService.js";
import { sendOrderNotification } from "../services/whatsappService.js";

// @desc    Initialize payment — validates cart, creates PendingPayment, returns Paystack URL
// @route   POST /api/payments/initialize
export const initializePayment = asyncHandler(async (req, res) => {
  const { items, shippingAddress } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    res.status(400);
    throw new Error("Order must contain at least one item");
  }

  if (
    !shippingAddress?.fullName ||
    !shippingAddress?.phone ||
    !shippingAddress?.street ||
    !shippingAddress?.city ||
    !shippingAddress?.state
  ) {
    res.status(400);
    throw new Error("Shipping address must include fullName, phone, street, city, and state");
  }

  const cartItems = [];
  let totalAmount = 0;

  for (const item of items) {
    const product = await Product.findById(item._id);

    if (!product || !product.isActive) {
      res.status(400);
      throw new Error(`Product not found or unavailable: ${item._id}`);
    }

    if (product.stock < item.qty) {
      res.status(400);
      throw new Error(`Not enough stock for ${product.name}`);
    }

    const price = product.discountPrice || product.price;

    cartItems.push({
      productId: product._id,
      name: product.name,
      image: product.images[0] || "",
      qty: item.qty,
      price,
    });

    totalAmount += price * item.qty;
  }

  const reference =
    "ALFPAT-" + Date.now() + "-" + Math.random().toString(36).substr(2, 9).toUpperCase();

  const callbackUrl = `${process.env.CLIENT_URL}/orders/verify?reference=${reference}`;

  const { authorizationUrl } = await initPaystack({
    email: req.user.email,
    amount: totalAmount,
    reference,
    callbackUrl,
  });

  await PendingPayment.create({
    reference,
    userId: req.user._id,
    cartItems,
    shippingAddress,
    totalAmount,
    email: req.user.email,
  });

  res.json({ paymentUrl: authorizationUrl, reference });
});

// @desc    Paystack webhook — creates order after successful payment
// @route   POST /api/payments/webhook
export const handleWebhook = async (req, res) => {
  const rawBody = req.body instanceof Buffer ? req.body.toString("utf8") : JSON.stringify(req.body);

  const hash = crypto
    .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY)
    .update(rawBody)
    .digest("hex");

  if (hash !== req.headers["x-paystack-signature"]) {
    return res.status(401).send("Invalid signature");
  }

  const parsed = typeof req.body === "string" || req.body instanceof Buffer
    ? JSON.parse(rawBody)
    : req.body;

  const { event, data } = parsed;

  console.log("Webhook received:", event);
  console.log("Processing reference:", data.reference);

  if (event !== "charge.success") {
    return res.status(200).send("Event ignored");
  }

  try {
    const pendingPayment = await PendingPayment.findOne({ reference: data.reference });

    if (!pendingPayment) {
      console.log("Pending payment not found for reference:", data.reference);
      return res.status(200).send("Reference not found");
    }

    console.log("Pending payment found:", pendingPayment._id);

    if (pendingPayment.status === "completed") {
      console.log("Already processed:", data.reference);
      return res.status(200).send("Already processed");
    }

    const verification = await verifyPaystack(data.reference);

    if (!verification.success) {
      pendingPayment.status = "failed";
      await pendingPayment.save();
      console.log("Payment verification failed for:", data.reference);
      return res.status(200).send("Payment verification failed");
    }

    // Create the real order
    let order;
    try {
      order = await Order.create({
        user: pendingPayment.userId,
        items: pendingPayment.cartItems.map((item) => ({
          product: item.productId,
          name: item.name,
          image: item.image,
          qty: item.qty,
          price: item.price,
        })),
        shippingAddress: pendingPayment.shippingAddress,
        totalAmount: pendingPayment.totalAmount,
        paymentReference: data.reference,
        paymentStatus: "paid",
        orderStatus: "processing",
      });

      console.log("Order created:", order._id);

      // Reduce stock
      for (const item of pendingPayment.cartItems) {
        await Product.findByIdAndUpdate(item.productId, {
          $inc: { stock: -item.qty },
        });
      }

      pendingPayment.status = "completed";
      await pendingPayment.save();
    } catch (orderError) {
      console.error("Order creation failed:", orderError.message);
      try {
        pendingPayment.status = "failed";
        await pendingPayment.save();
      } catch {}
      return res.status(200).json({ received: true, error: orderError.message });
    }

    // WhatsApp — never let it fail the webhook
    try {
      const whatsappResult = await sendOrderNotification(order);
      console.log("WhatsApp sent:", whatsappResult);
    } catch (whatsappError) {
      console.error("WhatsApp notification failed:", whatsappError.message);
    }

    return res.status(200).send("Order created successfully");
  } catch (error) {
    console.error("Webhook processing error:", error.message);
    return res.status(200).json({ received: true, error: error.message });
  }
};

// @desc    Get order by payment reference (for frontend polling)
// @route   GET /api/payments/order/:reference
export const getOrderByReference = asyncHandler(async (req, res) => {
  const { reference } = req.params;

  if (!reference || reference.trim().length < 5) {
    return res.status(400).json({
      found: false,
      error: "invalid_reference",
      message: "Invalid payment reference format",
    });
  }

  try {
    const order = await Order.findOne({ paymentReference: reference })
      .populate("user", "name email")
      .populate("items.product", "name images");

    const pending = await PendingPayment.findOne({ reference });

    // Order found
    if (order) {
      // Security check
      if (order.user._id.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          found: false,
          error: "unauthorized",
          message: "This order does not belong to your account",
        });
      }

      if (order.paymentStatus === "paid") {
        return res.json({ found: true, status: "paid", order });
      }

      if (order.paymentStatus === "failed") {
        return res.json({
          found: true,
          status: "failed",
          order,
          message: "Payment was declined by Paystack",
        });
      }

      // pending
      return res.json({
        found: true,
        status: "pending",
        order,
        message: "Payment is still being confirmed",
      });
    }

    // Order not found — check pending payment for context
    if (!pending) {
      return res.json({
        found: false,
        status: "not_initialized",
        message: "No payment was initialized with this reference",
      });
    }

    if (pending.status === "pending") {
      // Security: ensure pending payment belongs to this user
      if (pending.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          found: false,
          error: "unauthorized",
          message: "This payment does not belong to your account",
        });
      }

      // Actively verify with Paystack instead of waiting for webhook
      try {
        const verification = await verifyPaystack(reference);

        if (verification.success) {
          // Payment confirmed — create the order now
          const order = await Order.create({
            user: pending.userId,
            items: pending.cartItems.map((item) => ({
              product: item.productId,
              name: item.name,
              image: item.image,
              qty: item.qty,
              price: item.price,
            })),
            shippingAddress: pending.shippingAddress,
            totalAmount: pending.totalAmount,
            paymentReference: reference,
            paymentStatus: "paid",
            orderStatus: "processing",
          });

          // Reduce stock
          for (const item of pending.cartItems) {
            await Product.findByIdAndUpdate(item.productId, {
              $inc: { stock: -item.qty },
            });
          }

          pending.status = "completed";
          await pending.save();

          // WhatsApp — fire and forget
          sendOrderNotification(order).catch((err) =>
            console.error("WhatsApp failed:", err.message)
          );

          const populatedOrder = await Order.findById(order._id)
            .populate("user", "name email")
            .populate("items.product", "name images");

          return res.json({ found: true, status: "paid", order: populatedOrder });
        }

        if (verification.status === "failed" || verification.status === "abandoned") {
          pending.status = "failed";
          await pending.save();
          return res.json({
            found: false,
            status: "failed",
            message: "Payment was declined by Paystack",
          });
        }

        // Still pending on Paystack's end (e.g. "abandoned" or "ongoing")
        return res.json({
          found: false,
          status: "processing",
          message: "Payment is being processed, please wait",
        });
      } catch (verifyError) {
        console.error("Direct verification failed:", verifyError.message);
        // Can't verify — tell frontend to keep polling
        return res.json({
          found: false,
          status: "processing",
          message: "Payment is being processed, please wait",
        });
      }
    }

    if (pending.status === "failed") {
      return res.json({
        found: false,
        status: "failed",
        message: "Payment failed during processing",
      });
    }

    if (pending.status === "completed") {
      return res.json({
        found: false,
        status: "creating",
        message: "Order is being created, almost done",
      });
    }

    return res.json({ found: false, status: "unknown" });
  } catch (error) {
    console.error("getOrderByReference error:", error);
    return res.status(500).json({
      found: false,
      error: "server_error",
      message: "Something went wrong verifying your payment",
    });
  }
});
