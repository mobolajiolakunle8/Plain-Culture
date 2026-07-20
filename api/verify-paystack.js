// Vercel Serverless Function: Verify Paystack transaction server-side.
// Add PAYSTACK_SECRET_KEY in Vercel environment variables before production use.

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ success: false, message: "Method not allowed" });

  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    return res.status(500).json({ success: false, message: "PAYSTACK_SECRET_KEY is not configured" });
  }

  try {
    const { reference } = req.body || {};
    if (!reference) return res.status(400).json({ success: false, message: "Missing payment reference" });

    const verifyResponse = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json"
      }
    });

    const data = await verifyResponse.json();

    if (!verifyResponse.ok || !data.status) {
      return res.status(400).json({ success: false, message: "Payment verification failed", data });
    }

    const verified = data.data?.status === "success";
    return res.status(200).json({
      success: verified,
      reference: data.data?.reference,
      amount: data.data?.amount,
      currency: data.data?.currency,
      paidAt: data.data?.paid_at,
      channel: data.data?.channel,
      customer: data.data?.customer
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error while verifying payment", error: String(error) });
  }
}