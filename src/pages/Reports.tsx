import { useEffect, useState } from "react";
import "./Reports.css";

type ReportRow = Record<string, string | number | null>;

type GroupBy = "day" | "product" | "payment_method";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:3000";

const todayString = () => {
  const d = new Date();
  const pad = (n: number) =>
    String(n).padStart(2, "0");

  return `${d.getFullYear()}-${pad(
    d.getMonth() + 1
  )}-${pad(d.getDate())}`;
};

const monthAgoString = () => {
  const d = new Date();
  d.setDate(d.getDate() - 29);
  const pad = (n: number) =>
    String(n).padStart(2, "0");

  return `${d.getFullYear()}-${pad(
    d.getMonth() + 1
  )}-${pad(d.getDate())}`;
};

const formatRupiah = (value: number | string | null) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(Number(value) || 0);
};

const formatLabel = (
  group: GroupBy,
  value: string | number | null
) => {
  if (value === null || value === undefined) {
    return "-";
  }

  if (group === "day") {
    const raw = String(value);

    const iso = raw.includes("T")
      ? raw
      : `${raw}T00:00:00`;

    const date = new Date(iso);

    if (Number.isNaN(date.getTime())) {
      return raw;
    }

    return date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  return String(value);
};

function Reports() {
  const [from, setFrom] = useState(monthAgoString());
  const [to, setTo] = useState(todayString());
  const [groupBy, setGroupBy] =
    useState<GroupBy>("day");

  const [rows, setRows] = useState<ReportRow[]>([]);
  const [totals, setTotals] = useState({
    transactions: 0,
    revenue: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");

  const fetchReport = async (
    fromDate: string,
    toDate: string,
    group: GroupBy
  ) => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams({
        from: fromDate,
        to: toDate,
        group_by: group,
      });

      const response = await fetch(
        `${API_URL}/api/reports/sales?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Gagal mengambil laporan"
        );
      }

      setRows(result.data?.rows || []);
      setTotals({
        transactions: Number(
          result.data?.totals?.transactions || 0
        ),
        revenue: Number(
          result.data?.totals?.revenue || 0
        ),
      });
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport(from, to, groupBy);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault();
    fetchReport(from, to, groupBy);
  };

  const handleExportCsv = () => {
    const header = [
      "Label",
      "Transaksi",
      groupBy === "payment_method" ? "" : "Item",
      "Omzet",
    ].filter(Boolean);

    const lines = rows.map((row) => {
      const cells = [
        formatLabel(groupBy, row.label),
        row.transactions ?? 0,
        ...(groupBy === "payment_method"
          ? []
          : [row.items ?? 0]),
        row.revenue ?? 0,
      ];

      return cells
        .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
        .join(";");
    });

    const csv = [header.join(";"), ...lines].join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `laporan-${groupBy}-${from}-${to}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="reports-section">
      <div className="reports-header">
        <div>
          <div className="page-label">OPERASIONAL</div>
          <h2>Laporan Penjualan</h2>
          <p>
            Rekap omzet berdasarkan tanggal, produk,
            atau metode pembayaran.
          </p>
        </div>

        <button
          className="export-button"
          onClick={handleExportCsv}
          disabled={loading || rows.length === 0}
        >
          Export CSV
        </button>
      </div>

      <form
        className="reports-filter"
        onSubmit={handleFilter}
      >
        <div className="filter-field">
          <label htmlFor="report-from">Dari</label>
          <input
            id="report-from"
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </div>

        <div className="filter-field">
          <label htmlFor="report-to">Sampai</label>
          <input
            id="report-to"
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </div>

        <div className="filter-field">
          <label htmlFor="report-group">
            Kelompokkan
          </label>
          <select
            id="report-group"
            value={groupBy}
            onChange={(e) =>
              setGroupBy(e.target.value as GroupBy)
            }
          >
            <option value="day">Per Hari</option>
            <option value="product">Per Produk</option>
            <option value="payment_method">
              Per Metode Bayar
            </option>
          </select>
        </div>

        <button
          type="submit"
          className="filter-button"
          disabled={loading}
        >
          {loading ? "Memuat..." : "Tampilkan"}
        </button>
      </form>

      <div className="reports-summary">
        <div className="report-stat-card">
          <span>Total Transaksi</span>
          <strong>{totals.transactions}</strong>
        </div>

        <div className="report-stat-card">
          <span>Total Omzet</span>
          <strong>{formatRupiah(totals.revenue)}</strong>
        </div>
      </div>

      {error && (
        <div className="reports-error" role="alert">
          <span>!</span>
          {error}
        </div>
      )}

      <div className="reports-table-card">
        <div className="table-top">
          <div>
            <h3>Hasil Laporan</h3>
            <span>{rows.length} baris data</span>
          </div>
        </div>

        <div className="table-wrapper">
          <table className="reports-table">
            <thead>
              <tr>
                <th>
                  {groupBy === "day"
                    ? "Tanggal"
                    : groupBy === "product"
                      ? "Produk"
                      : "Metode"}
                </th>
                <th>Transaksi</th>
                {groupBy !== "payment_method" && (
                  <th>Item</th>
                )}
                <th>Omzet</th>
              </tr>
            </thead>

            <tbody>
              {rows.length === 0 && !loading && (
                <tr>
                  <td
                    colSpan={
                      groupBy === "payment_method"
                        ? 3
                        : 4
                    }
                  >
                    Tidak ada data pada rentang ini.
                  </td>
                </tr>
              )}

              {rows.map((row, index) => (
                <tr key={index}>
                  <td>
                    {formatLabel(groupBy, row.label)}
                  </td>
                  <td>{row.transactions ?? 0}</td>
                  {groupBy !== "payment_method" && (
                    <td>{row.items ?? 0}</td>
                  )}
                  <td>
                    <strong className="report-revenue">
                      {formatRupiah(
                        Number(row.revenue || 0)
                      )}
                    </strong>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

export default Reports;
