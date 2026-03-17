import useAuth from "../hooks/useAuth";

function Subscriptions() {
  const { logout } = useAuth();

  return (
    <div style={{ padding: "24px" }}>
      <h1>Subscriptions</h1>
      <p>Protected subscriptions page.</p>
      <button onClick={() => logout()}>Logout</button>
    </div>
  );
}

export default Subscriptions;
