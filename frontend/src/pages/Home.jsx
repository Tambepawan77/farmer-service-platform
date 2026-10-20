import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";
import { CATEGORIES, rupees } from "../constants.js";

export default function Home() {
  const [services, setServices] = useState([]);
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (category) params.set("category", category);
    // small delay so we don't call the server on every keystroke
    const timer = setTimeout(() => {
      api(`/services?${params}`)
        .then((data) => { setServices(data); setError(""); })
        .catch((e) => setError(e.message))
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(timer);
  }, [q, category]);

  return (
    <>
      <section className="hero">
        <h1>Find the farm help you need, at a rate you can see.</h1>
        <p>Tractors, harvesting, spraying, labour and more from local service providers. Compare rates and send a booking request.</p>
        <input
          className="search"
          placeholder="Search by service or place, e.g. tractor, Vaijapur"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </section>

      <div className="chips">
        <button className={category === "" ? "chip active" : "chip"} onClick={() => setCategory("")}>All</button>
        {CATEGORIES.map((c) => (
          <button key={c} className={category === c ? "chip active" : "chip"} onClick={() => setCategory(c)}>
            {c}
          </button>
        ))}
      </div>

      {error && <p className="error">{error}</p>}
      {loading && <p className="muted">Loading services…</p>}
      {!loading && !error && services.length === 0 && (
        <p className="muted">No services match your search. Try another word or category.</p>
      )}

      <div className="grid">
        {services.map((s) => (
          <Link to={`/services/${s.id}`} key={s.id} className="card service">
            <span className="tag">{s.category}</span>
            <h3>{s.title}</h3>
            <p className="price">{rupees(s.price)} <small>{s.unit}</small></p>
            <p className="muted">{s.location} · {s.provider_name}</p>
          </Link>
        ))}
      </div>
    </>
  );
}
