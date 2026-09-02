import { useEffect, useState } from "react";
import { ArrowRight, PackageSearch } from "lucide-react";
import { Link } from "react-router";
import { apiRequest } from "../services/api";
import "./ProductCatalog.css";
import "./FeaturedProducts.css";

const moneyFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

export default function FeaturedProducts() {
  const [products, setProducts] = useState([]);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let componentIsMounted = true;

    async function loadFeaturedProducts() {
      try {
        const loadedProducts = await apiRequest("/products");

        if (!componentIsMounted) return;

        const newestProducts = [...loadedProducts]
          .sort((firstProduct, secondProduct) =>
            Number(secondProduct.id) - Number(firstProduct.id)
          )
          .slice(0, 4);

        setProducts(newestProducts);
        setStatus("ready");
      } catch {
        if (componentIsMounted) {
          setStatus("error");
        }
      }
    }

    loadFeaturedProducts();

    return () => {
      componentIsMounted = false;
    };
  }, []);

  return (
    <section id="productos" className="featured-products">
      <div className="featured-products__heading">
        <div>
          <span>SELECCIÓN NEXO</span>
          <h2>Productos destacados</h2>
          <p>Descubrí las últimas novedades que sumamos a nuestra tienda.</p>
        </div>

        <Link to="/productos" className="featured-products__catalog-link">
          Ver todos los productos
          <ArrowRight size={18} />
        </Link>
      </div>

      {status === "loading" && (
        <div className="featured-products__state">Cargando destacados...</div>
      )}

      {status === "error" && (
        <div className="featured-products__state">
          No se pudieron cargar los productos destacados.
        </div>
      )}

      {status === "ready" && products.length === 0 && (
        <div className="featured-products__state">
          <PackageSearch size={34} />
          <strong>Próximamente vas a encontrar novedades acá.</strong>
        </div>
      )}

      {status === "ready" && products.length > 0 && (
        <div className="store-catalog__grid featured-products__grid">
          {products.map((product) => {
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
                  <strong>{moneyFormatter.format(Number(product.price))}</strong>
                  <small className={hasStock ? "is-available" : "is-unavailable"}>
                    {hasStock ? `Stock disponible: ${product.stock}` : "Sin stock"}
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
