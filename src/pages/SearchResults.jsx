import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { PackageSearch } from "lucide-react";
import Header from "../components/Header";
import Navbar from "../components/Navbar";
import { apiRequest } from "../services/api";
import "./SearchResults.css";

const moneyFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

export default function SearchResults() {
  const [searchParams] = useSearchParams();
  const searchTerm = searchParams.get("q") || "";

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [availability, setAvailability] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let componentIsMounted = true;

    async function loadResults() {
      try {
        const [loadedProducts, loadedCategories] = await Promise.all([
          apiRequest("/products"),
          apiRequest("/categories"),
        ]);

        if (!componentIsMounted) return;

        setProducts(loadedProducts);
        setCategories(loadedCategories);
        setStatus("ready");
      } catch {
        if (componentIsMounted) {
          setStatus("error");
        }
      }
    }

    loadResults();

    return () => {
      componentIsMounted = false;
    };
  }, []);

  const results = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    const filtered = products.filter((product) => {
      const matchesSearch =
        !normalizedSearch ||
        product.name.toLowerCase().includes(normalizedSearch) ||
        product.category.toLowerCase().includes(normalizedSearch);

      const matchesCategory =
        !selectedCategory || product.category === selectedCategory;

      const matchesAvailability =
        availability === "all" ||
        (availability === "in-stock" && Number(product.stock) > 0);

      return matchesSearch && matchesCategory && matchesAvailability;
    });

    return [...filtered].sort((firstProduct, secondProduct) => {
      if (sortBy === "price-low") {
        return Number(firstProduct.price) - Number(secondProduct.price);
      }

      if (sortBy === "price-high") {
        return Number(secondProduct.price) - Number(firstProduct.price);
      }

      return Number(secondProduct.id) - Number(firstProduct.id);
    });
  }, [products, searchTerm, selectedCategory, availability, sortBy]);

  function clearFilters() {
    setSelectedCategory("");
    setAvailability("all");
    setSortBy("newest");
  }

  return (
    <>
      <Header />
      <Navbar />

      <main className="search-results-page">
        <section className="search-results">
          <span>RESULTADOS DE BÚSQUEDA</span>

          <h1>
            {searchTerm
              ? `Resultados para “${searchTerm}”`
              : "Buscá tu próximo componente"}
          </h1>

          <p>
            {status === "ready"
              ? `${results.length} producto${
                  results.length === 1 ? "" : "s"
                } encontrado${results.length === 1 ? "" : "s"}`
              : "Cargando productos..."}
          </p>

          <div className="search-results__filters">
            <label>
              Categoría

              <select
                value={selectedCategory}
                onChange={(event) => setSelectedCategory(event.target.value)}
              >
                <option value="">Todas las categorías</option>

                {categories.map((category) => (
                  <option key={category.id} value={category.name}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Disponibilidad

              <select
                value={availability}
                onChange={(event) => setAvailability(event.target.value)}
              >
                <option value="all">Todos los productos</option>
                <option value="in-stock">Con stock disponible</option>
              </select>
            </label>

            <label>
              Ordenar por

              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
              >
                <option value="newest">Más recientes</option>
                <option value="price-low">Menor precio</option>
                <option value="price-high">Mayor precio</option>
              </select>
            </label>

            <button type="button" onClick={clearFilters}>
              Limpiar filtros
            </button>
          </div>

          {status === "error" && (
            <div className="search-results__empty">
              No se pudo cargar el catálogo.
            </div>
          )}

          {status === "ready" && results.length === 0 && (
            <div className="search-results__empty">
              <PackageSearch size={38} />
              <strong>No encontramos productos con esa búsqueda.</strong>
              <span>Probá con otro nombre o categoría.</span>
            </div>
          )}

          {status === "ready" && results.length > 0 && (
            <div className="search-results__grid">
              {results.map((product) => {
                const hasStock = Number(product.stock) > 0;

                return (
                  <Link
                    key={product.id}
                    to={`/productos/${product.id}`}
                    className="search-result-card"
                  >
                    <div className="search-result-card__image">
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt={product.name} />
                      ) : (
                        <PackageSearch size={34} />
                      )}
                    </div>

                    <div>
                      <span>{product.category}</span>
                      <h2>{product.name}</h2>
                      <strong>
                        {moneyFormatter.format(Number(product.price))}
                      </strong>

                      <small className={hasStock ? "is-available" : "is-unavailable"}>
                        {hasStock ? "Stock disponible" : "Sin stock"}
                      </small>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </>
  );
}