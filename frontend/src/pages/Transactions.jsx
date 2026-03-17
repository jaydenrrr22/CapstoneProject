import useAuth from "../hooks/useAuth";

function Transactions() {
  const { logout } = useAuth();

  return (
    <div style={{ padding: "24px" }}>
      <h1>Transactions</h1>
      <p>Protected transactions page.</p>
      <button onClick={() => logout()}>Logout</button>
    </div>
  );
}

export default Transactions;
