// React hook for managing component state
import { useState } from "react";

// Import login function from our Service 
// This function handles the API call to FastAPI backend
import { loginUser } from "../services/authService";
//Router link for navigation
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";

import "./Login.css";

function Login() {

  const navigate = useNavigate();

  // Local state for form inputs
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");


  // Handle Login Form Submit
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent page refresh

    try {
      // Call backend through Service Layer
      const data = await loginUser({ email, password });

      // Save JWT token in browser localStorage
      // This allows authenticated requests later
      localStorage.setItem("token", data.access_token);

      console.log("Login successful:", data);
      navigate("/dashboard");

      // TODO (Future):
      // Redirect to Dashboard after login
      // or update global auth state

    } catch (error) {
      console.error(
        "Login error:",
        error.response?.data || error.message
      );

      alert("Login failed");
    }
  };


  // Simple login form UI (temporarl for testing purpose)
  return (
    <div className="login-container">
      <h2>Login</h2>

      {/* 
        redesign this form visually.
        Logic is already connected to backend.
      */}
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button type="submit">Login</button>

        <p style={{ marginTop: "15px", textAlign: "center" }}>
          Don't have an account?{" "}
          <Link to="/signup">Create one</Link>
        </p>  
      </form>

    </div>
  );
}

export default Login;