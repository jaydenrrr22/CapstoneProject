import { useState } from "react";
import "./Login.css";

// Import Create Account function from our Service 
// This function handles the API call to FastAPI backend
import { registerUser  } from "../services/authService";

//Route link for navigation
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import traceHeaderLogo from "../assets/trace_header.png";

function CreateAccount() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSubmitting(true);

    try {
        await registerUser({ 
            name, email, password 
        });
        navigate("/login", { replace: true });
    } catch (error) {
        console.error(
            "Registration error:",
            error.response?.data || error.message
        );
      const backendDetail = error?.response?.data?.detail;
      setErrorMessage(backendDetail || "Account creation failed. Try a different email.");
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
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

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

          {errorMessage && <p className="auth-error-text">{errorMessage}</p>}

          <button type="submit" disabled={submitting}>
            {submitting ? "Creating account..." : "Create Account"}
          </button>

          <p className="auth-switch-text">
            Already have an account?{" "}
            <Link to="/login">Login</Link>
          </p>
        </form>

      </div>
    </div>
  );
}

export default CreateAccount;