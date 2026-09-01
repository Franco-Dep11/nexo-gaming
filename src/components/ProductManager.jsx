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
import "./ProductManager.css";

const emptyForm = {
  name: "",
  category: "",
  stock: "",
  price: "",
  description: "",
  imageUrl: "",
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
    }));
  };

  const handleImage = async (file) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setMessage("Elegí un archivo de imagen válido.");
      return;
    }

    try {
      setMessage("Procesando imagen...");
      const compressedImage = await compressImage(file);

      setForm((currentForm) => ({
        ...currentForm,
        imageUrl: compressedImage,
      }));

      setMessage("Imagen cargada correctamente.");
    } catch {
      setMessage("No se pudo procesar esa imagen.");
    }
  };

  const handleFileChange = (event) => {
    handleImage(event.target.files?.[0]);
    event.target.value = "";
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDraggingImage(false);
    handleImage(event.dataTransfer.files?.[0]);
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
    };

    try {
      if (editingId) {
        await updateProduct(editingId, productData);
        setMessage("Producto actualizado correctamente.");
      } else {
        await createProduct(productData);
        setMessage("Producto creado correctamente.");
      }

      await refreshProducts();
      resetForm();
    } catch (error) {
      setMessage(error.message);
    }
  };

  const handleEdit = (product) => {
    setEditingId(product.id);

    setForm({
      name: product.name || "",
      category: product.category || "",
      stock: String(product.stock ?? ""),
      price: String(product.price ?? ""),
      description: product.description || "",
      imageUrl: product.imageUrl || "",
      active: product.active !== false,
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleDeactivate = async (id) => {
    const confirmed = window.confirm(
      "¿Querés dar de baja este producto? Podrás editarlo o reactivarlo después."
    );

    if (!confirmed) return;

    try {
      await deactivateProduct(id);
      await refreshProducts();

      if (editingId === id) {
        resetForm();
      }

      setMessage("Producto dado de baja.");
    } catch (error) {
      setMessage(error.message);
    }
  };

  const filteredProducts = filterCategory
    ? products.filter((product) => product.category === filterCategory)
    : [];

  return (
    <section
      className={`product-manager ${
        catalogExpanded ? "product-manager--expanded" : ""
      }`}
    >
      <div className="product-manager__layout">
        <article className="product-form-card">
          <div className="section-heading">
            <span>NUEVO PRODUCTO</span>
            <h2>{editingId ? "Editar producto" : "Alta de producto"}</h2>
          </div>

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
              <span>Imagen del producto</span>

              <input
                ref={fileInputRef}
                className="image-file-input"
                type="file"
                accept="image/*"
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
                {form.imageUrl ? (
                  <div className="image-preview">
                    <img src={form.imageUrl} alt="Vista previa" />

                    <button
                      type="button"
                      onClick={() =>
                        setForm((currentForm) => ({
                          ...currentForm,
                          imageUrl: "",
                        }))
                      }
                      title="Quitar imagen"
                      aria-label="Quitar imagen"
                    >
                      <X size={18} />
                    </button>
                  </div>
                ) : (
                  <>
                    <ImagePlus size={28} />
                    <p>Arrastrá una imagen aquí</p>
                    <span>o</span>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Buscar imagen
                    </button>
                  </>
                )}
              </div>
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
                {filteredProducts.map((product) => (
                  <article
                    key={product.id}
                    className={`product-list__item ${
                      product.active === false ? "is-inactive" : ""
                    }`}
                    onClick={() => handleEdit(product)}
                  >
                    <div className="product-list__image">
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt={product.name} />
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
                          handleDeactivate(product.id);
                        }}
                        title="Dar de baja"
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </article>
                ))}
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
    </section>
  );
}