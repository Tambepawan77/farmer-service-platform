import { useEffect, useState } from "react";
import { api } from "../api.js";
import { CATEGORIES, UNITS, quantityLabel, rupees } from "../constants.js";
import { STATUS_TEXT } from "./MyBookings.jsx";

const EMPTY = { title: "", category: CATEGORIES[0], description: "", price: "", unit: UNITS[0], location: "" };

export default function Dashboard() {
  const [services, setServices] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  async function load() {
    try {
      setServices(await api("/services/mine"));
      setBookings(await api("/bookings/incoming"));
    } catch (e) {
      setError(e.message);
    }
  }
  useEffect(() => { load(); }, []);

  // Runs an API call, then refreshes the lists.
  async function run(call) {
    setError("");
    try { await call(); await load(); } catch (e) { setError(e.message); }
  }

  const addService = (e) => {
    e.preventDefault();
    run(async () => {
      await api("/services", { method: "POST", body: { ...form, price: Number(form.price) } });
      setForm(EMPTY);
    });
  };
  const toggle = (s) => run(() => api(`/services/${s.id}`, { method: "PATCH", body: { available: !s.available } }));
  const remove = (s) => window.confirm(`Delete "${s.title}"?`) && run(() => api(`/services/${s.id}`, { method: "DELETE" }));
  const setStatus = (id, status) => run(() => api(`/bookings/${id}/status`, { method: "PATCH", body: { status } }));

  const pending = bookings.filter((b) => b.status === "pending").length;

  return (
    <>
      <h1>Provider dashboard</h1>
      {error && <p className="error">{error}</p>}

      <h2>Booking requests {pending > 0 && <span className="badge">{pending} new</span>}</h2>
      {bookings.length === 0 && <p className="muted">No requests yet. They will appear here when a farmer books one of your services.</p>}
      <div className="list">
        {bookings.map((b) => (
          <article className="card row" key={b.id}>
            <div>
              <h3>{b.service_title}</h3>
              <p className="muted">
                {b.work_date} · {b.quantity} {quantityLabel(b.unit).toLowerCase()} · about {rupees(b.estimated_cost)}
              </p>
              <p className="muted">Farmer: {b.farmer_name} ({b.farmer_village || "village not given"}) · {b.farmer_phone}</p>
              {b.notes && <p>“{b.notes}”</p>}
            </div>
            <div className="side">
              <span className={`status ${b.status}`}>{STATUS_TEXT[b.status]}</span>
              {b.status === "pending" && (
                <div className="btn-row">
                  <button className="btn small" onClick={() => setStatus(b.id, "accepted")}>Accept</button>
                  <button className="btn small ghost" onClick={() => setStatus(b.id, "rejected")}>Reject</button>
                </div>
              )}
              {b.status === "accepted" && (
                <button className="btn small" onClick={() => setStatus(b.id, "completed")}>Mark completed</button>
              )}
            </div>
          </article>
        ))}
      </div>

      <h2>My services</h2>
      <div className="two-col">
        <form className="card" onSubmit={addService}>
          <h3>Add a service</h3>
          <label>Service name<input required value={form.title} onChange={set("title")} placeholder="e.g. Tractor with rotavator" /></label>
          <label>Category
            <select value={form.category} onChange={set("category")}>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </label>
          <div className="pair">
            <label>Rate (₹)<input type="number" min="1" required value={form.price} onChange={set("price")} /></label>
            <label>Charged
              <select value={form.unit} onChange={set("unit")}>
                {UNITS.map((u) => <option key={u}>{u}</option>)}
              </select>
            </label>
          </div>
          <label>Place you serve<input required value={form.location} onChange={set("location")} placeholder="Village or town" /></label>
          <label>Details (optional)<textarea rows="3" value={form.description} onChange={set("description")} /></label>
          <button className="btn">Add service</button>
        </form>

        <div className="list">
          {services.length === 0 && <p className="muted">You have not added any service yet.</p>}
          {services.map((s) => (
            <article className="card row" key={s.id}>
              <div>
                <h3>{s.title}</h3>
                <p className="muted">{rupees(s.price)} {s.unit} · {s.location}</p>
                <span className={s.available ? "status accepted" : "status cancelled"}>{s.available ? "Visible to farmers" : "Hidden"}</span>
              </div>
              <div className="side">
                <button className="btn small ghost" onClick={() => toggle(s)}>{s.available ? "Hide" : "Show"}</button>
                <button className="btn small danger" onClick={() => remove(s)}>Delete</button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </>
  );
}
