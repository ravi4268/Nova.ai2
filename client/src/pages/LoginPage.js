import React, { useState } from "react";
import "./Login.css";

function Login({ setIsLoggedIn }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!email || !password) {
      alert("Please enter email and password");
      return;
    }

    // Save login
    localStorage.setItem("isLoggedIn", "true");

    // Open Nova AI
    setIsLoggedIn(true);
  };

  return (
    <div className="login-page">

      <div className="login-card">

        <div className="login-logo">
          <div className="logo-icon">N</div>
          <h1>Nova<span>.AI</span></h1>
        </div>

        <h2>Welcome Back 👋</h2>

        <p className="login-subtitle">
          Login to continue to Nova AI
        </p>

        <form onSubmit={handleSubmit}>

          <div className="input-group">
            <label>Email</label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="input-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button type="submit" className="login-btn">
            Login
          </button>

        </form>

        <p className="login-footer">
          Powered by <strong>Nova.AI</strong>
        </p>

      </div>

    </div>
  );
}

export default Login;
