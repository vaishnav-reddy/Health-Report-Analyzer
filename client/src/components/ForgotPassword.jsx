import React, { useState } from "react";
import { Link } from "react-router-dom";
import { forgotPassword } from "../utils/api";
// import { forgotPassword } from "../utils/api";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      await forgotPassword(email);
      setMessage(
        "If an account with that email exists, a reset link has been sent."
      );
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h2>Forgot Password</h2>
          <p>Enter your email to receive a reset link</p>
        </div>

        {message && (
          <div className={message.includes("sent") ? "auth-message" : "auth-error"}>
            {message.includes("sent") ? "✅" : "❌"} {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Enter your email"
            />
          </div>

          <button
            type="submit"
            className="btn-auth-submit"
            disabled={loading}
          >
            {loading ? (
              <span>
                <span className="spinner-small"></span>
                Sending...
              </span>
            ) : (
              "Send Reset Link"
            )}
          </button>
        </form>

        <div className="auth-toggle">
          <p>
            Remember your password?{" "}
            <Link to="/login" className="btn-toggle" style={{ textDecoration: "none" }}>
              Sign in
            </Link>
          </p>
          <p>
            
            <Link to="/" className="btn-toggle" style={{ textDecoration: "none" }}>
               Back to Home
            </Link>
          </p>
        </div>

        <div className="auth-demo">
          <p className="demo-notice">
            🔒 <strong>Secure Reset:</strong> If your email exists in our system, you'll receive a secure password reset link.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
