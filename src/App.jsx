import { Navigate, Route, Routes } from "react-router";
import Header from "./components/Header";
import Navbar from "./components/Navbar";
import HeroCarousel from "./components/HeroCarousel";
import FeaturedProducts from "./components/FeaturedProducts";
import ProductCatalog from "./components/ProductCatalog";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import ProductDetail from "./pages/ProductDetail";
import PcBuilder from "./pages/PcBuilder";
import SearchResults from "./pages/SearchResults";
import { isAdminAuthenticated } from "./services/adminSession";
import "./App.css";

function StoreHome() {
  return (
    <>
      <Header />
      <Navbar />

      <main className="page">
        <HeroCarousel />
        <FeaturedProducts />
      </main>
    </>
  );
}

function ProductsPage() {
  return (
    <>
      <Header />
      <Navbar />

      <main className="page">
        <ProductCatalog searchTerm="" />
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

      <Route path="/productos" element={<ProductsPage />} />

      <Route path="/productos/:id" element={<ProductDetail />} />

      <Route path="/armar-pc" element={<PcBuilder />} />

      <Route path="/buscar" element={<SearchResults />} />

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
