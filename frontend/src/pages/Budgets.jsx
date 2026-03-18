import useAuth from "../hooks/useAuth";

function Budgets() {
  const { logout } = useAuth();

  return (
    <div style={{ padding: "24px" }}>
      <h1>Budgets</h1>
      <p>Protected budgets page.</p>
      <button onClick={() => logout()}>Logout</button>
    </div>
  );
}

export default Budgets;
