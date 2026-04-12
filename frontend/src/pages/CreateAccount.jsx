import { useState } from "react";
import "./Login.css";
import { loginUser, registerUser } from "../services/authService";
import { Link, useNavigate } from "react-router-dom";
import traceHeaderLogo from "../assets/trace_logo_1.png";
import { normalizeApiError } from "../utils/normalizeApiError";
import useDemoMode from "../hooks/useDemoMode";
import useAuth from "../hooks/useAuth";

function CreateAccount() {
  const navigate = useNavigate();
  const { startDemo } = useDemoMode();
  const { login } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const hasMinLength = password.length >= 8;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /\d/.test(password);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!acceptedTerms) {
      setErrorMessage("You must accept the Terms and Privacy Policy to create an account.");
      return;
    }

    setErrorMessage("");
    setSubmitting(true);

    try {
      await registerUser({
        name,
        email,
        password,
      });

      const authData = await loginUser({
        email,
        password,
      });

      login(authData.access_token);
      navigate("/dashboard", { replace: true });
    } catch (error) {
      console.error(
        "Registration error:",
        error.response?.data || error.message
      );
      setErrorMessage(
        normalizeApiError(error, "Account creation failed. Try a different email.")
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-container">
      <div className="auth-stack">
        <img className="trace-logo" src={traceHeaderLogo} alt="Trace" />

        <h2 className="auth-title-card">Create Account</h2>

        <form className="auth-form-card" onSubmit={handleSubmit}>
          <input
            id="signup-name"
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <input
            id="signup-email"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <div className="password-input-wrap">
            <input
              id="signup-password"
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
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

          <ul className="password-rules" aria-label="Password requirements">
            <li className={hasMinLength ? "met" : ""}>At least 8 characters</li>
            <li className={hasLetter ? "met" : ""}>Contains a letter</li>
            <li className={hasNumber ? "met" : ""}>Contains a number</li>
          </ul>

          <label className="auth-check-row" htmlFor="accept-terms">
            <input
              id="accept-terms"
              type="checkbox"
              checked={acceptedTerms}
              onChange={(event) => setAcceptedTerms(event.target.checked)}
            />
            <span>I agree to the Terms and Privacy Policy</span>
          </label>

          {errorMessage && <p className="auth-error-text">{errorMessage}</p>}

          <button type="submit" disabled={submitting}>
            {submitting ? "Creating account..." : "Create Account"}
          </button>

          <p className="auth-switch-text">
            Already have an account? <Link to="/login">Login</Link>
          </p>
        </form>

        <div className="auth-demo-panel">
          <p className="auth-demo-label">Need a guided walkthrough first?</p>
          <button
            type="button"
            className="auth-demo-button"
            onClick={() => {
              startDemo();
              navigate("/dashboard", { replace: true });
            }}
          >
            Start Demo
          </button>
        </div>
      </div>
    </div>
  );
}

export default CreateAccount;
