import { useState } from "react";
import "./Login.css";
import { loginUser, registerUser } from "../services/authService";
import { Link, useNavigate } from "react-router-dom";
import traceHeaderLogo from "../assets/trace_Logo_1.png";
import { normalizeApiError } from "../utils/normalizeApiError";
import useDemoMode from "../hooks/useDemoMode";
import useAuth from "../hooks/useAuth";

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim());
}

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
  const [emailTouched, setEmailTouched] = useState(false);
  const [emailError, setEmailError] = useState("");

  const hasMinLength = password.length >= 8;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasValidEmail = isValidEmail(email);
  const canSubmit = hasMinLength && hasLetter && hasNumber && hasValidEmail && acceptedTerms && !submitting;

  const validateEmailField = () => {
    if (!email.trim()) {
      setEmailError("Email is required.");
      return false;
    }

    if (!hasValidEmail) {
      setEmailError("Enter a valid email address.");
      return false;
    }

    setEmailError("");
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setEmailTouched(true);

    const emailIsValid = validateEmailField();

    if (!emailIsValid) {
      return;
    }

    if (!acceptedTerms) {
      setErrorMessage("You must accept the Terms and Privacy Policy to create an account.");
      return;
    }

    if (!(hasMinLength && hasLetter && hasNumber)) {
      setErrorMessage("Your password must meet all listed requirements.");
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
            onChange={(e) => {
              const nextValue = e.target.value;
              setEmail(nextValue);

              if (emailTouched) {
                if (!nextValue.trim()) {
                  setEmailError("Email is required.");
                } else if (!isValidEmail(nextValue)) {
                  setEmailError("Enter a valid email address.");
                } else {
                  setEmailError("");
                }
              }
            }}
            onBlur={() => {
              setEmailTouched(true);
              validateEmailField();
            }}
            required
          />
          {emailTouched && emailError ? <p className="auth-inline-error">{emailError}</p> : null}

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
            <li className={hasMinLength ? "requirement--met" : ""}>At least 8 characters</li>
            <li className={hasLetter ? "requirement--met" : ""}>Contains a letter</li>
            <li className={hasNumber ? "requirement--met" : ""}>Contains a number</li>
          </ul>

          <label className="auth-check-row" htmlFor="accept-terms">
            <input
              id="accept-terms"
              type="checkbox"
              checked={acceptedTerms}
              onChange={(event) => {
                setAcceptedTerms(event.target.checked);
                if (event.target.checked) {
                  setErrorMessage("");
                }
              }}
            />
            <span>
              I agree to the <Link to="/legal/terms">Terms</Link> and <Link to="/legal/privacy">Privacy Policy</Link>
            </span>
          </label>

          {errorMessage && <p className="auth-error-text">{errorMessage}</p>}

          <button type="submit" disabled={!canSubmit}>
            {submitting ? (
              <span className="auth-submit-state">
                <span className="auth-submit-spinner" aria-hidden="true" />
                <span>Creating account...</span>
              </span>
            ) : "Create Account"}
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

