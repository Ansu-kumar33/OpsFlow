import { useState } from "react";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      setMessage("Please enter email and password.");
      return;
    }

    setMessage("Login details submitted successfully.");

    console.log("Login submitted:", {
      email,
      password,
    });
  };

  return (
    <div className="login-page">
      <div className="login-wrapper">

        {/* LEFT SIDE */}
        <div className="brand-section">
          <div className="brand-logo">
            O
          </div>

          <h1>OpsFlow</h1>

          <h2>
            Mini ERP + CRM
            <br />
            Operations Portal
          </h2>

          <p className="brand-text">
            Manage customers, products, inventory and
            sales operations in one place.
          </p>

          <div className="features">

            <div className="feature">
              <span>✓</span>
              <p>Customer Management</p>
            </div>

            <div className="feature">
              <span>✓</span>
              <p>Product & Inventory Management</p>
            </div>

            <div className="feature">
              <span>✓</span>
              <p>Sales Order Management</p>
            </div>

            <div className="feature">
              <span>✓</span>
              <p>Business Operations Dashboard</p>
            </div>

          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="login-section">

          <div className="login-card">

            <div className="mobile-logo">
              O
            </div>

            <h2>Welcome back</h2>

            <p className="login-subtitle">
              Sign in to continue to your OpsFlow account
            </p>

            <form onSubmit={handleSubmit}>

              <div className="form-group">
                <label htmlFor="email">
                  Email Address
                </label>

                <input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">
                  Password
                </label>

                <input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  required
                />
              </div>

              <div className="login-options">

                <label className="remember">
                  <input type="checkbox" />
                  <span>Remember me</span>
                </label>

                <button
                  type="button"
                  className="forgot-button"
                  onClick={() =>
                    setMessage(
                      "Please contact the administrator to reset your password."
                    )
                  }
                >
                  Forgot password?
                </button>

              </div>

              <button
                type="submit"
                className="sign-in-button"
              >
                Sign In
              </button>

              {message && (
                <div className="message">
                  {message}
                </div>
              )}

            </form>

            <div className="divider">
              <span>Secure Operations Portal</span>
            </div>

            <p className="login-footer">
              OpsFlow © 2026
            </p>

          </div>

        </div>

      </div>
    </div>
  );
}

export default Login;