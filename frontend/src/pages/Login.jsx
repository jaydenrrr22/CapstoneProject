// React hook for managing component state
import { useState } from "react";

// Import login function from our Service 
// This function handles the API call to FastAPI backend
import { loginUser } from "../services/authService";
//Router link for navigation
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import traceHeaderLogo from "../assets/trace_header.png";


import "./Login.css";

function Login() {

  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  // Local state for form inputs
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");


  // Handle Login Form Submit
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent page refresh
    setErrorMessage("");
    setSubmitting(true);

    try {
      // Call backend through Service Layer
      const data = await loginUser({ email, password });

      // Save JWT token in browser localStorage
      // This allows authenticated requests later
      login(data.access_token);

      console.log("Login successful:", data);
      const destination = location.state?.from?.pathname || "/dashboard";
      navigate(destination, { replace: true });

      // TODO (Future):
      // Redirect to Dashboard after login
      // or update global auth state

    } catch (error) {
      console.error(
        "Login error:",
        error.response?.data || error.message
      );

      const backendDetail = error?.response?.data?.detail;
      setErrorMessage(backendDetail || "Login failed. Please check your email and password.");
    } finally {
      setSubmitting(false);
    }
  };


  // Simple login form UI (temporarl for testing purpose)
  return (
    <div className="login-container">
      <div className="auth-stack">
        <img className="trace-logo" src={traceHeaderLogo} alt="Trace" />

        <h2 className="auth-title-card">Login</h2>

        <form className="auth-form-card" onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <div className="password-input-wrap">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="password-toggle-btn"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>

          {errorMessage && <p className="auth-error-text">{errorMessage}</p>}

          <button type="submit" disabled={submitting}>
            {submitting ? "Signing in..." : "Login"}
          </button>

          <p className="auth-switch-text">
            Don't have an account?{" "}
            <Link to="/signup">Create one</Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default Login;