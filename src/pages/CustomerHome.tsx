import { useEffect, useState } from "react";
import "./CustomerHome.css";
import Footer from "../components/Footer";
import ThemeToggle from "../components/ThemeToggle";

interface Product {
  id: number;
  category_name: string;
  product_name: string;
  price: string;
  stock: number;
}

interface CustomerHomeProps {
  onLogout: () => void;
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

function CustomerHome({ onLogout }: CustomerHomeProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");

  const getProducts = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/api/products`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Gagal mengambil data produk"
        );
      }

      setProducts(
        Array.isArray(data.data)
          ? data.data
          : []
      );
    } catch (err) {
      console.error("GET PRODUCTS ERROR:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Gagal mengambil data produk"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getProducts();
  }, []);

  const formatRupiah = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="customer-page">
      <header className="customer-header">
        <div>
          <h1>POS Store</h1>
          <p>Temukan produk yang kamu butuhkan</p>
        </div>

        <div className="customer-header-right">
          <ThemeToggle />

          <button
            className="customer-logout"
            onClick={onLogout}
          >
            Logout
          </button>
        </div>
      </header>

      <main className="customer-content">
        <div className="customer-heading">
          <h2>Produk</h2>
          <p>Produk yang tersedia</p>
        </div>

        {loading && (
          <div className="customer-state">
            <div className="customer-loading"></div>
            <p>Memuat produk...</p>
          </div>
        )}

        {!loading && error && (
          <div className="customer-state">
            <div className="customer-state-icon">!</div>
            <h3>Gagal memuat produk</h3>
            <p>{error}</p>

            <button
              className="customer-retry"
              onClick={getProducts}
            >
              Coba Lagi
            </button>
          </div>
        )}

        {!loading &&
          !error &&
          products.length === 0 && (
            <div className="customer-state">
              <div className="customer-state-icon">
                P
              </div>
              <h3>Belum ada produk</h3>
              <p>Belum ada produk yang tersedia.</p>
            </div>
          )}

        {!loading &&
          !error &&
          products.length > 0 && (
            <div className="customer-product-grid">
              {products.map((product) => (
                <div
                  className="customer-product-card"
                  key={product.id}
                >
                  <div className="customer-product-category">
                    {product.category_name}
                  </div>

                  <h3>{product.product_name}</h3>

                  <strong>
                    {formatRupiah(
                      Number(product.price)
                    )}
                  </strong>

                  <p>
                    Stok tersedia: {product.stock}
                  </p>

                  <button
                    className="customer-buy-button"
                    disabled={product.stock <= 0}
                  >
                    {product.stock <= 0
                      ? "Stok Habis"
                      : "Beli"}
                  </button>
                </div>
              ))}
            </div>
          )}
      </main>

      <Footer />
    </div>
  );
}

export default CustomerHome;