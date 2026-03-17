import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import CreateAccount from "./pages/CreateAccount";
import Dashboard from "./pages/Dashboard";
import TransactionPage from "./pages/transaction";

function App() {

  return (
    <BrowserRouter>

      <Routes>

        {/* Default route */}
        <Route path="/" element={<Login />} />

        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<CreateAccount />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/transaction" element={<TransactionPage />} />

      </Routes>

    </BrowserRouter>
  );
}

export default App;