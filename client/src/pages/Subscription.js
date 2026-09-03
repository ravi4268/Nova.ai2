import React, { useState } from "react";
import "./Subscription.css";

function Subscription() {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("phone");
  const [paymentDone, setPaymentDone] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
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
    setUpiId("novaai@upi");
  };

  const closePayment = () => {
    setSelectedPlan(null);
    setPaymentDone(false);
  };

  const handlePayment = (e) => {
    e.preventDefault();

    if (paymentMethod === "phone") {
      openPhonePayment();
    }

    setPaymentDone(true);

    setTimeout(() => {
      alert(
        `${selectedPlan.name} plan selected successfully!`
      );

      setSelectedPlan(null);
      setPaymentDone(false);
    }, 1200);
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
            className="payment-modal"
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
                  onSubmit={handlePayment}
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
                  >
                    Pay ₹{selectedPlan.paymentPrice || selectedPlan.price}
                  </button>

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