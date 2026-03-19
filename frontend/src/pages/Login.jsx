import { useState } from "react";
import { loginUser } from "../services/authService";
import { Link, useNavigate } from "react-router-dom";
import "./Login.css";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Handle login form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Call auth service (token is stored inside the service)
      await loginUser({ email, password });

      console.log("Login successful");

      // Redirect user to dashboard after successful login
      navigate("/dashboard");

    } catch (error) {
      console.error(
        "Login error:",
        error.response?.data || error.message
      );

      alert("Login failed");
    }
  };

  return (
    <div className="login-container">
      <h2>Login</h2>

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