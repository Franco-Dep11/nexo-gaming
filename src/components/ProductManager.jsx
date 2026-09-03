import { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  ImagePlus,
  Pencil,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";
import {
  createProduct,
  deactivateProduct,
  getProducts,
  updateProduct,
} from "../services/productStorage";
import { createCategory, getCategories } from "../services/categoryStorage";
import ConfirmDialog from "./ConfirmDialog";
import {
  getCategoryType,
  normalizeSpecifications,
  specificationFields,
} from "../data/productSpecifications";
import "./ProductManager.css";

const MAX_IMAGES = 6;

const emptyForm = {
  name: "",
  category: "",
  stock: "",
  price: "",
  description: "",
  images: [],
  specifications: {},
  active: true,
};

function compressImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const image = new Image();

      image.onload = () => {
        const maxWidth = 1200;
        const scale = Math.min(1, maxWidth / image.width);

        const canvas = document.createElement("canvas");
        canvas.width = Math.round(image.width * scale);
        canvas.height = Math.round(image.height * scale);

        const context = canvas.getContext("2d");
        context.drawImage(image, 0, 0, canvas.width, canvas.height);

        resolve(canvas.toDataURL("image/webp", 0.78));
      };

      image.onerror = () => reject(new Error("No se pudo leer la imagen."));
      image.src = reader.result;
    };

    reader.onerror = () => reject(new Error("No se pudo cargar el archivo."));
    reader.readAsDataURL(file);
  });
}

