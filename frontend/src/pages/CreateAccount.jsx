import { useState } from "react";
import "./Login.css";

// Import Create Account function from our Service 
// This function handles the API call to FastAPI backend
import { registerUser  } from "../services/authService";

//Route link for navigation
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";

function CreateAccount() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
        await registerUser({ 
            name, email, password 
        });
        alert("Account created successfully!");
        navigate("/login", { replace: true });
    } catch (error) {
        console.error(
            "Registration error:",
            error.response?.data || error.message
        );
        alert("Account creation failed");
    }
    
  };

  return (
    <div className="login-container">

      <h2>Create Account</h2>

      <form onSubmit={handleSubmit}>

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

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button type="submit">Create Account</button>

      </form>

      <p style={{ marginTop: "15px", textAlign: "center" }}>
        Already have an account?{" "}
        <Link to="/login">Login</Link>
      </p>

    </div>
  );
}

export default CreateAccount;