import { Link, NavLink, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { useAuth } from "./auth.jsx";
import Home from "./pages/Home.jsx";
import ServiceDetail from "./pages/ServiceDetail.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import MyBookings from "./pages/MyBookings.jsx";
import Dashboard from "./pages/Dashboard.jsx";

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="nav">
      <div className="container nav-inner">
        <Link to="/" className="brand">Farmer Service Platform</Link>
        <nav>
          <NavLink to="/">Services</NavLink>
          {user?.role === "farmer" && <NavLink to="/my-bookings">My bookings</NavLink>}
          {user?.role === "provider" && <NavLink to="/dashboard">My dashboard</NavLink>}
          {user ? (
            <>
              <span className="who">{user.name}</span>
              <button className="btn small ghost" onClick={() => { logout(); navigate("/"); }}>
                Log out
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login">Log in</NavLink>
              <Link to="/register" className="btn small">Sign up</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

// Only lets a logged-in user with the right role open a page.
function Protected({ role, children }) {
  const { user, loading } = useAuth();
  if (loading) return <p className="container muted">Loading…</p>;
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <>
      <Navbar />
      <main className="container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/services/:id" element={<ServiceDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/my-bookings" element={<Protected role="farmer"><MyBookings /></Protected>} />
          <Route path="/dashboard" element={<Protected role="provider"><Dashboard /></Protected>} />
          <Route path="*" element={<p>Page not found.</p>} />
        </Routes>
      </main>
    </>
  );
}