export default function ProductManager() {
  const fileInputRef = useRef(null);
  const formCardRef = useRef(null);

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [filterCategory, setFilterCategory] = useState("");
  const [catalogExpanded, setCatalogExpanded] = useState(false);
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const [confirmation, setConfirmation] = useState(null);
  const [isConfirming, setIsConfirming] = useState(false);

  useEffect(() => {
    let componentIsMounted = true;

    async function loadInitialData() {
      try {
        const [loadedProducts, loadedCategories] = await Promise.all([
          getProducts(),
          getCategories(),
        ]);

        if (!componentIsMounted) return;

        setProducts(loadedProducts);
        setCategories(loadedCategories);
      } catch (error) {
        if (componentIsMounted) {
          setMessage(error.message);
        }
      }
    }

    loadInitialData();

    return () => {
      componentIsMounted = false;
    };
  }, []);

  const refreshProducts = async () => {
    const loadedProducts = await getProducts();
    setProducts(loadedProducts);
  };

  const refreshCategories = async () => {
    const loadedCategories = await getCategories();
    setCategories(loadedCategories);
  };

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setForm((currentForm) => ({
      ...currentForm,
      [name]: type === "checkbox" ? checked : value,
      ...(name === "category" &&
      getCategoryType(currentForm.category) !== getCategoryType(value)
        ? { specifications: {} }
        : {}),
    }));
  };

  const handleSpecificationChange = (field, value) => {
    setForm((currentForm) => ({
      ...currentForm,
      specifications: { ...currentForm.specifications, [field]: value },
    }));
  };

  const toggleSpecificationOption = (field, option) => {
    setForm((currentForm) => {
      const currentValues = Array.isArray(currentForm.specifications[field])
        ? currentForm.specifications[field]
        : [];

      return {
        ...currentForm,
        specifications: {
          ...currentForm.specifications,
          [field]: currentValues.includes(option)
            ? currentValues.filter((value) => value !== option)
            : [...currentValues, option],
        },
      };
    });
  };

  const handleImages = async (files) => {
    const selectedFiles = Array.from(files || []);

    if (selectedFiles.length === 0) return;

    const invalidFile = selectedFiles.find(
      (file) => !file.type.startsWith("image/")
    );

    if (invalidFile) {
      setMessage("Elegí solamente archivos de imagen.");
      return;
    }

    const availableSlots = MAX_IMAGES - form.images.length;

    if (availableSlots <= 0) {
      setMessage(`Podés cargar hasta ${MAX_IMAGES} imágenes por producto.`);
      return;
    }

    const filesToProcess = selectedFiles.slice(0, availableSlots);

    try {
      setMessage("Procesando imágenes...");

      const compressedImages = await Promise.all(
        filesToProcess.map((file) => compressImage(file))
      );

      setForm((currentForm) => ({
        ...currentForm,
        images: [...currentForm.images, ...compressedImages],
      }));

      if (selectedFiles.length > availableSlots) {
        setMessage(
          `Se cargaron ${availableSlots} imágenes. El máximo es ${MAX_IMAGES}.`
        );
      } else {
        setMessage(
          `${compressedImages.length} imagen${
            compressedImages.length === 1 ? "" : "es"
          } cargada${compressedImages.length === 1 ? "" : "s"} correctamente.`
        );
      }
    } catch {
      setMessage("No se pudieron procesar las imágenes.");
    }
  };

  const handleFileChange = (event) => {
    handleImages(event.target.files);
    event.target.value = "";
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDraggingImage(false);
    handleImages(event.dataTransfer.files);
  };

  const removeImage = (indexToRemove) => {
    setForm((currentForm) => ({
      ...currentForm,
      images: currentForm.images.filter(
        (_, index) => index !== indexToRemove
      ),
    }));
  };

  const handleCreateCategory = async () => {
    const result = await createCategory(categoryName);

    if (!result.success) {
      setMessage(result.message);
      return;
    }

    try {
      await refreshCategories();

      setForm((currentForm) => ({
        ...currentForm,
        category: result.category,
      }));

      setCategoryName("");
      setShowCategoryForm(false);
      setMessage("Categoría creada correctamente.");
    } catch (error) {
      setMessage(error.message);
    }
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.category) {
      setMessage("Seleccioná o creá una categoría.");
      return;
    }

    const productData = {
      ...form,
      price: Number(form.price),
      stock: Number(form.stock),
      specifications: Object.fromEntries(
        Object.entries(form.specifications).map(([key, value]) => [
          key,
          typeof value === "string" && value !== "" && /^\d+(\.\d+)?$/.test(value)
            ? Number(value)
            : value,
        ])
      ),
    };

    setConfirmation({
      type: editingId ? "update" : "create",
      productId: editingId,
      productData,
      title: editingId ? "Confirmar cambios" : "Confirmar creación",
      message: editingId
        ? `¿Seguro que deseás guardar los cambios de “${form.name}”?`
        : `¿Seguro que deseás crear el producto “${form.name}”?`,
      confirmLabel: editingId ? "Guardar cambios" : "Crear producto",
      tone: "primary",
    });
  };

  const handleEdit = (product) => {
    const imageUrls =
      Array.isArray(product.images) && product.images.length > 0
        ? product.images.map((image) => image.imageUrl)
        : product.imageUrl
          ? [product.imageUrl]
          : [];

    setEditingId(product.id);

    setForm({
      name: product.name || "",
      category: product.category || "",
      stock: String(product.stock ?? ""),
      price: String(product.price ?? ""),
      description: product.description || "",
      images: imageUrls,
      specifications: normalizeSpecifications(product.specifications),
      active: product.active !== false,
    });

    setCatalogExpanded(false);
    requestAnimationFrame(() => {
      formCardRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  };

  const handleDeactivate = (product) => {
    setConfirmation({
      type: "deactivate",
      productId: product.id,
      title: "Confirmar baja",
      message: `¿Seguro que deseás dar de baja “${product.name}”? Esta acción ocultará el producto de la tienda.`,
      confirmLabel: "Dar de baja",
      tone: "danger",
    });
  };

  const executeConfirmedAction = async () => {
    if (!confirmation) return;

    const scrollPosition = window.scrollY;
    setIsConfirming(true);
    try {
      if (confirmation.type === "create") {
        await createProduct(confirmation.productData);
        setMessage("Producto creado correctamente.");
      }

      if (confirmation.type === "update") {
        await updateProduct(
          confirmation.productId,
          confirmation.productData
        );
        setMessage("Producto actualizado correctamente.");
      }

      if (confirmation.type === "deactivate") {
        await deactivateProduct(confirmation.productId);
        setMessage("Producto dado de baja.");
      }

      await refreshProducts();

      if (
        confirmation.type === "create" ||
        confirmation.type === "update" ||
        editingId === confirmation.productId
      ) {
        resetForm();
      }
    } catch (error) {
      setMessage(error.message);
    } finally {
      setIsConfirming(false);
      setConfirmation(null);
      requestAnimationFrame(() => {
        window.scrollTo({ top: scrollPosition, behavior: "auto" });
      });
    }
  };

  const filteredProducts = filterCategory
    ? products.filter((product) => product.category === filterCategory)
    : [];

  const selectedCategoryType = getCategoryType(form.category);
  const technicalFields = specificationFields[selectedCategoryType] || [];

  return (
    <section
      className={`product-manager ${
        catalogExpanded ? "product-manager--expanded" : ""
      }`}
    >
      <div className="product-manager__layout">
        <article
          ref={formCardRef}
          className={`product-form-card ${editingId ? "is-editing" : ""}`}
        >
          <div className="section-heading">
            <span>{editingId ? "EDITANDO PRODUCTO" : "NUEVO PRODUCTO"}</span>
            <h2>{editingId ? "Editar producto" : "Alta de producto"}</h2>
          </div>

          {editingId && (
            <div className="product-form-card__editing-notice">
              <Pencil size={17} />
              Estás editando <strong>{form.name}</strong>
            </div>
          )}

          <form className="product-form" onSubmit={handleSubmit}>
            <label>
              Nombre del producto
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
              />
            </label>

            <label>
              Categoría

              <div className="category-select-group">
                <div className="select-wrapper">
                  <select
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                    required
                  >
                    <option value="" disabled />

                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>

                  <ChevronDown size={17} />
                </div>

                <button
                  type="button"
                  className="category-add-button"
                  onClick={() => setShowCategoryForm((current) => !current)}
                  title="Crear categoría"
                  aria-label="Crear categoría"
                >
                  <Plus size={20} />
                </button>
              </div>
            </label>

            {showCategoryForm && (
              <div className="category-creator">
                <input
                  type="text"
                  value={categoryName}
                  onChange={(event) => setCategoryName(event.target.value)}
                  placeholder="Nombre de categoría"
                />

                <button type="button" onClick={handleCreateCategory}>
                  Agregar
                </button>
              </div>
            )}

            <section className="technical-specifications">
              <div className="technical-specifications__heading">
                <span>Especificaciones técnicas</span>
                <small>Se usan para verificar compatibilidad en Armá tu PC.</small>
              </div>

              {!form.category && (
                <p>Elegí una categoría para ver sus campos técnicos.</p>
              )}

              {form.category && technicalFields.length === 0 && (
                <p>Esta categoría no requiere datos de compatibilidad por ahora.</p>
              )}

              {technicalFields.length > 0 && (
                <div className="technical-specifications__grid">
                  {technicalFields.map((field) => {
                    const value =
                      form.specifications[field.key] ?? (field.multiple ? [] : "");

                    if (field.multiple && field.options) {
                      return (
                        <fieldset key={field.key}>
                          <legend>{field.label}</legend>
                          <div className="technical-specifications__options">
                            {field.options.map((option) => (
                              <label key={option}>
                                <input
                                  type="checkbox"
                                  checked={Array.isArray(value) && value.includes(option)}
                                  onChange={() =>
                                    toggleSpecificationOption(field.key, option)
                                  }
                                />
                                <span>{option}</span>
                              </label>
                            ))}
                          </div>
                        </fieldset>
                      );
                    }

                    if (field.options) {
                      return (
                        <label key={field.key}>
                          {field.label}
                          <select
                            value={value}
                            onChange={(event) =>
                              handleSpecificationChange(field.key, event.target.value)
                            }
                          >
                            <option value="">Sin especificar</option>
                            {field.options.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        </label>
                      );
                    }

                    return (
                      <label key={field.key}>
                        {field.label}{field.suffix ? ` (${field.suffix})` : ""}
                        <input
                          type={field.type || "text"}
                          min={field.type === "number" ? "0" : undefined}
                          step={field.type === "number" ? "1" : undefined}
                          value={
                            field.multiple && Array.isArray(value)
                              ? value.join(", ")
                              : value
                          }
                          placeholder={field.placeholder}
                          onChange={(event) =>
                            handleSpecificationChange(
                              field.key,
                              field.multiple
                                ? event.target.value
                                    .split(",")
                                    .map((item) => item.trim())
                                    .filter(Boolean)
                                : event.target.value
                            )
                          }
                        />
                        {field.multiple && (
                          <small>Separá cada valor con una coma.</small>
                        )}
                      </label>
                    );
                  })}
                </div>
              )}
            </section>

            <div className="product-form__price-row">
              <label>
                Stock disponible
                <input
                  type="number"
                  name="stock"
                  min="0"
                  step="1"
                  value={form.stock}
                  onChange={handleChange}
                  required
                />
              </label>

              <label>
                Precio en pesos
                <input
                  type="number"
                  name="price"
                  min="0"
                  step="1"
                  value={form.price}
                  onChange={handleChange}
                  required
                />
              </label>
            </div>

            <label>
              Descripción
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows="5"
                required
              />
            </label>

            <div className="product-form__image-section">
              <div className="product-form__image-heading">
                <span>Imágenes del producto</span>
                <small>
                  {form.images.length}/{MAX_IMAGES} cargadas
                </small>
              </div>

              <input
                ref={fileInputRef}
                className="image-file-input"
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileChange}
              />

              <div
                className={`image-dropzone ${
                  isDraggingImage ? "image-dropzone--dragging" : ""
                }`}
                onDragOver={(event) => {
                  event.preventDefault();
                  setIsDraggingImage(true);
                }}
                onDragLeave={() => setIsDraggingImage(false)}
                onDrop={handleDrop}
              >
                <ImagePlus size={28} />
                <p>Arrastrá una o varias imágenes aquí</p>
                <span>o</span>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Buscar imágenes
                </button>
              </div>

              {form.images.length > 0 && (
                <div className="image-preview-grid">
                  {form.images.map((imageUrl, index) => (
                    <div key={imageUrl} className="image-preview-card">
                      <img
                        src={imageUrl}
                        alt={`Vista previa ${index + 1}`}
                      />

                      {index === 0 && (
                        <span className="image-preview-card__main">
                          Portada
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        title="Quitar imagen"
                        aria-label={`Quitar imagen ${index + 1}`}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <label className="active-checkbox">
              <input
                type="checkbox"
                name="active"
                checked={form.active}
                onChange={handleChange}
              />
              <span>Mostrar este producto en la tienda</span>
            </label>

            <div className="product-form__actions">
              <button type="submit" className="primary-button">
                <Save size={18} />
                {editingId ? "Guardar cambios" : "Crear producto"}
              </button>

              {editingId && (
                <button
                  type="button"
                  className="secondary-button"
                  onClick={resetForm}
                >
                  Cancelar edición
                </button>
              )}
            </div>
          </form>

          {message && <p className="form-message">{message}</p>}
        </article>

        <article className="catalog-card">
          <div className="section-heading">
            <span>CATÁLOGO</span>
            <h2>Productos cargados</h2>
          </div>

          <div className="catalog-filter">
            <label>
              Categoría

              <div className="select-wrapper">
                <select
                  value={filterCategory}
                  onChange={(event) => setFilterCategory(event.target.value)}
                >
                  <option value="">Seleccioná una categoría</option>

                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>

                <ChevronDown size={17} />
              </div>
            </label>
          </div>

          {!filterCategory ? (
            <div className="catalog-empty">
              Elegí una categoría para ver sus productos.
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="catalog-empty">
              No hay productos cargados en esta categoría.
            </div>
          ) : (
            <>
              <div className="product-list">
                {filteredProducts.map((product) => {
                  const mainImage =
                    product.images?.[0]?.imageUrl || product.imageUrl;

                  return (
                    <article
                      key={product.id}
                      className={`product-list__item ${
                        product.active === false ? "is-inactive" : ""
                      }`}
                      onClick={() => handleEdit(product)}
                    >
                      <div className="product-list__image">
                        {mainImage ? (
                          <img src={mainImage} alt={product.name} />
                        ) : (
                          <ImagePlus size={22} />
                        )}
                      </div>

                      <div className="product-list__info">
                        <h3>{product.name}</h3>
                        <p>{product.category}</p>
                        <strong>
                          ${Number(product.price).toLocaleString("es-AR")}
                        </strong>
                      </div>

                      <div className="product-list__buttons">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleEdit(product);
                          }}
                          title="Editar producto"
                        >
                          <Pencil size={17} />
                        </button>

                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleDeactivate(product);
                          }}
                          title="Dar de baja"
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>

              <button
                type="button"
                className="catalog-view-button"
                onClick={() => setCatalogExpanded((current) => !current)}
              >
                {catalogExpanded ? "Vista normal" : "Vista ampliada"}
              </button>
            </>
          )}
        </article>
      </div>

      <ConfirmDialog
        open={Boolean(confirmation)}
        title={confirmation?.title}
        message={confirmation?.message}
        confirmLabel={confirmation?.confirmLabel}
        tone={confirmation?.tone}
        busy={isConfirming}
        onCancel={() => setConfirmation(null)}
        onConfirm={executeConfirmedAction}
      />
    </section>
  );
}
