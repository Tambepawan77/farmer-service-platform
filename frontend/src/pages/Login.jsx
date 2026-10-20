import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth.jsx";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    setError("");
    try {
      const user = await login(form.email, form.password);
      navigate(user.role === "provider" ? "/dashboard" : "/");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <form className="card narrow" onSubmit={submit}>
      <h1>Log in</h1>
      <label>Email
        <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
      </label>
      <label>Password
        <input type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
      </label>
      {error && <p className="error">{error}</p>}
      <button className="btn">Log in</button>
      <p className="muted">New here? <Link to="/register">Create an account</Link></p>
      <p className="muted small-text">Demo: farmer@demo.com or provider@demo.com, password demo1234</p>
    </form>
  );
}
