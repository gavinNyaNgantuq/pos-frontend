import { useEffect, useState } from "react";
import "./AdminHome.css";
import "../components/admin-system.css";
import Footer from "../components/Footer";
import ThemeToggle from "../components/ThemeToggle";

import Products from "./Products";
import Users from "./Users";
import Categories from "./Categories";
import Taxes from "./Taxes";
import Roles from "./Roles";
import Promotions from "./Promotions";
import Reports from "./Reports";
import Shifts from "./Shifts";
import AuditLogs from "./AuditLogs";

type Menu =
  | "dashboard"
  | "products"
  | "users"
  | "categories"
  | "taxes"
  | "roles"
  | "promotions"
  | "reports"
  | "shifts"
  | "audit-logs";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:3000";

const formatRupiah = (value: number | string | null) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(Number(value) || 0);
};

type DashboardStats = {
  revenue_today: number;
  transactions_today: number;
  items_today: number;
  revenue_7d: number;
  low_stock_count: number;
  top_products: Array<{
    product_id: number;
    product_name: string;
    qty: number | string;
    revenue: number | string;
  }>;
};

function AdminHome() {
  const [menu, setMenu] = useState<Menu>("dashboard");
  const [sidebarOpen, setSidebarOpen] =
    useState(false);

  const [stats, setStats] =
    useState<DashboardStats | null>(null);
  const [statsLoading, setStatsLoading] =
    useState(false);

  const userData = localStorage.getItem("user");

  let user: {
    username?: string;
    email?: string;
    role?: string;
  } | null = null;

  try {
    user = userData ? JSON.parse(userData) : null;
  } catch {
    user = null;
  }

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    window.location.reload();
  };

  useEffect(() => {
    if (menu !== "dashboard") {
      return;
    }

    const fetchStats = async () => {
      try {
        setStatsLoading(true);

        const token = localStorage.getItem("token");

        const response = await fetch(
          `${API_URL}/api/dashboard/stats`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const result = await response.json();

        if (response.ok) {
          setStats(result.data || null);
        }
      } catch {
        // statistik opsional — dashboard tetap tampil
      } finally {
        setStatsLoading(false);
      }
    };

    fetchStats();
  }, [menu]);

  const getTitle = () => {
    switch (menu) {
      case "products":
        return "Produk";

      case "users":
        return "User";

      case "categories":
        return "Kategori";

      case "taxes":
        return "Tax";

      case "roles":
        return "Role";

      case "promotions":
        return "Promosi";

      case "reports":
        return "Laporan";

      case "shifts":
        return "Shift";

      case "audit-logs":
        return "Audit Log";

      default:
        return "Dashboard";
    }
  };

  const getDescription = () => {
    switch (menu) {
      case "products":
        return "Kelola data produk dan stok.";

      case "users":
        return "Kelola pengguna yang terdaftar di sistem.";

      case "categories":
        return "Kelola kategori produk.";

      case "taxes":
        return "Kelola data pajak.";

      case "roles":
        return "Kelola role pengguna.";

      case "promotions":
        return "Kelola kode promo transaksi.";

      case "reports":
        return "Rekap penjualan dan omzet.";

      case "shifts":
        return "Riwayat shift kasir.";

      case "audit-logs":
        return "Jejak aktivitas sistem.";

      default:
        return "Kelola data dan konfigurasi POS.";
    }
  };

  const renderContent = () => {
    switch (menu) {
      case "products":
        return <Products />;

      case "users":
        return <Users />;

      case "categories":
        return <Categories />;

      case "taxes":
        return <Taxes />;

      case "roles":
        return <Roles />;

      case "promotions":
        return <Promotions />;

      case "reports":
        return <Reports />;

      case "shifts":
        return <Shifts />;

      case "audit-logs":
        return <AuditLogs />;

      case "dashboard":
      default:
        return (
          <div className="dashboard-content">
            <section className="dashboard-intro">
              <p className="dashboard-eyebrow">ADMIN</p>

              <h2>
                Selamat datang, {user?.username || "Admin"}
              </h2>

              <p>
                Gunakan menu di sebelah kiri untuk mengelola
                data pada sistem POS.
              </p>
            </section>

            <section className="dashboard-section">
              <div className="section-heading">
                <div>
                  <h3>Ringkasan Penjualan</h3>

                  <p>
                    Data nyata dari transaksi hari ini
                    dan 7 hari terakhir.
                  </p>
                </div>
              </div>

              <div className="dashboard-stats">
                <div className="dashboard-stat-card">
                  <span>Omzet Hari Ini</span>
                  <strong>
                    {statsLoading
                      ? "…"
                      : formatRupiah(
                          stats?.revenue_today ?? null
                        )}
                  </strong>
                </div>

                <div className="dashboard-stat-card">
                  <span>Transaksi Hari Ini</span>
                  <strong>
                    {statsLoading
                      ? "…"
                      : (stats?.transactions_today ?? 0)}
                  </strong>
                </div>

                <div className="dashboard-stat-card">
                  <span>Omzet 7 Hari</span>
                  <strong>
                    {statsLoading
                      ? "…"
                      : formatRupiah(
                          stats?.revenue_7d ?? null
                        )}
                  </strong>
                </div>

                <div className="dashboard-stat-card">
                  <span>Stok Menipis</span>
                  <strong>
                    {statsLoading
                      ? "…"
                      : (stats?.low_stock_count ?? 0)}
                  </strong>
                </div>
              </div>
            </section>

            {stats &&
              stats.top_products.length > 0 && (
                <section className="dashboard-section">
                  <div className="section-heading">
                    <div>
                      <h3>Produk Terlaris</h3>

                      <p>
                        5 produk dengan penjualan terbanyak
                        30 hari terakhir.
                      </p>
                    </div>
                  </div>

                  <div className="dashboard-menu-list">
                    {stats.top_products.map(
                      (item, index) => (
                        <div
                          className="dashboard-menu-item static"
                          key={item.product_id}
                        >
                          <div className="menu-item-number">
                            {String(index + 1).padStart(
                              2,
                              "0"
                            )}
                          </div>

                          <div className="menu-item-content">
                            <strong>
                              {item.product_name}
                            </strong>

                            <span>
                              {item.qty} terjual •{" "}
                              {formatRupiah(
                                item.revenue
                              )}
                            </span>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </section>
              )}

            <section className="dashboard-section">
              <div className="section-heading">
                <div>
                  <h3>Master Data</h3>

                  <p>
                    Akses data yang dapat dikelola dari dashboard.
                  </p>
                </div>
              </div>

              <div className="dashboard-menu-list">
                <button
                  className="dashboard-menu-item"
                  onClick={() => selectMenu("products")}
                >
                  <div className="menu-item-number">01</div>

                  <div className="menu-item-content">
                    <strong>Produk</strong>

                    <span>
                      Produk, harga, kategori, dan stok.
                    </span>
                  </div>

                  <span className="menu-item-arrow">→</span>
                </button>

                <button
                  className="dashboard-menu-item"
                  onClick={() => selectMenu("users")}
                >
                  <div className="menu-item-number">02</div>

                  <div className="menu-item-content">
                    <strong>User</strong>

                    <span>
                      Data pengguna dan akun sistem.
                    </span>
                  </div>

                  <span className="menu-item-arrow">→</span>
                </button>

                <button
                  className="dashboard-menu-item"
                  onClick={() => selectMenu("categories")}
                >
                  <div className="menu-item-number">03</div>

                  <div className="menu-item-content">
                    <strong>Kategori</strong>

                    <span>
                      Pengelompokan kategori produk.
                    </span>
                  </div>

                  <span className="menu-item-arrow">→</span>
                </button>

                <button
                  className="dashboard-menu-item"
                  onClick={() => selectMenu("taxes")}
                >
                  <div className="menu-item-number">04</div>

                  <div className="menu-item-content">
                    <strong>Tax</strong>

                    <span>
                      Pengaturan pajak yang digunakan POS.
                    </span>
                  </div>

                  <span className="menu-item-arrow">→</span>
                </button>

                <button
                  className="dashboard-menu-item"
                  onClick={() => selectMenu("roles")}
                >
                  <div className="menu-item-number">05</div>

                  <div className="menu-item-content">
                    <strong>Role</strong>

                    <span>
                      Pengaturan role pengguna.
                    </span>
                  </div>

                  <span className="menu-item-arrow">→</span>
                </button>
              </div>
            </section>

            <section className="dashboard-section">
              <div className="section-heading">
                <div>
                  <h3>Operasional & Sistem</h3>

                  <p>
                    Promo, laporan, shift, dan jejak
                    aktivitas.
                  </p>
                </div>
              </div>

              <div className="dashboard-menu-list">
                <button
                  className="dashboard-menu-item"
                  onClick={() => selectMenu("promotions")}
                >
                  <div className="menu-item-number">06</div>

                  <div className="menu-item-content">
                    <strong>Promosi</strong>

                    <span>
                      Kode promo untuk transaksi kasir.
                    </span>
                  </div>

                  <span className="menu-item-arrow">→</span>
                </button>

                <button
                  className="dashboard-menu-item"
                  onClick={() => selectMenu("reports")}
                >
                  <div className="menu-item-number">07</div>

                  <div className="menu-item-content">
                    <strong>Laporan</strong>

                    <span>
                      Rekap penjualan dan omzet.
                    </span>
                  </div>

                  <span className="menu-item-arrow">→</span>
                </button>

                <button
                  className="dashboard-menu-item"
                  onClick={() => selectMenu("shifts")}
                >
                  <div className="menu-item-number">08</div>

                  <div className="menu-item-content">
                    <strong>Shift</strong>

                    <span>
                      Riwayat buka dan tutup shift kasir.
                    </span>
                  </div>

                  <span className="menu-item-arrow">→</span>
                </button>

                <button
                  className="dashboard-menu-item"
                  onClick={() => selectMenu("audit-logs")}
                >
                  <div className="menu-item-number">09</div>

                  <div className="menu-item-content">
                    <strong>Audit Log</strong>

                    <span>
                      Jejak aktivitas penting sistem.
                    </span>
                  </div>

                  <span className="menu-item-arrow">→</span>
                </button>
              </div>
            </section>
          </div>
        );
    }
  };

  const menuButtonClass = (item: Menu) => {
    return menu === item
      ? "sidebar-button active"
      : "sidebar-button";
  };

  const selectMenu = (item: Menu) => {
    setMenu(item);
    setSidebarOpen(false);
  };

  return (
    <div
      className={
        sidebarOpen
          ? "admin-layout sidebar-open"
          : "admin-layout"
      }
    >
      {sidebarOpen && (
        <button
          type="button"
          className="sidebar-scrim"
          aria-label="Tutup navigasi"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <div className="brand-mark">a</div>

          <div>
            <h2>airus</h2>
            <span>Administration</span>
          </div>
        </div>

        <nav className="sidebar-menu">
          <div className="sidebar-group">
            <p className="sidebar-label">MAIN</p>

            <button
              className={menuButtonClass("dashboard")}
              onClick={() => selectMenu("dashboard")}
            >
              <span className="sidebar-icon">D</span>
              <span>Dashboard</span>
            </button>
          </div>

          <div className="sidebar-group">
            <p className="sidebar-label">MASTER DATA</p>

            <button
              className={menuButtonClass("products")}
              onClick={() => selectMenu("products")}
            >
              <span className="sidebar-icon">P</span>
              <span>Produk</span>
            </button>

            <button
              className={menuButtonClass("users")}
              onClick={() => selectMenu("users")}
            >
              <span className="sidebar-icon">U</span>
              <span>User</span>
            </button>

            <button
              className={menuButtonClass("categories")}
              onClick={() => selectMenu("categories")}
            >
              <span className="sidebar-icon">K</span>
              <span>Kategori</span>
            </button>

            <button
              className={menuButtonClass("taxes")}
              onClick={() => selectMenu("taxes")}
            >
              <span className="sidebar-icon">T</span>
              <span>Tax</span>
            </button>

            <button
              className={menuButtonClass("roles")}
              onClick={() => selectMenu("roles")}
            >
              <span className="sidebar-icon">R</span>
              <span>Role</span>
            </button>
          </div>

          <div className="sidebar-group">
            <p className="sidebar-label">OPERASIONAL</p>

            <button
              className={menuButtonClass("promotions")}
              onClick={() => selectMenu("promotions")}
            >
              <span className="sidebar-icon">%</span>
              <span>Promosi</span>
            </button>

            <button
              className={menuButtonClass("reports")}
              onClick={() => selectMenu("reports")}
            >
              <span className="sidebar-icon">L</span>
              <span>Laporan</span>
            </button>

            <button
              className={menuButtonClass("shifts")}
              onClick={() => selectMenu("shifts")}
            >
              <span className="sidebar-icon">S</span>
              <span>Shift</span>
            </button>
          </div>

          <div className="sidebar-group">
            <p className="sidebar-label">SISTEM</p>

            <button
              className={menuButtonClass("audit-logs")}
              onClick={() => selectMenu("audit-logs")}
            >
              <span className="sidebar-icon">A</span>
              <span>Audit Log</span>
            </button>
          </div>
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-account">
            <div className="account-avatar">
              {(user?.username || "A")
                .charAt(0)
                .toUpperCase()}
            </div>

            <div className="account-info">
              <strong>
                {user?.username || "Admin"}
              </strong>

              <span>Administrator</span>
            </div>
          </div>

          <button
            className="logout-button"
            onClick={handleLogout}
          >
            Keluar
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <button
            type="button"
            className="topbar-menu-button"
            aria-label="Buka navigasi"
            aria-expanded={sidebarOpen}
            onClick={() => setSidebarOpen(true)}
          >
            ☰
          </button>

          <div className="topbar-title">
            <h1>{getTitle()}</h1>

            <p>{getDescription()}</p>
          </div>

          <div className="topbar-actions">
            <ThemeToggle />
          </div>
        </header>

        <div className="admin-content">
          {renderContent()}
        </div>

        <Footer />
      </main>
    </div>
  );
}

export default AdminHome;