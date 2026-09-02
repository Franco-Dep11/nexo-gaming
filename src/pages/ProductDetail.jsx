import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import {
  ArrowLeft,
  Check,
  ChevronLeft,
  PackageSearch,
  ShoppingCart,
  Truck,
} from "lucide-react";
import { apiRequest } from "../services/api";
import "./ProductDetail.css";

const moneyFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

export default function ProductDetail() {
  const { id } = useParams();

  const [product, setProduct] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let componentIsMounted = true;

    async function loadProduct() {
      try {
        const loadedProduct = await apiRequest(`/products/${id}`);

        if (!componentIsMounted) return;

        setProduct(loadedProduct);
        setSelectedImage(0);
        setStatus("ready");
      } catch {
        if (componentIsMounted) {
          setStatus("error");
        }
      }
    }

    loadProduct();

    return () => {
      componentIsMounted = false;
    };
  }, [id]);

  if (status === "loading") {
    return (
      <main className="product-detail-page">
        <p className="product-detail-state">Cargando producto...</p>
      </main>
    );
  }

  if (status === "error" || !product) {
    return (
      <main className="product-detail-page">
        <section className="product-detail-error">
          <PackageSearch size={42} />
          <h1>Producto no encontrado</h1>
          <p>Es posible que el producto no exista o ya no esté disponible.</p>

          <Link to="/" className="product-detail-back-button">
            <ArrowLeft size={18} />
            Volver a la tienda
          </Link>
        </section>
      </main>
    );
  }

  const images =
    product.images?.map((image) => image.imageUrl).filter(Boolean) ||
    (product.imageUrl ? [product.imageUrl] : []);

  const mainImage = images[selectedImage] || null;
  const hasStock = Number(product.stock) > 0;

  return (
    <main className="product-detail-page">
      <section className="product-detail">
        <Link to="/" className="product-detail__back">
          <ArrowLeft size={18} />
          Volver a productos
        </Link>

        <div className="product-detail__content">
          <section className="product-gallery">
            <div className="product-gallery__main">
              {mainImage ? (
                <img src={mainImage} alt={product.name} />
              ) : (
                <PackageSearch size={56} />
              )}
            </div>

            {images.length > 1 && (
              <div className="product-gallery__thumbnails">
                {images.map((imageUrl, index) => (
                  <button
                    key={`${imageUrl}-${index}`}
                    type="button"
                    className={`product-gallery__thumbnail ${
                      selectedImage === index
                        ? "product-gallery__thumbnail--active"
                        : ""
                    }`}
                    onClick={() => setSelectedImage(index)}
                    aria-label={`Ver imagen ${index + 1} de ${product.name}`}
                  >
                    <img src={imageUrl} alt="" />
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="product-detail__info">
            <p className="product-detail__category">{product.category}</p>

            <h1>{product.name}</h1>

            <div className="product-detail__price">
              {moneyFormatter.format(Number(product.price))}
            </div>

            <div
              className={`product-detail__stock ${
                hasStock ? "is-available" : "is-unavailable"
              }`}
            >
              <Check size={18} />
              {hasStock
                ? `Stock disponible: ${product.stock}`
                : "Producto sin stock"}
            </div>

            <div className="product-detail__description">
              <h2>Descripción</h2>
              <p>{product.description}</p>
            </div>

            <div className="product-detail__benefits">
              <p>
                <Truck size={18} />
                Envíos a todo el país
              </p>

              <p>
                <Check size={18} />
                Producto disponible para entrega
              </p>
            </div>

            <button
              type="button"
              className="product-detail__cart-button"
              disabled={!hasStock}
            >
              <ShoppingCart size={19} />
              {hasStock ? "Agregar al carrito" : "Sin stock"}
            </button>
          </section>
        </div>
      </section>
    </main>
  );
}