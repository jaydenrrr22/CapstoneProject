import { useEffect, useState } from "react";
import { loginUser } from "../services/authService";
import { Link, useNavigate, useLocation } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import useDemoMode from "../hooks/useDemoMode";
import traceHeaderLogo from "../assets/trace_header.png";
import { normalizeApiError } from "../utils/normalizeApiError";
import "./Login.css";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { needsModeSelection } = useDemoMode();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [rememberEmail, setRememberEmail] = useState(true);
  const [capsLockOn, setCapsLockOn] = useState(false);

  useEffect(() => {
    const remembered = window.localStorage.getItem("trace.rememberedEmail");
    if (remembered) {
      setEmail(remembered);
      setRememberEmail(true);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSubmitting(true);

    try {
      const data = await loginUser({ email, password });

      if (rememberEmail) {
        window.localStorage.setItem("trace.rememberedEmail", email.trim());
      } else {
        window.localStorage.removeItem("trace.rememberedEmail");
      }

      // Save token using Auth context
      login(data.access_token);

      console.log("Login successful:", data);

      const destination = needsModeSelection
        ? "/mode-select"
        : location.state?.from?.pathname || "/dashboard";
      navigate(destination, { replace: true });

    } catch (error) {
      console.error(
        "Login error:",
        error.response?.data || error.message
      );

      setErrorMessage(
        normalizeApiError(error, "Login failed. Please check your email and password.")
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-container">
      <div className="auth-stack">
        <img className="trace-logo" src={traceHeaderLogo} alt="Trace" />

        <h2 className="auth-title-card">Login</h2>

        <form className="auth-form-card" onSubmit={handleSubmit}>
          <input
            id="login-email"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <div className="password-input-wrap">
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyUp={(event) => setCapsLockOn(event.getModifierState("CapsLock"))}
              onBlur={() => setCapsLockOn(false)}
              required
            />
            <button
              type="button"
              className="password-toggle-btn"
              onClick={() => setShowPassword((prev) => !prev)}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>

          {capsLockOn && <p className="auth-warning-text">Caps Lock is on.</p>}

          <label className="auth-check-row">
            <input
              type="checkbox"
              checked={rememberEmail}
              onChange={(e) => setRememberEmail(e.target.checked)}
            />
            <span>Remember email on this device</span>
          </label>

          {errorMessage && <p className="auth-error-text">{errorMessage}</p>}

          <button type="submit" disabled={submitting}>
            {submitting ? "Signing in..." : "Login"}
          </button>

          <p className="auth-switch-text">
            Don't have an account? <Link to="/signup">Create one</Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default Login;
