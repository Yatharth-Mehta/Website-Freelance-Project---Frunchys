export async function onRequest(context) {
  // Handle CORS preflight
  if (context.request.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  // ═══════════════════════════════════════════════
  // YOUR STRIPE SECRET KEY
  // Get it from: https://dashboard.stripe.com/apikeys
  // ═══════════════════════════════════════════════
  const SECRET_KEY = "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";

  try {
    const input = await context.request.json();
    const { amount, payment_method_id, email, name } = input;

    if (!amount || amount < 100 || !payment_method_id) {
      return Response.json({ error: "Invalid request" }, { status: 400 });
    }

    // Create PaymentIntent via Stripe API
    const params = new URLSearchParams({
      amount: String(amount),
      currency: "gbp",
      payment_method: payment_method_id,
      confirm: "true",
      "automatic_payment_methods[enabled]": "true",
      "automatic_payment_methods[allow_redirects]": "never",
      description: "Frunchys Order - " + (name || "Customer"),
      receipt_email: email || "",
      "metadata[customer_name]": name || "",
      "metadata[customer_email]": email || "",
    });

    const stripeRes = await fetch("https://api.stripe.com/v1/payment_intents", {
      method: "POST",
      headers: {
        Authorization: "Basic " + btoa(SECRET_KEY + ":"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    const result = await stripeRes.json();

    if (result.status === "succeeded") {
      return Response.json({
        success: true,
        payment_id: result.id,
        amount: result.amount,
      }, {
        headers: { "Access-Control-Allow-Origin": "*" },
      });
    } else {
      return Response.json({
        error: result.error?.message || "Payment failed",
        status: result.status || "unknown",
      }, {
        status: 400,
        headers: { "Access-Control-Allow-Origin": "*" },
      });
    }
  } catch (e) {
    return Response.json({ error: "Server error: " + e.message }, {
      status: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
    });
  }
}
