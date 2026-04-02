import axios from "axios";

const PAYSTACK_BASE = "https://api.paystack.co";

const headers = () => ({
  Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
  "Content-Type": "application/json",
});

export const initializePayment = async ({ email, amount, reference, callbackUrl, metadata }) => {
  try {
    const { data } = await axios.post(
      `${PAYSTACK_BASE}/transaction/initialize`,
      {
        email,
        amount: amount * 100,
        reference,
        callback_url: callbackUrl,
        metadata: metadata || {},
      },
      { headers: headers() }
    );

    if (data.status) {
      return {
        authorizationUrl: data.data.authorization_url,
        reference: data.data.reference,
        accessCode: data.data.access_code,
      };
    }

    throw new Error("Payment initialization failed");
  } catch (error) {
    throw new Error("Payment initialization failed: " + (error.response?.data?.message || error.message));
  }
};

export const verifyPayment = async (reference) => {
  try {
    const { data } = await axios.get(
      `${PAYSTACK_BASE}/transaction/verify/${reference}`,
      { headers: headers() }
    );

    if (data.status) {
      return {
        success: data.data.status === "success",
        status: data.data.status,
        amount: data.data.amount / 100,
        reference: data.data.reference,
        email: data.data.customer.email,
        paidAt: data.data.paid_at,
        data: data.data,
      };
    }

    throw new Error("Payment verification failed");
  } catch (error) {
    throw new Error("Payment verification failed: " + (error.response?.data?.message || error.message));
  }
};
