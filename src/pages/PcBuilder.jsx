import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CircuitBoard,
  Cpu,
  Fan,
  Gamepad2,
  HardDrive,
  Keyboard,
  MemoryStick,
  Monitor,
  PackageSearch,
  PcCase,
  Power,
} from "lucide-react";
import Header from "../components/Header";
import Navbar from "../components/Navbar";
import { apiRequest } from "../services/api";
import "./PcBuilder.css";

const moneyFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

// Los alias mantienen el filtrado desacoplado de la interfaz y permiten sumar
// nombres de categorías equivalentes sin implementar compatibilidad técnica.
const builderSteps = [
  {
    id: "processor",
    name: "Procesador",
    categoryNames: ["Procesador", "Procesadores"],
    description:
      "Es el cerebro de la PC: procesa las instrucciones de los programas y juegos.",
    icon: Cpu,
  },
  {
    id: "motherboard",
    name: "Placa madre",
    categoryNames: ["Placa madre", "Placas madre", "Motherboard"],
    description:
      "Conecta todos los componentes y permite que trabajen juntos dentro del equipo.",
    icon: CircuitBoard,
  },
  {
    id: "cooling",
    name: "Cooler y ventilación",
    categoryNames: ["Cooler y ventilación", "Coolers", "Refrigeración"],
    description:
      "Ayuda a mantener temperaturas seguras para que la PC funcione de forma estable.",
    icon: Fan,
  },
  {
    id: "ram",
    name: "Memoria RAM",
    categoryNames: ["Memoria RAM", "Memorias RAM", "RAM"],
    description:
      "Ayuda a ejecutar tareas, programas y juegos con mayor fluidez.",
    icon: MemoryStick,
  },
  {
    id: "gpu",
    name: "Tarjeta de video",
    categoryNames: ["Tarjeta de video", "Tarjetas de video", "Placa de video", "GPU"],
    description:
      "Se encarga de generar los gráficos en juegos, edición de video y tareas visuales.",
    icon: Gamepad2,
  },
  {
    id: "storage",
    name: "Almacenamiento",
    categoryNames: ["Almacenamiento", "Discos", "SSD", "Disco rígido"],
    description:
      "Guarda el sistema, tus programas, juegos y archivos. Un SSD mejora la velocidad.",
    icon: HardDrive,
  },
  {
    id: "power-supply",
    name: "Fuente de alimentación",
    categoryNames: ["Fuente de alimentación", "Fuentes", "Fuente"],
    description:
      "Alimenta todos los componentes y distribuye la energía necesaria para funcionar.",
    icon: Power,
  },
  {
    id: "case",
    name: "Gabinete",
    categoryNames: ["Gabinete", "Gabinetes"],
    description:
      "Protege y organiza las piezas de tu PC, además de ayudar con la ventilación.",
    icon: PcCase,
  },
  {
    id: "monitor",
    name: "Monitor",
    categoryNames: ["Monitor", "Monitores"],
    description:
      "Es la pantalla donde vas a ver tus juegos, contenido y aplicaciones.",
    icon: Monitor,
    optional: true,
  },
  {
    id: "peripherals",
    name: "Periféricos",
    categoryNames: ["Periféricos", "Perifericos"],
    description:
      "Completá tu espacio con teclado, mouse y otros accesorios para usar tu equipo.",
    icon: Keyboard,
    optional: true,
  },
];

