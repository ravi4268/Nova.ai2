import React, { useState } from "react";
import "./Subscription.css";

const API_URL =
  process.env.REACT_APP_API_URL ||
  (process.env.NODE_ENV === "production" ? "" : "http://localhost:5001");

async function readApiResponse(response) {
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    throw new Error("Payment server is unavailable. Please restart the backend and try again.");
  }

  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Payment request failed");
  return data;
}

function Subscription({ onPlanActivated }) {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("phone");
  const [paymentDone, setPaymentDone] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [upiId, setUpiId] = useState("novaai@upi");

  const openPhonePayment = () => {
    if (!selectedPlan || typeof window === "undefined") {
      return;
    }

    const amount = selectedPlan.paymentPrice || selectedPlan.price;
    const safeUpi = upiId || "novaai@upi";
    const upiLink = `upi://pay?pa=${encodeURIComponent(
      safeUpi
    )}&pn=${encodeURIComponent("Nova AI")}&am=${amount}&cu=INR&tn=${encodeURIComponent(
      `${selectedPlan.name} Plan`
    )}`;

    window.location.href = upiLink;
  };

  const plans = [
    {
      id: "free",
      icon: "🆓",
      name: "Free",
      description: "Perfect for getting started",
      price: 0,
      features: [
        "20 AI messages",
        "Basic AI access",
        "Chat history",
        "Standard support",
      ],
    },
    {
      id: "basic",
      icon: "🚀",
      name: "Basic",
      description: "For regular AI users",
      price: 199,
      features: [
        "500 AI messages",
        "Faster AI responses",
        "Unlimited chat history",
        "Priority support",
      ],
    },
    {
      id: "pro",
      icon: "⭐",
      name: "Pro",
      description: "For professional users",
      price: 0,
      paymentPrice: 399,
      popular: true,
      features: [
        "Unlimited AI messages",
        "Advanced AI models",
        "File uploads",
        "Image generation",
        "Priority support",
      ],
    },
    {
      id: "premium",
      icon: "👑",
      name: "Premium",
      description: "Complete AI experience",
      price: 999,
      features: [
        "Everything in Pro",
        "Premium AI models",
        "Unlimited file uploads",
        "Advanced image generation",
        "24/7 premium support",
      ],
    },
  ];

  const openPayment = (plan) => {
    if (plan.id === "free") {
      alert("You are already using the Free plan.");
      return;
    }

    setSelectedPlan(plan);
    setPaymentDone(false);
    setPaymentMethod("phone");
    setPhoneNumber("");
    setOtp("");
    setOtpSent(false);
    setPaymentError("");
    setUpiId("novaai@upi");
  };

  const closePayment = () => {
    setSelectedPlan(null);
    setPaymentDone(false);
  };

  const handlePayment = (e) => {
    e.preventDefault();
    if (paymentMethod !== "phone") {
      setPaymentDone(true);
      onPlanActivated?.(selectedPlan.name);
      return;
    }

    setPaymentLoading(true);
    setPaymentError("");
    fetch(`${API_URL}/api/payment/send-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: phoneNumber }),
    })
      .then(async (response) => {
        const data = await readApiResponse(response);
        if (data.demoOtp) alert(`Demo OTP: ${data.demoOtp}`);
        setOtpSent(true);
        openPhonePayment();
      })
      .catch((error) => setPaymentError(error.message))
      .finally(() => setPaymentLoading(false));
  };

  const verifyOtp = (e) => {
    e.preventDefault();
    setPaymentLoading(true);
    setPaymentError("");
    fetch(`${API_URL}/api/payment/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: phoneNumber, otp }),
    })
      .then(async (response) => {
        await readApiResponse(response);
        setPaymentDone(true);
        onPlanActivated?.(selectedPlan.name);
      })
      .catch((error) => setPaymentError(error.message))
      .finally(() => setPaymentLoading(false));
  };

  return (
    <div className="subscription-page">

      {/* =========================
          HEADER
      ========================= */}

      <div className="subscription-header">

        <div className="subscription-title-area">

          <div className="subscription-main-icon">
            💳
          </div>

          <div>
            <h1>Choose Your Plan</h1>

            <p>
              Upgrade your Nova AI experience with a
              plan that fits you.
            </p>
          </div>

        </div>

      </div>

      {/* =========================
          PLANS
      ========================= */}

      <div className="plans-grid">

        {plans.map((plan) => (

          <div
            className={`plan-card ${
              plan.popular ? "popular-plan" : ""
            }`}
            key={plan.id}
          >

            {/* POPULAR */}

            {plan.popular && (
              <div className="popular-badge">
                ⭐ MOST POPULAR
              </div>
            )}

            {/* ICON */}

            <div className="plan-icon">
              {plan.icon}
            </div>

            {/* NAME */}

            <h2>
              {plan.name}
            </h2>

            {/* DESCRIPTION */}

            <p className="plan-description">
              {plan.description}
            </p>

            {/* PRICE */}

            <div className="plan-price">

              {plan.paymentPrice ? (
                <>
                  <span className="plan-price-strike">
                    ₹{plan.paymentPrice}
                  </span>
                  <span className="plan-price-final">
                    ₹{plan.price}
                  </span>
                </>
              ) : (
                <span>
                  ₹{plan.price}
                </span>
              )}

              <small>
                /month
              </small>

            </div>

            {/* FEATURES */}

            <div className="features">

              {plan.features.map(
                (feature, index) => (

                  <div
                    className="feature"
                    key={index}
                  >

                    <span className="check-icon">
                      ✓
                    </span>

                    <span>
                      {feature}
                    </span>

                  </div>

                )
              )}

            </div>

            {/* BUTTON */}

            <button
              type="button"
              className={`subscribe-btn ${
                plan.popular
                  ? "popular-button"
                  : ""
              }`}
              onClick={() =>
                openPayment(plan)
              }
            >
              {plan.id === "free"
                ? "Current Plan"
                : "Subscribe"}
            </button>

          </div>

        ))}

      </div>

      {/* =========================
          PAYMENT MODAL
      ========================= */}

      {selectedPlan && (

        <div
          className="payment-overlay"
          onClick={closePayment}
        >

          <div
            className={`payment-modal ${paymentDone ? "payment-modal-success" : ""}`}
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            {/* CLOSE */}

            <button
              type="button"
              className="close-payment"
              onClick={closePayment}
            >
              ×
            </button>

            {!paymentDone ? (

              <>
                {/* PAYMENT HEADER */}

                <div className="payment-header">

                  <div className="payment-modal-icon">
                    💳
                  </div>

                  <h2>
                    Subscribe to{" "}
                    <strong>
                      {selectedPlan.name}
                    </strong>
                  </h2>

                  <p>
                    Complete your payment to
                    activate your Nova AI plan.
                  </p>

                </div>

                {/* PAYMENT METHODS */}

                <div className="payment-methods">

                  <button
                    type="button"
                    className={`method ${
                      paymentMethod === "phone"
                        ? "active-method"
                        : ""
                    }`}
                    onClick={() =>
                      setPaymentMethod("phone")
                    }
                  >
                    📱 Phone Pay
                  </button>

                  <button
                    type="button"
                    className={`method ${
                      paymentMethod === "upi"
                        ? "active-method"
                        : ""
                    }`}
                    onClick={() =>
                      setPaymentMethod("upi")
                    }
                  >
                    🟣 UPI
                  </button>

                  <button
                    type="button"
                    className={`method ${
                      paymentMethod === "card"
                        ? "active-method"
                        : ""
                    }`}
                    onClick={() =>
                      setPaymentMethod("card")
                    }
                  >
                    💳 Card
                  </button>

                </div>

                {/* FORM */}

                <form
                  onSubmit={otpSent && paymentMethod === "phone" ? verifyOtp : handlePayment}
                >

                  {paymentMethod === "phone" ? (

                    <>
                      <label>
                        Phone Number
                      </label>

                      <input
                        type="tel"
                        placeholder="Enter your mobile number"
                        value={phoneNumber}
                        onChange={(e) =>
                          setPhoneNumber(
                            e.target.value.replace(/\D/g, "").slice(0, 10)
                          )
                        }
                        required
                      />

                      <p className="upi-example">
                        This will open your UPI app on your Motorola G15 and complete payment from your phone.
                      </p>

                      {otpSent && (
                        <>
                          <label>
                            OTP sent to your phone
                          </label>

                          <input
                            type="text"
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            placeholder="Enter 6-digit OTP"
                            value={otp}
                            onChange={(e) =>
                              setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                            }
                            required
                          />
                        </>
                      )}
                    </>

                  ) : paymentMethod === "upi" ? (

                    <>
                      <label>
                        UPI ID
                      </label>

                      <input
                        type="text"
                        placeholder="example@upi"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        required
                      />

                      <p className="upi-example">
                        Example: name@okaxis
                      </p>
                    </>

                  ) : (

                    <>

                      <label>
                        Card Number
                      </label>

                      <input
                        type="text"
                        placeholder="1234 5678 9012 3456"
                        maxLength="19"
                        required
                      />

                      <label>
                        Card Holder Name
                      </label>

                      <input
                        type="text"
                        placeholder="Enter card holder name"
                        required
                      />

                      <div className="card-row">

                        <div className="card-field">

                          <label>
                            Expiry
                          </label>

                          <input
                            type="text"
                            placeholder="MM/YY"
                            required
                          />

                        </div>

                        <div className="card-field">

                          <label>
                            CVV
                          </label>

                          <input
                            type="password"
                            placeholder="•••"
                            maxLength="3"
                            required
                          />

                        </div>

                      </div>

                    </>

                  )}

                  {/* AMOUNT */}

                  <div className="amount-box">

                    <span>
                      Total Amount
                    </span>

                    <strong>
                      ₹{selectedPlan.paymentPrice || selectedPlan.price}
                    </strong>

                  </div>

                  {/* PAY */}

                  <button
                    type="submit"
                    className="pay-button"
                    disabled={paymentLoading}
                  >
                    {paymentLoading
                      ? "Please wait..."
                      : otpSent && paymentMethod === "phone"
                        ? "Verify OTP"
                        : `Pay ₹${selectedPlan.paymentPrice || selectedPlan.price}`}
                  </button>

                  {paymentError && (
                    <p className="payment-error">
                      {paymentError}
                    </p>
                  )}

                  <p className="secure-payment">
                    🔒 Secure payment powered by
                    Nova AI
                  </p>

                </form>

              </>

            ) : (

              /* SUCCESS */

              <div className="payment-success">

                <div className="success-icon">
                  ✓
                </div>

                <h2>
                  Payment Successful
                </h2>

                <p>
                  Your{" "}
                  <strong>
                    {selectedPlan.name}
                  </strong>{" "}
                  plan is being activated.
                </p>

              </div>

            )}

          </div>

        </div>

      )}

    </div>
  );
}

export default Subscription;