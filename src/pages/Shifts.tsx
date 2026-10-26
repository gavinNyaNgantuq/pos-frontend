import { useEffect, useState } from "react";
import "./Shifts.css";

type Shift = {
  id: number;
  user_id: number;
  username: string | null;
  opened_at: string;
  opening_cash: number | string;
  closed_at: string | null;
  closing_cash: number | string | null;
  expected_cash: number | string | null;
  diff: number | string | null;
  status: "open" | "closed";
  notes: string | null;
};

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

const formatDateTime = (value: string | null) => {
  if (!value) return "—";

  return new Date(value).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

function Shifts() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");

  const fetchShifts = async (pageNumber: number) => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams({
        page: String(pageNumber),
        limit: "20",
      });

      const response = await fetch(
        `${API_URL}/api/shifts?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Gagal mengambil data shift"
        );
      }

      setShifts(result.data || []);
      setTotal(Number(result.pagination?.total || 0));
      setPage(Number(result.pagination?.page || 1));
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShifts(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatDiff = (value: number | string | null) => {
    if (value === null || value === undefined) {
      return "—";
    }

    const num = Number(value);

    if (num === 0) return "Pas";
    if (num > 0) return `+${formatRupiah(num)}`;

    return `-${formatRupiah(Math.abs(num))}`;
  };

  if (loading) {
    return (
      <section className="shifts-section">
        <div className="shifts-state">
          <div className="loading-spinner"></div>
          <h3>Memuat shift...</h3>
          <p>Data shift sedang diambil dari server.</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="shifts-section">
        <div className="shifts-state error-state">
          <div className="state-icon">!</div>
          <h3>Gagal memuat shift</h3>
          <p>{error}</p>
          <button
            className="retry-button"
            onClick={() => fetchShifts(1)}
          >
            Coba Lagi
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="shifts-section">
      <div className="shifts-header">
        <div>
          <div className="page-label">OPERASIONAL</div>
          <h2>Shift Kasir</h2>
          <p>
            Riwayat buka dan tutup shift. Buka/tutup
            shift dilakukan dari halaman kasir.
          </p>
        </div>
      </div>

      <div className="shifts-table-card">
        <div className="table-top">
          <div>
            <h3>Riwayat Shift</h3>
            <span>{total} shift tercatat</span>
          </div>
        </div>

        <div className="table-wrapper">
          <table className="shifts-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Kasir</th>
                <th>Dibuka</th>
                <th>Modal</th>
                <th>Ditutup</th>
                <th>Selisih</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {shifts.length === 0 && (
                <tr>
                  <td colSpan={7}>Belum ada shift.</td>
                </tr>
              )}

              {shifts.map((shift) => (
                <tr key={shift.id}>
                  <td>
                    <span className="shift-id">
                      #{shift.id}
                    </span>
                  </td>

                  <td>{shift.username || "—"}</td>

                  <td>
                    {formatDateTime(shift.opened_at)}
                  </td>

                  <td>
                    {formatRupiah(shift.opening_cash)}
                  </td>

                  <td>
                    {formatDateTime(shift.closed_at)}
                  </td>

                  <td>
                    <strong className="shift-diff">
                      {formatDiff(shift.diff)}
                    </strong>
                  </td>

                  <td>
                    <span
                      className={
                        shift.status === "open"
                          ? "status-badge open"
                          : "status-badge"
                      }
                    >
                      <span className="status-dot"></span>
                      {shift.status === "open"
                        ? "Terbuka"
                        : "Tutup"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="shifts-pagination">
          <button
            type="button"
            onClick={() => fetchShifts(page - 1)}
            disabled={page <= 1 || loading}
          >
            Sebelumnya
          </button>

          <span>Halaman {page}</span>

          <button
            type="button"
            onClick={() => fetchShifts(page + 1)}
            disabled={loading || shifts.length < 20}
          >
            Berikutnya
          </button>
        </div>
      </div>
    </section>
  );
}

export default Shifts;