function normalizeCategory(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

export default function PcBuilder() {
  const [products, setProducts] = useState([]);
  const [status, setStatus] = useState("loading");
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [selections, setSelections] = useState({});
  const summaryRef = useRef(null);

  useEffect(() => {
    let componentIsMounted = true;

    async function loadProducts() {
      try {
        const loadedProducts = await apiRequest("/products");
        if (!componentIsMounted) return;
        setProducts(loadedProducts);
        setStatus("ready");
      } catch {
        if (componentIsMounted) setStatus("error");
      }
    }

    loadProducts();
    return () => {
      componentIsMounted = false;
    };
  }, []);

  const currentStep = builderSteps[currentStepIndex];

  const currentProducts = useMemo(() => {
    const validCategories = currentStep.categoryNames.map(normalizeCategory);
    return products.filter((product) =>
      validCategories.includes(normalizeCategory(product.category))
    );
  }, [currentStep, products]);

  const selectedProducts = builderSteps
    .map((step) => ({ step, product: selections[step.id] }))
    .filter(({ product }) => Boolean(product));

  const total = selectedProducts.reduce(
    (sum, { product }) => sum + Number(product.price),
    0
  );

  function selectProduct(product) {
    setSelections((current) => ({
      ...current,
      [currentStep.id]: product,
    }));
  }

  function goToStep(index) {
    setCurrentStepIndex(index);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function continueToNextStep() {
    if (currentStepIndex < builderSteps.length - 1) {
      goToStep(currentStepIndex + 1);
    } else {
      summaryRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  return (
    <>
      <Header />
      <Navbar />

      <main className="pc-builder-page">
        <header className="pc-builder-intro">
          <span>CONFIGURADOR NEXO</span>
          <h1>Armá tu PC</h1>
          <p>Elegí cada componente paso a paso y armá tu equipo ideal.</p>
        </header>

        <nav className="builder-progress" aria-label="Pasos del armado">
          <div className="builder-progress__track">
            {builderSteps.map((step, index) => {
              const Icon = step.icon;
              const isCurrent = index === currentStepIndex;
              const isComplete = Boolean(selections[step.id]);

              return (
                <button
                  key={step.id}
                  type="button"
                  className={`builder-step ${isCurrent ? "is-current" : ""} ${
                    isComplete ? "is-complete" : ""
                  }`}
                  onClick={() => goToStep(index)}
                  aria-current={isCurrent ? "step" : undefined}
                >
                  <span className="builder-step__icon">
                    {isComplete && !isCurrent ? <Check size={19} /> : <Icon size={20} />}
                  </span>
                  <small>Paso {index + 1}</small>
                  <strong>{step.name}</strong>
                </button>
              );
            })}
          </div>
        </nav>

        <div className="pc-builder-layout">
          <section className="component-selector">
            <div className="component-selector__heading">
              <span>PASO {currentStepIndex + 1} DE {builderSteps.length}</span>
              <h2>Elegí tu {currentStep.name}</h2>
              <p>{currentStep.description}</p>
            </div>

            {status === "loading" && (
              <div className="builder-empty">Cargando componentes...</div>
            )}

            {status === "error" && (
              <div className="builder-empty">
                <PackageSearch size={38} />
                <strong>No se pudieron cargar los productos.</strong>
                <span>Verificá que el servidor esté iniciado e intentá nuevamente.</span>
              </div>
            )}

            {status === "ready" && currentProducts.length === 0 && (
              <div className="builder-empty">
                <PackageSearch size={38} />
                <strong>Todavía no hay productos cargados en esta categoría</strong>
              </div>
            )}

            {status === "ready" && currentProducts.length > 0 && (
              <div className="builder-products-grid">
                {currentProducts.map((product) => {
                  const isSelected = selections[currentStep.id]?.id === product.id;
                  const hasStock = Number(product.stock) > 0;

                  return (
                    <article
                      key={product.id}
                      className={`builder-product-card ${
                        isSelected ? "is-selected" : ""
                      } ${!hasStock ? "is-out-of-stock" : ""}`}
                    >
                      <div className="builder-product-card__image">
                        {product.imageUrl ? (
                          <img src={product.imageUrl} alt={product.name} />
                        ) : (
                          <PackageSearch size={38} />
                        )}
                        {isSelected && (
                          <span className="builder-product-card__selected-badge">
                            <Check size={15} /> Elegido
                          </span>
                        )}
                      </div>

                      <div className="builder-product-card__content">
                        <h3>{product.name}</h3>
                        <strong>{moneyFormatter.format(Number(product.price))}</strong>
                        <small className={hasStock ? "is-available" : "is-unavailable"}>
                          {hasStock ? `Stock disponible: ${product.stock}` : "Sin stock"}
                        </small>
                        <button
                          type="button"
                          disabled={!hasStock}
                          onClick={() => selectProduct(product)}
                        >
                          {isSelected ? "Seleccionado" : "Seleccionar"}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            <div className="builder-navigation">
              <button
                type="button"
                className="builder-navigation__back"
                disabled={currentStepIndex === 0}
                onClick={() => goToStep(currentStepIndex - 1)}
              >
                <ArrowLeft size={18} /> Volver
              </button>

              <div>
                {currentStep.optional && (
                  <button
                    type="button"
                    className="builder-navigation__skip"
                    onClick={continueToNextStep}
                  >
                    Saltar este paso
                  </button>
                )}
                <button
                  type="button"
                  className="builder-navigation__continue"
                  onClick={continueToNextStep}
                >
                  {currentStepIndex === builderSteps.length - 1
                    ? "Ver resumen"
                    : "Continuar"}
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>
          </section>

          <aside ref={summaryRef} className="builder-summary">
            <div className="builder-summary__heading">
              <div>
                <span>TU CONFIGURACIÓN</span>
                <h2>Tu armado</h2>
              </div>
              <strong>{selectedProducts.length}/{builderSteps.length}</strong>
            </div>

            {selectedProducts.length === 0 ? (
              <p className="builder-summary__empty">
                Tus componentes elegidos aparecerán acá.
              </p>
            ) : (
              <ul>
                {selectedProducts.map(({ step, product }) => (
                  <li key={step.id}>
                    <button
                      type="button"
                      onClick={() => goToStep(
                        builderSteps.findIndex((item) => item.id === step.id)
                      )}
                    >
                      <span>{step.name}</span>
                      <strong>{product.name}</strong>
                    </button>
                    <span>{moneyFormatter.format(Number(product.price))}</span>
                  </li>
                ))}
              </ul>
            )}

            <div className="builder-summary__total">
              <span>Total acumulado</span>
              <strong>{moneyFormatter.format(total)}</strong>
            </div>

            <button
              type="button"
              className="builder-summary__button"
              onClick={() => summaryRef.current?.scrollIntoView({ behavior: "smooth" })}
            >
              Ver resumen del armado
            </button>
            <small>No crea una compra ni agrega productos al carrito.</small>
          </aside>
        </div>
      </main>
    </>
  );
}
