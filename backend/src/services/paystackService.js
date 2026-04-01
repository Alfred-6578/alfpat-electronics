import axios from "axios";

const PAYSTACK_BASE = "https://api.paystack.co";

const headers = () => ({
  Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
  "Content-Type": "application/json",
});

export const initializePayment = async ({ email, amount, reference, metadata }) => {
  try {
    const { data } = await axios.post(
      `${PAYSTACK_BASE}/transaction/initialize`,
      { email, amount: amount * 100, reference, metadata },
      { headers: headers() }
    );

    if (data.status) {
      return {
        authorizationUrl: data.data.authorization_url,
        reference: data.data.reference,
      };
    }

    throw new Error("Paystack initialization failed");
  } catch (error) {
    throw new Error(error.response?.data?.message || "Paystack initialization failed");
  }
};

export const verifyPayment = async (reference) => {
  try {
    const { data } = await axios.get(
      `${PAYSTACK_BASE}/transaction/verify/${reference}`,
      { headers: headers() }
    );

    if (data.status && data.data.status === "success") {
      return { success: true, data: data.data };
    }

    return { success: false, data: data.data };
  } catch (error) {
    throw new Error(error.response?.data?.message || "Payment verification failed");
  }
};
