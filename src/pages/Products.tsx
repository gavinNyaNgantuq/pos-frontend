import { useEffect, useMemo, useState } from "react";
import "./Products.css";

type Product = {
  id: number;
  category_id: number;
  category_name: string | null;
  product_name: string;
  sku: string | null;
  barcode: string | null;
  image: string | null;
  price: number;
  stock: number;
  min_stock: number;
  status: number;
  created_at: string;
  created_by: number | null;
  updated_at: string | null;
  updated_by: number | null;
};

type Category = {
  id: number;
  name: string;
  description?: string | null;
  status: number;
};

type ProductForm = {
  category_id: string;
  product_name: string;
  price: string;
  stock: string;
  sku: string;
  barcode: string;
  min_stock: string;
};

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [form, setForm] = useState<ProductForm>({
    category_id: "",
    product_name: "",
    price: "",
    stock: "",
    sku: "",
    barcode: "",
    min_stock: "0",
  });

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");

  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const token = localStorage.getItem("token");

  // =========================
  // GET PRODUCTS
  // =========================
  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_URL}/api/products`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Gagal mengambil data produk");
      }

      setProducts(result.data || []);
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan saat mengambil produk");
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // GET CATEGORIES
  // =========================
  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_URL}/api/categories`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Gagal mengambil kategori");
      }

      setCategories(result.data || []);
    } catch (err: any) {
      console.error("CATEGORY ERROR:", err);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  // =========================
  // FORMAT RUPIAH
  // =========================
  const formatRupiah = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(value);
  };

  // =========================
  // IMAGE URL
  // =========================
  const getImageUrl = (image: string | null) => {
    if (!image) return "";

    if (image.startsWith("http")) {
      return image;
    }

    return `${API_URL}/uploads/products/${image}`;
  };

  // =========================
  // FILTER
  // =========================
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const keyword = search.toLowerCase();

      const matchesSearch =
        product.product_name.toLowerCase().includes(keyword) ||
        (product.category_name || "").toLowerCase().includes(keyword) ||
        (product.sku || "").toLowerCase().includes(keyword) ||
        (product.barcode || "").toLowerCase().includes(keyword);

      const matchesCategory =
        categoryFilter === "all" ||
        product.category_id.toString() === categoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [products, search, categoryFilter]);

  // =========================
  // STATISTICS
  // =========================
  const totalProducts = products.length;

  const totalStock = products.reduce(
    (total, product) => total + Number(product.stock),
    0
  );

  const lowStock = products.filter(
    (product) =>
      Number(product.stock) <= Number(product.min_stock ?? 0)
  ).length;

  const totalCategories = new Set(
    products.map((product) => product.category_id)
  ).size;

  // =========================
  // OPEN ADD MODAL
  // =========================
  const openAddModal = () => {
    setEditingId(null);

    setForm({
      category_id: "",
      product_name: "",
      price: "",
      stock: "",
      sku: "",
      barcode: "",
      min_stock: "0",
    });

    setSelectedImage(null);
    setImagePreview("");

    setFormError("");
    setShowModal(true);
  };

  // =========================
  // OPEN EDIT MODAL
  // =========================
  const openEditModal = (product: Product) => {
    setEditingId(product.id);

    setForm({
      category_id: product.category_id.toString(),
      product_name: product.product_name,
      price: product.price.toString(),
      stock: product.stock.toString(),
      sku: product.sku || "",
      barcode: product.barcode || "",
      min_stock: (product.min_stock ?? 0).toString(),
    });

    setSelectedImage(null);
    setImagePreview(getImageUrl(product.image));

    setFormError("");
    setShowModal(true);
  };

  // =========================
  // CLOSE MODAL
  // =========================
  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setEditingId(null);
    setFormError("");
    setSelectedImage(null);
    setImagePreview("");
  };

  // =========================
  // HANDLE FORM
  // =========================
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // =========================
  // HANDLE IMAGE
  // =========================
  const handleImageChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      setFormError("Gambar harus berupa JPG, JPEG, PNG, atau WEBP.");
      e.target.value = "";
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setFormError("Ukuran gambar maksimal 2 MB.");
      e.target.value = "";
      return;
    }

    setFormError("");
    setSelectedImage(file);

    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
  };

  // =========================
  // SAVE PRODUCT
  // =========================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setFormError("");

    if (!form.category_id) {
      setFormError("Kategori wajib dipilih.");
      return;
    }

    if (!form.product_name.trim()) {
      setFormError("Nama produk wajib diisi.");
      return;
    }

    if (form.price === "" || Number(form.price) < 0) {
      setFormError("Harga tidak valid.");
      return;
    }

    if (form.stock === "" || Number(form.stock) < 0) {
      setFormError("Stock tidak valid.");
      return;
    }

    if (
      form.min_stock === "" ||
      Number(form.min_stock) < 0
    ) {
      setFormError("Minimum stock tidak valid.");
      return;
    }

    try {
      setSaving(true);

      const formData = new FormData();

      formData.append("category_id", form.category_id);
      formData.append("product_name", form.product_name.trim());
      formData.append("price", form.price);
      formData.append("stock", form.stock);
      formData.append("sku", form.sku.trim());
      formData.append("barcode", form.barcode.trim());
      formData.append("min_stock", form.min_stock);

      if (selectedImage) {
        formData.append("image", selectedImage);
      }

      const url = editingId
        ? `${API_URL}/api/products/${editingId}`
        : `${API_URL}/api/products`;

      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Gagal menyimpan produk");
      }

      await fetchProducts();

      closeModal();
    } catch (err: any) {
      setFormError(err.message || "Terjadi kesalahan.");
    } finally {
      setSaving(false);
    }
  };

  // =========================
  // DELETE PRODUCT
  // =========================
  const handleDelete = async (
    id: number,
    productName: string
  ) => {
    const confirmed = window.confirm(
      `Yakin ingin menghapus produk "${productName}"?`
    );

    if (!confirmed) return;

    try {
      setDeletingId(id);

      const response = await fetch(
        `${API_URL}/api/products/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Gagal menghapus produk"
        );
      }

      await fetchProducts();
    } catch (err: any) {
      alert(err.message || "Gagal menghapus produk");
    } finally {
      setDeletingId(null);
    }
  };

  // =========================
  // LOADING
  // =========================
  if (loading) {
    return (
      <section className="products-section">
        <div className="products-state">
          <div className="loading-spinner"></div>

          <h3>Memuat produk...</h3>

          <p>
            Data produk sedang diambil dari server.
          </p>
        </div>
      </section>
    );
  }

  // =========================
  // ERROR
  // =========================
  if (error) {
    return (
      <section className="products-section">
        <div className="products-state error-state">
          <div className="state-icon">!</div>

          <h3>Gagal memuat produk</h3>

          <p>{error}</p>

          <button
            className="retry-button"
            onClick={fetchProducts}
          >
            Coba Lagi
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="products-section">

      {/* HEADER */}
      <div className="products-header">
        <div>
          <div className="page-label">MASTER DATA</div>

          <h2>Produk</h2>

          <p>
            Kelola produk, kategori, harga, stock, dan gambar.
          </p>
        </div>

        <button
          className="add-product-button"
          onClick={openAddModal}
        >
          <span>+</span>
          Tambah Produk
        </button>
      </div>

      {/* STATISTICS */}
      <div className="product-stats">

        <div className="product-stat-card">
          <div className="stat-icon product-icon">▣</div>

          <div>
            <span>Total Produk</span>
            <strong>{totalProducts}</strong>
          </div>
        </div>

        <div className="product-stat-card">
          <div className="stat-icon stock-icon">▤</div>

          <div>
            <span>Total Stock</span>
            <strong>{totalStock}</strong>
          </div>
        </div>

        <div className="product-stat-card">
          <div className="stat-icon category-icon">◈</div>

          <div>
            <span>Kategori</span>
            <strong>{totalCategories}</strong>
          </div>
        </div>

        <div className="product-stat-card">
          <div className="stat-icon warning-icon">!</div>

          <div>
            <span>Stock Menipis</span>
            <strong>{lowStock}</strong>
          </div>
        </div>

      </div>

      {/* TOOLBAR */}
      <div className="products-toolbar">

        <div className="search-wrapper">
          <span className="search-icon">⌕</span>

          <input
            type="text"
            placeholder="Cari nama produk atau kategori..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />
        </div>

        <select
          className="category-filter"
          value={categoryFilter}
          onChange={(e) =>
            setCategoryFilter(e.target.value)
          }
        >
          <option value="all">
            Semua Kategori
          </option>

          {categories.map((category) => (
            <option
              key={category.id}
              value={category.id}
            >
              {category.name}
            </option>
          ))}
        </select>

      </div>

      {/* EMPTY */}
      {products.length === 0 ? (
        <div className="products-state empty-state">
          <div className="state-icon">▣</div>

          <h3>Belum ada produk</h3>

          <p>
            Data produk masih kosong. Tambahkan produk
            pertama untuk mulai menggunakan master produk.
          </p>

          <button
            className="add-product-button"
            onClick={openAddModal}
          >
            <span>+</span>
            Tambah Produk
          </button>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="products-state empty-state">
          <div className="state-icon">⌕</div>

          <h3>Produk tidak ditemukan</h3>

          <p>
            Tidak ada produk yang sesuai dengan
            pencarian atau filter kategori.
          </p>
        </div>
      ) : (
        /* TABLE */
        <div className="products-table-card">

          <div className="table-top">
            <div>
              <h3>Daftar Produk</h3>

              <span>
                Menampilkan {filteredProducts.length} dari{" "}
                {products.length} produk
              </span>
            </div>
          </div>

          <div className="table-wrapper">
            <table className="products-table">

              <thead>
                <tr>
                  <th>ID</th>
                  <th>Produk</th>
                  <th>Kategori</th>
                  <th>Harga</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>

              <tbody>
                {filteredProducts.map((product) => (
                  <tr key={product.id}>

                    <td>
                      <span className="product-id">
                        #{product.id}
                      </span>
                    </td>

                    <td>
                      <div className="product-name-cell">

                        {product.image ? (
                          <img
                            className="product-image"
                            src={getImageUrl(product.image)}
                            alt={product.product_name}
                            onError={(e) => {
                              e.currentTarget.style.display =
                                "none";
                            }}
                          />
                        ) : (
                          <div className="product-avatar">
                            {product.product_name
                              .charAt(0)
                              .toUpperCase()}
                          </div>
                        )}

                        <div>
                          <strong>
                            {product.product_name}
                          </strong>

                          {(product.sku ||
                            product.barcode) && (
                            <small>
                              {[product.sku, product.barcode]
                                .filter(Boolean)
                                .join(" • ")}
                            </small>
                          )}

                          <small>
                            Dibuat{" "}
                            {product.created_at
                              ? new Date(
                                  product.created_at
                                ).toLocaleDateString(
                                  "id-ID"
                                )
                              : "-"}
                          </small>
                        </div>

                      </div>
                    </td>

                    <td>
                      <span className="category-badge">
                        {product.category_name ||
                          "Tanpa kategori"}
                      </span>
                    </td>

                    <td>
                      <strong className="product-price">
                        {formatRupiah(
                          Number(product.price)
                        )}
                      </strong>
                    </td>

                    <td>
                      <span
                        className={
                          Number(product.stock) <=
                          Number(product.min_stock ?? 0)
                            ? "stock-badge low"
                            : "stock-badge"
                        }
                      >
                        {product.stock}

                        {Number(product.stock) <=
                          Number(
                            product.min_stock ?? 0
                          ) && (
                          <small> Menipis</small>
                        )}
                      </span>
                    </td>

                    <td>
                      <span className="status-badge">
                        <span className="status-dot"></span>
                        Aktif
                      </span>
                    </td>

                    <td>
                      <div className="product-actions">

                        <button
                          className="edit-product-button"
                          onClick={() =>
                            openEditModal(product)
                          }
                        >
                          Edit
                        </button>

                        <button
                          className="delete-product-button"
                          onClick={() =>
                            handleDelete(
                              product.id,
                              product.product_name
                            )
                          }
                          disabled={
                            deletingId === product.id
                          }
                        >
                          {deletingId === product.id
                            ? "..."
                            : "Hapus"}
                        </button>

                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>

            </table>
          </div>
        </div>
      )}

      {/* MODAL */}
      {showModal && (
        <div
          className="product-modal-overlay"
          onClick={closeModal}
        >
          <div
            className="product-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="modal-header">

              <div>
                <span className="modal-label">
                  {editingId
                    ? "EDIT DATA"
                    : "MASTER DATA"}
                </span>

                <h3>
                  {editingId
                    ? "Edit Produk"
                    : "Tambah Produk"}
                </h3>
              </div>

              <button
                className="modal-close"
                onClick={closeModal}
                disabled={saving}
              >
                ×
              </button>

            </div>

            <form onSubmit={handleSubmit}>

              {formError && (
                <div className="form-error">
                  <span>!</span>
                  {formError}
                </div>
              )}

              {/* IMAGE */}
              <div className="form-group">
                <label htmlFor="image">
                  Gambar Produk
                </label>

                <div className="image-upload-area">

                  {imagePreview ? (
                    <img
                      className="image-preview"
                      src={imagePreview}
                      alt="Preview produk"
                    />
                  ) : (
                    <div className="image-placeholder">
                      <span>+</span>
                      <p>
                        Belum ada gambar
                      </p>
                    </div>
                  )}

                  <div className="image-upload-content">
                    <input
                      id="image"
                      name="image"
                      type="file"
                      accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                      onChange={handleImageChange}
                      disabled={saving}
                    />

                    <small>
                      JPG, JPEG, PNG, WEBP. Maksimal 2 MB.
                    </small>
                  </div>

                </div>
              </div>

              {/* PRODUCT NAME */}
              <div className="form-group">
                <label htmlFor="product_name">
                  Nama Produk <span>*</span>
                </label>

                <input
                  id="product_name"
                  name="product_name"
                  type="text"
                  placeholder="Contoh: Indomie Goreng"
                  value={form.product_name}
                  onChange={handleChange}
                  disabled={saving}
                />
              </div>

              {/* SKU + BARCODE */}
              <div className="form-row">

                <div className="form-group">

                  <label htmlFor="sku">
                    SKU
                  </label>

                  <input
                    id="sku"
                    name="sku"
                    type="text"
                    placeholder="Contoh: INDM-GRG-001"
                    value={form.sku}
                    onChange={handleChange}
                    disabled={saving}
                  />

                </div>

                <div className="form-group">

                  <label htmlFor="barcode">
                    Barcode
                  </label>

                  <input
                    id="barcode"
                    name="barcode"
                    type="text"
                    placeholder="Scan atau ketik barcode"
                    value={form.barcode}
                    onChange={handleChange}
                    disabled={saving}
                  />

                </div>

              </div>

              {/* CATEGORY */}
              <div className="form-group">

                <label htmlFor="category_id">
                  Kategori <span>*</span>
                </label>

                <select
                  id="category_id"
                  name="category_id"
                  value={form.category_id}
                  onChange={handleChange}
                  disabled={saving}
                >
                  <option value="">
                    Pilih kategori
                  </option>

                  {categories.map((category) => (
                    <option
                      key={category.id}
                      value={category.id}
                    >
                      {category.name}
                    </option>
                  ))}
                </select>

                {categories.length === 0 && (
                  <small className="field-warning">
                    Belum ada kategori aktif.
                  </small>
                )}

              </div>

              {/* PRICE + STOCK */}
              <div className="form-row">

                <div className="form-group">

                  <label htmlFor="price">
                    Harga <span>*</span>
                  </label>

                  <div className="input-prefix">

                    <span>Rp</span>

                    <input
                      id="price"
                      name="price"
                      type="number"
                      min="0"
                      placeholder="0"
                      value={form.price}
                      onChange={handleChange}
                      disabled={saving}
                    />

                  </div>
                </div>

                <div className="form-group">

                  <label htmlFor="stock">
                    Stock <span>*</span>
                  </label>

                  <input
                    id="stock"
                    name="stock"
                    type="number"
                    min="0"
                    placeholder="0"
                    value={form.stock}
                    onChange={handleChange}
                    disabled={saving}
                  />

                </div>

                <div className="form-group">

                  <label htmlFor="min_stock">
                    Min. Stock
                  </label>

                  <input
                    id="min_stock"
                    name="min_stock"
                    type="number"
                    min="0"
                    placeholder="0"
                    value={form.min_stock}
                    onChange={handleChange}
                    disabled={saving}
                  />

                </div>

              </div>

              {/* ACTION */}
              <div className="modal-actions">

                <button
                  type="button"
                  className="cancel-product-button"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Batal
                </button>

                <button
                  type="submit"
                  className="save-product-button"
                  disabled={saving}
                >
                  {saving
                    ? "Menyimpan..."
                    : editingId
                    ? "Simpan Perubahan"
                    : "Tambah Produk"}
                </button>

              </div>

            </form>
          </div>
        </div>
      )}

    </section>
  );
}

export default Products;