import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { PackageSearch, SlidersHorizontal } from "lucide-react";
import { apiRequest } from "../services/api";
import "./ProductCatalog.css";

const moneyFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

export default function ProductCatalog({ searchTerm }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [availability, setAvailability] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let componentIsMounted = true;

    async function loadCatalog() {
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

    loadCatalog();

    return () => {
      componentIsMounted = false;
    };
  }, []);

  const visibleProducts = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    const filtered = products.filter((product) => {
      const matchesSearch =
        !normalizedSearch ||
        product.name.toLowerCase().includes(normalizedSearch) ||
        product.category.toLowerCase().includes(normalizedSearch) ||
        product.description.toLowerCase().includes(normalizedSearch);

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

  const hasActiveFilters =
    searchTerm ||
    selectedCategory ||
    availability !== "all" ||
    sortBy !== "newest";

  function clearFilters() {
    setSelectedCategory("");
    setAvailability("all");
    setSortBy("newest");
  }

  return (
    <section id="productos" className="store-catalog">
      <div className="store-catalog__heading">
        <div>
          <span>CATÁLOGO</span>
          <h2>Encontrá tu próximo componente</h2>

          <p>
            {status === "ready"
              ? `${visibleProducts.length} producto${
                  visibleProducts.length === 1 ? "" : "s"
                } encontrado${visibleProducts.length === 1 ? "" : "s"}`
              : "Cargando productos..."}
          </p>
        </div>

        <SlidersHorizontal size={25} />
      </div>

      <div className="store-catalog__filters">
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

        {hasActiveFilters && (
          <button
            type="button"
            className="store-catalog__clear-button"
            onClick={clearFilters}
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {status === "loading" && (
        <div className="store-catalog__empty">Cargando catálogo...</div>
      )}

      {status === "error" && (
        <div className="store-catalog__empty">
          No se pudo cargar el catálogo. Verificá que el servidor esté iniciado.
        </div>
      )}

      {status === "ready" && visibleProducts.length === 0 && (
        <div className="store-catalog__empty">
          <PackageSearch size={34} />
          <strong>No encontramos productos con esos filtros.</strong>
          <span>Probá otra categoría o limpiá los filtros.</span>
        </div>
      )}

      {status === "ready" && visibleProducts.length > 0 && (
        <div className="store-catalog__grid">
          {visibleProducts.map((product) => {
            const hasStock = Number(product.stock) > 0;

            return (
              <Link
                key={product.id}
                to={`/productos/${product.id}`}
                className={`store-product-card ${
                  !hasStock ? "store-product-card--out-of-stock" : ""
                }`}
              >
                <div className="store-product-card__image">
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.name} />
                  ) : (
                    <PackageSearch size={35} />
                  )}
                </div>

                <div className="store-product-card__content">
                  <span className="store-product-card__category">
                    {product.category}
                  </span>

                  <h3>{product.name}</h3>

                  <strong>
                    {moneyFormatter.format(Number(product.price))}
                  </strong>

                  <small className={hasStock ? "is-available" : "is-unavailable"}>
                    {hasStock
                      ? `Stock disponible: ${product.stock}`
                      : "Sin stock"}
                  </small>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}