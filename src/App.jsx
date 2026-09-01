import { Navigate, Route, Routes } from "react-router";
import Header from "./components/Header";
import Navbar from "./components/Navbar";
import HeroCarousel from "./components/HeroCarousel";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import { isAdminAuthenticated } from "./services/adminSession";
import "./App.css";

function StoreHome() {
  return (
    <>
      <Header />
      <Navbar />

      <main className="page">
        <HeroCarousel />

        <section id="productos" className="products-placeholder">
          <h2>Productos destacados</h2>
          <p>Próximamente agregaremos aquí el catálogo de productos.</p>
        </section>
      </main>
    </>
  );
}

function ProtectedAdminRoute({ children }) {
  if (!isAdminAuthenticated()) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<StoreHome />} />

      <Route path="/admin/login" element={<AdminLogin />} />

      <Route
        path="/admin"
        element={
          <ProtectedAdminRoute>
            <AdminDashboard />
          </ProtectedAdminRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;