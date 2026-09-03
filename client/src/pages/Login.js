import React, { useState } from "react";

function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!email || !password) {
      alert("Please enter email and password");
      return;
    }

    onLogin();
  };

  return (
    <div className="login-page">

      <div className="login-card">

        <div className="login-logo">
          <div className="logo-icon">
            N
          </div>

          <h1>
            Nova<span>.AI</span>
          </h1>
        </div>

        <h2>Welcome Back 👋</h2>

        <p className="login-subtitle">
          Login to continue to Nova AI
        </p>

        <form onSubmit={handleSubmit}>

          <label>Email Address</label>

          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <label>Password</label>

          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button type="submit">
            Login to Nova AI →
          </button>

        </form>

        <p className="login-footer">
          ⚡ Powered by Nova.AI
        </p>

      </div>

    </div>
  );
}

export default Login;