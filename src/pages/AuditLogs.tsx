import { useEffect, useState } from "react";
import "./AuditLogs.css";

type AuditLog = {
  id: number;
  user_id: number | null;
  username: string | null;
  action: string;
  entity: string;
  entity_id: number | null;
  meta: string | null;
  ip: string | null;
  created_at: string;
};

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:3000";

const formatDateTime = (value: string) => {
  return new Date(value).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  const [entityFilter, setEntityFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");

  const fetchLogs = async (
    pageNumber: number,
    entity: string,
    action: string
  ) => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams({
        page: String(pageNumber),
        limit: "20",
      });

      if (entity) params.set("entity", entity);
      if (action) params.set("action", action);

      const response = await fetch(
        `${API_URL}/api/audit-logs?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Gagal mengambil audit log"
        );
      }

      setLogs(result.data || []);
      setTotal(Number(result.pagination?.total || 0));
      setPage(Number(result.pagination?.page || 1));
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(1, "", "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLogs(1, entityFilter, actionFilter);
  };

  if (loading) {
    return (
      <section className="audit-section">
        <div className="audit-state">
          <div className="loading-spinner"></div>
          <h3>Memuat audit log...</h3>
          <p>Data audit sedang diambil dari server.</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="audit-section">
        <div className="audit-state error-state">
          <div className="state-icon">!</div>
          <h3>Gagal memuat audit log</h3>
          <p>{error}</p>
          <button
            className="retry-button"
            onClick={() =>
              fetchLogs(1, entityFilter, actionFilter)
            }
          >
            Coba Lagi
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="audit-section">
      <div className="audit-header">
        <div>
          <div className="page-label">SISTEM</div>
          <h2>Audit Log</h2>
          <p>
            Jejak aktivitas penting. Data bersifat
            append-only dan tidak dapat diubah.
          </p>
        </div>
      </div>

      <form
        className="audit-filter"
        onSubmit={handleFilter}
      >
        <div className="filter-field">
          <label htmlFor="audit-entity">Entitas</label>
          <select
            id="audit-entity"
            value={entityFilter}
            onChange={(e) =>
              setEntityFilter(e.target.value)
            }
          >
            <option value="">Semua</option>
            <option value="user">User</option>
            <option value="product">Produk</option>
            <option value="promotion">Promo</option>
            <option value="transaction">Transaksi</option>
            <option value="shift">Shift</option>
          </select>
        </div>

        <div className="filter-field">
          <label htmlFor="audit-action">Aksi</label>
          <input
            id="audit-action"
            type="text"
            placeholder="mis. checkout"
            value={actionFilter}
            onChange={(e) =>
              setActionFilter(e.target.value)
            }
          />
        </div>

        <button
          type="submit"
          className="filter-button"
          disabled={loading}
        >
          {loading ? "Memuat..." : "Filter"}
        </button>
      </form>

      <div className="audit-table-card">
        <div className="table-top">
          <div>
            <h3>Riwayat Aktivitas</h3>
            <span>{total} kejadian tercatat</span>
          </div>
        </div>

        <div className="table-wrapper">
          <table className="audit-table">
            <thead>
              <tr>
                <th>Waktu</th>
                <th>User</th>
                <th>Aksi</th>
                <th>Entitas</th>
                <th>ID</th>
              </tr>
            </thead>

            <tbody>
              {logs.length === 0 && (
                <tr>
                  <td colSpan={5}>
                    Belum ada aktivitas tercatat.
                  </td>
                </tr>
              )}

              {logs.map((log) => (
                <tr key={log.id}>
                  <td>
                    {formatDateTime(log.created_at)}
                  </td>
                  <td>{log.username || "—"}</td>
                  <td>
                    <span className="audit-action">
                      {log.action}
                    </span>
                  </td>
                  <td>{log.entity}</td>
                  <td>
                    {log.entity_id === null
                      ? "—"
                      : log.entity_id}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="audit-pagination">
          <button
            type="button"
            onClick={() =>
              fetchLogs(
                page - 1,
                entityFilter,
                actionFilter
              )
            }
            disabled={page <= 1 || loading}
          >
            Sebelumnya
          </button>

          <span>Halaman {page}</span>

          <button
            type="button"
            onClick={() =>
              fetchLogs(
                page + 1,
                entityFilter,
                actionFilter
              )
            }
            disabled={loading || logs.length < 20}
          >
            Berikutnya
          </button>
        </div>
      </div>
    </section>
  );
}

export default AuditLogs;
