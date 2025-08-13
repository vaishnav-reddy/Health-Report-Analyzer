import React, { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { resetPassword } from "../utils/api";

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await resetPassword(token, password);
      setMessage("Password reset successful! You can now log in.");
      setSuccess(true);
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/');
      }, 3000);
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
          <h2>Reset Password</h2>
          <p>Enter your new password below</p>
        </div>

        {message && (
          <div className={success ? "auth-message" : "auth-error"}>
            {success ? "✅" : "❌"} {message}
            {success && (
              <div style={{ fontSize: "0.9em", marginTop: "0.5rem" }}>
                Redirecting to login in 3 seconds...
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="password">New Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter your new password"
              minLength={6}
            />
            <small className="form-hint">
              Password must be at least 6 characters
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="Confirm your new password"
              minLength={6}
            />
          </div>

          <button
            type="submit"
            className="btn-auth-submit"
            disabled={loading || success}
          >
            {loading ? (
              <span>
                <span className="spinner-small"></span>
                Resetting...
              </span>
            ) : (
              "Reset Password"
            )}
          </button>
        </form>

        {!success && (
          <div className="auth-toggle">
            <p>
              Remember your password?{" "}
              <Link to="/" className="btn-toggle" style={{ textDecoration: "none" }}>
                Sign in
              </Link>
            </p>
          </div>
        )}

        <div className="auth-demo">
          <p className="demo-notice">
            🔒 <strong>Secure Platform:</strong> Your new password will be encrypted and stored securely.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
