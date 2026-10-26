import { useEffect, useState } from "react";
import "./History.css";
import Footer from "../components/Footer";
import ThemeToggle from "../components/ThemeToggle";

interface Transaction {
  id: number;
  invoice_no?: string | null;
  user_id: number;
  username: string;
  total_before_discount: number | string | null;
  discount: number | string | null;
  total_after_discount: number | string | null;
  total_before_tax: number | string | null;
  tax_id?: number | null;
  tax_name?: string | null;
  tax_rate?: number | string | null;
  tax_amount?: number | string | null;
  total_after_tax: number | string | null;
  payment: number | string | null;
  payment_method?: string | null;
  change: number | string | null;
  status: number;
  created_at: string;
}

interface HistoryProps {
  onBack: () => void;
  onViewBill: (transactionId: number) => void;
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

function History({
  onBack,
  onViewBill,
}: HistoryProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");

  const formatRupiah = (
    value: number | string | null
  ) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(Number(value) || 0);
  };

  const formatDate = (date: string) => {
    if (!date) {
      return "-";
    }

    return new Date(date).toLocaleString("id-ID", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTransactions = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/api/transactions`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Gagal mengambil riwayat transaksi"
        );
      }

      const transactionData = Array.isArray(data.data)
        ? data.data
        : [];

      transactionData.sort(
        (a: Transaction, b: Transaction) =>
          new Date(b.created_at).getTime() -
          new Date(a.created_at).getTime()
      );

      setTransactions(transactionData);
    } catch (err) {
      console.error(
        "GET TRANSACTION HISTORY ERROR:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Gagal mengambil riwayat transaksi"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getTransactions();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    window.location.reload();
  };

  return (
    <div className="history-page">
      <header className="history-header">
        <div className="history-header-left">
          <button
            type="button"
            className="history-back-button"
            onClick={onBack}
          >
            Kembali
          </button>

          <div>
            <span className="history-label">
              TRANSAKSI
            </span>
            <h1>Riwayat Transaksi</h1>
          </div>
        </div>

        <div className="history-header-right">
          <ThemeToggle />

          <button
            type="button"
            className="history-logout-button"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </header>

      <main className="history-content">
        <div className="history-title-row">
          <div>
            <h2>Daftar Transaksi</h2>
            <p>
              Riwayat transaksi yang sudah tercatat
              dalam sistem.
            </p>
          </div>

          {!loading && !error && (
            <span className="history-count">
              {transactions.length} transaksi
            </span>
          )}
        </div>

        {loading && (
          <div className="history-state">
            <div className="history-spinner"></div>
            <p>Memuat riwayat transaksi...</p>
          </div>
        )}

        {!loading && error && (
          <div className="history-state history-error">
            <h3>Gagal memuat transaksi</h3>
            <p>{error}</p>

            <button
              type="button"
              onClick={getTransactions}
            >
              Coba Lagi
            </button>
          </div>
        )}

        {!loading &&
          !error &&
          transactions.length === 0 && (
            <div className="history-state">
              <div className="history-empty-icon">
                -
              </div>

              <h3>Belum ada transaksi</h3>
              <p>
                Belum ada transaksi yang tercatat.
              </p>
            </div>
          )}

        {!loading &&
          !error &&
          transactions.length > 0 && (
            <div className="history-table-wrapper">
              <table className="history-table">
                <thead>
                  <tr>
                    <th>No. Transaksi</th>
                    <th>Tanggal</th>
                    <th>Kasir</th>
                    <th>Pembayaran</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>

                <tbody>
                  {transactions.map(
                    (transaction) => (
                      <tr key={transaction.id}>
                        <td>
                          <strong>
                            {transaction.invoice_no ||
                              `#${transaction.id}`}
                          </strong>
                        </td>

                        <td>
                          {formatDate(
                            transaction.created_at
                          )}
                        </td>

                        <td>
                          {transaction.username ||
                            "-"}
                        </td>

                        <td>
                          <span className="payment-method">
                            {transaction.payment_method
                              ? transaction.payment_method.toUpperCase()
                              : "-"}
                          </span>
                        </td>

                        <td>
                          <strong>
                            {formatRupiah(
                              transaction.total_after_tax
                            )}
                          </strong>
                        </td>

                        <td>
                          <span
                            className={
                              transaction.status ===
                              1
                                ? "status-active"
                                : "status-inactive"
                            }
                          >
                            {transaction.status ===
                            1
                              ? "Selesai"
                              : "Tidak Aktif"}
                          </span>
                        </td>

                        <td>
                          <button
                            type="button"
                            className="history-detail-button"
                            onClick={() =>
                              onViewBill(
                                transaction.id
                              )
                            }
                          >
                            Lihat Bill
                          </button>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
      </main>

      <Footer />
    </div>
  );
}

export default History;