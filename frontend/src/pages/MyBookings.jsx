import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";
import { quantityLabel, rupees } from "../constants.js";

export const STATUS_TEXT = {
  pending: "Waiting for provider",
  accepted: "Accepted",
  rejected: "Rejected",
  completed: "Completed",
  cancelled: "Cancelled",
};

export default function MyBookings() {
  const [bookings, setBookings] = useState(null);
  const [error, setError] = useState("");

  const load = () => api("/bookings/mine").then(setBookings).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);

  async function cancel(id) {
    try {
      await api(`/bookings/${id}/status`, { method: "PATCH", body: { status: "cancelled" } });
      load();
    } catch (e) {
      setError(e.message);
    }
  }

  if (!bookings) return error ? <p className="error">{error}</p> : <p className="muted">Loading…</p>;

  return (
    <>
      <h1>My bookings</h1>
      {error && <p className="error">{error}</p>}
      {bookings.length === 0 && (
        <p className="muted">You have no bookings yet. <Link to="/">Browse services</Link> to send your first request.</p>
      )}
      <div className="list">
        {bookings.map((b) => (
          <article className="card row" key={b.id}>
            <div>
              <h3>{b.service_title}</h3>
              <p className="muted">
                {b.work_date} · {b.quantity} {quantityLabel(b.unit).toLowerCase()} · about {rupees(b.estimated_cost)}
              </p>
              <p className="muted">Provider: {b.provider_name} · {b.provider_phone}</p>
              {b.notes && <p>“{b.notes}”</p>}
            </div>
            <div className="side">
              <span className={`status ${b.status}`}>{STATUS_TEXT[b.status]}</span>
              {(b.status === "pending" || b.status === "accepted") && (
                <button className="btn small ghost" onClick={() => cancel(b.id)}>Cancel booking</button>
              )}
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
