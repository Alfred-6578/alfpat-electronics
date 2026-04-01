import axios from "axios";

const WHATSAPP_API = "https://graph.facebook.com/v22.0";

export const sendOrderNotification = async (order) => {
  try {
    const items = order.items
      .map((item) => `${item.name} x${item.qty} = ₦${(item.price * item.qty).toLocaleString()}`)
      .join(", ");

    await axios.post(
      `${WHATSAPP_API}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: "whatsapp",
        to: process.env.ADMIN_WHATSAPP_NUMBER,
        type: "template",
        template: {
          name: "new_order_notification",
          language: { code: "en" },
          components: [
            {
              type: "body",
              parameters: [
                { type: "text", text: String(order._id).slice(0, 8) },
                { type: "text", text: order.shippingAddress.fullName },
                { type: "text", text: order.shippingAddress.phone },
                { type: "text", text: `${order.shippingAddress.street}, ${order.shippingAddress.city}, ${order.shippingAddress.state}` },
                { type: "text", text: items },
                { type: "text", text: `₦${order.totalAmount.toLocaleString()}` },
                { type: "text", text: order.paymentStatus },
                { type: "text", text: new Date(order.createdAt).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" }) },
              ],
            },
          ],
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    return true;
  } catch (error) {
    console.error("WhatsApp notification failed:", error.response?.data || error.message);
    return false;
  }
};
