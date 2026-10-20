import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api.js";
import { useAuth } from "../auth.jsx";
import { quantityLabel, rupees } from "../constants.js";

export default function ServiceDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [service, setService] = useState(null);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ work_date: "", quantity: 1, notes: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api(`/services/${id}`).then(setService).catch((e) => setError(e.message));
  }, [id]);

  async function submit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await api("/bookings", {
        method: "POST",
        body: { service_id: service.id, work_date: form.work_date, quantity: Number(form.quantity), notes: form.notes },
      });
      navigate("/my-bookings");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (error && !service) return <p className="error">{error}</p>;
  if (!service) return <p className="muted">Loading…</p>;

  const today = new Date().toISOString().split("T")[0];
  const estimate = service.price * (Number(form.quantity) || 0);

  return (
    <div className="two-col">
      <section className="card">
        <span className="tag">{service.category}</span>
        <h1>{service.title}</h1>
        <p className="price big">{rupees(service.price)} <small>{service.unit}</small></p>
        <p>{service.description || "No description added."}</p>
        <dl className="facts">
          <dt>Place</dt><dd>{service.location}</dd>
          <dt>Provider</dt><dd>{service.provider_name}</dd>
          <dt>Phone</dt><dd>{service.provider_phone}</dd>
        </dl>
      </section>

      <section className="card">
        <h2>Request this service</h2>
        {!user && (
          <p>Please <Link to="/login">log in</Link> or <Link to="/register">sign up as a farmer</Link> to send a booking request.</p>
        )}
        {user?.role === "provider" && <p className="muted">You are logged in as a service provider. Only farmers can book services.</p>}
        {user?.role === "farmer" && (
          <form onSubmit={submit}>
            <label>Date you need the service
              <input type="date" min={today} required value={form.work_date}
                onChange={(e) => setForm({ ...form, work_date: e.target.value })} />
            </label>
            <label>{quantityLabel(service.unit)} needed
              <input type="number" min="0.5" step="0.5" required value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
            </label>
            <label>Notes for the provider (optional)
              <textarea rows="3" placeholder="Where is the farm? Any special need?" value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </label>
            <p className="estimate">Estimated cost: <strong>{rupees(estimate)}</strong></p>
            {error && <p className="error">{error}</p>}
            <button className="btn" disabled={submitting}>{submitting ? "Sending…" : "Send booking request"}</button>
          </form>
        )}
      </section>
    </div>
  );
}
