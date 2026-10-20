import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth.jsx";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ role: "farmer", name: "", email: "", phone: "", village: "", password: "" });
  const [error, setError] = useState("");
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setError("");
    try {
      const user = await register(form);
      navigate(user.role === "provider" ? "/dashboard" : "/");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <form className="card narrow" onSubmit={submit}>
      <h1>Create your account</h1>
      <div className="role-pick">
        <label className={form.role === "farmer" ? "role active" : "role"}>
          <input type="radio" name="role" checked={form.role === "farmer"} onChange={() => setForm({ ...form, role: "farmer" })} />
          I am a farmer
          <small>I want to book services</small>
        </label>
        <label className={form.role === "provider" ? "role active" : "role"}>
          <input type="radio" name="role" checked={form.role === "provider"} onChange={() => setForm({ ...form, role: "provider" })} />
          I provide services
          <small>I have a tractor, labour, etc.</small>
        </label>
      </div>
      <label>Full name<input required value={form.name} onChange={set("name")} /></label>
      <label>Email<input type="email" required value={form.email} onChange={set("email")} /></label>
      <label>Phone number<input required minLength="10" maxLength="15" value={form.phone} onChange={set("phone")} /></label>
      <label>Village / town<input value={form.village} onChange={set("village")} /></label>
      <label>Password (at least 6 characters)<input type="password" required minLength="6" value={form.password} onChange={set("password")} /></label>
      {error && <p className="error">{error}</p>}
      <button className="btn">Sign up</button>
      <p className="muted">Already registered? <Link to="/login">Log in</Link></p>
    </form>
  );
}
