import { useState } from "react";
import { Navigate, Route, Routes } from "react-router";
import Header from "./components/Header";
import Navbar from "./components/Navbar";
import HeroCarousel from "./components/HeroCarousel";
import ProductCatalog from "./components/ProductCatalog";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import { isAdminAuthenticated } from "./services/adminSession";
import "./App.css";

function StoreHome() {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <>
      <Header
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />

      <Navbar />

      <main className="page">
        <HeroCarousel />

        <ProductCatalog searchTerm={searchTerm} />
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