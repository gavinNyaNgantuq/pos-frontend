import { useEffect, useState } from "react";
import "./Promotions.css";

type Promotion = {
  id: number;
  code: string;
  type: "percent" | "nominal";
  value: number | string;
  min_purchase: number | string;
  quota: number | null;
  used: number;
  starts_at: string | null;
  ends_at: string | null;
  status: number;
};

type PromotionForm = {
  code: string;
  type: "percent" | "nominal";
  value: string;
  min_purchase: string;
  quota: string;
  starts_at: string;
  ends_at: string;
};

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:3000";

const toInputDateTime = (
  value: string | null
) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) =>
    String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
    d.getDate()
  )}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const formatRupiah = (value: number | string | null) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(Number(value) || 0);
};

function Promotions() {
  const [promotions, setPromotions] = useState<
    Promotion[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] =
    useState<number | null>(null);

  const [form, setForm] = useState<PromotionForm>({
    code: "",
    type: "percent",
    value: "",
    min_purchase: "0",
    quota: "",
    starts_at: "",
    ends_at: "",
  });

  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<
    number | null
  >(null);

  const token = localStorage.getItem("token");

  const fetchPromotions = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/api/promotions`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Gagal mengambil data promo"
        );
      }

      setPromotions(result.data || []);
    } catch (err: any) {
      setError(
        err.message || "Terjadi kesalahan."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromotions();
  }, []);

  const openAddModal = () => {
    setEditingId(null);

    setForm({
      code: "",
      type: "percent",
      value: "",
      min_purchase: "0",
      quota: "",
      starts_at: "",
      ends_at: "",
    });

    setFormError("");
    setShowModal(true);
  };

  const openEditModal = (promo: Promotion) => {
    setEditingId(promo.id);

    setForm({
      code: promo.code,
      type: promo.type,
      value: promo.value.toString(),
      min_purchase: promo.min_purchase.toString(),
      quota:
        promo.quota === null
          ? ""
          : promo.quota.toString(),
      starts_at: toInputDateTime(promo.starts_at),
      ends_at: toInputDateTime(promo.ends_at),
    });

    setFormError("");
    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setEditingId(null);
    setFormError("");
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (form.code.trim() === "") {
      setFormError("Kode promo wajib diisi.");
      return;
    }

    if (
      form.value === "" ||
      Number(form.value) < 0
    ) {
      setFormError("Nilai promo tidak valid.");
      return;
    }

    if (
      form.type === "percent" &&
      Number(form.value) > 100
    ) {
      setFormError("Promo persen maksimal 100.");
      return;
    }

    try {
      setSaving(true);
      setFormError("");

      const body: Record<string, unknown> = {
        code: form.code.trim().toUpperCase(),
        type: form.type,
        value: Number(form.value),
        min_purchase: Number(form.min_purchase) || 0,
      };

      if (form.quota.trim() !== "") {
        body.quota = Number(form.quota);
      }

      if (form.starts_at) {
        body.starts_at = new Date(
          form.starts_at
        )
          .toISOString()
          .slice(0, 19)
          .replace("T", " ");
      }

      if (form.ends_at) {
        body.ends_at = new Date(form.ends_at)
          .toISOString()
          .slice(0, 19)
          .replace("T", " ");
      }

      const url = editingId
        ? `${API_URL}/api/promotions/${editingId}`
        : `${API_URL}/api/promotions`;

      const response = await fetch(url, {
        method: editingId ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Gagal menyimpan promo"
        );
      }

      await fetchPromotions();
      closeModal();
    } catch (err: any) {
      setFormError(err.message || "Terjadi kesalahan.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (
      !window.confirm("Yakin ingin menghapus promo ini?")
    ) {
      return;
    }

    try {
      setDeletingId(id);

      const response = await fetch(
        `${API_URL}/api/promotions/${id}`,
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
          result.message || "Gagal menghapus promo"
        );
      }

      await fetchPromotions();
    } catch (err: any) {
      alert(err.message || "Gagal menghapus promo");
    } finally {
      setDeletingId(null);
    }
  };

  const formatValue = (promo: Promotion) => {
    if (promo.type === "percent") {
      return `${promo.value}%`;
    }

    return formatRupiah(promo.value);
  };

  if (loading) {
    return (
      <section className="promotions-section">
        <div className="promotions-state">
          <div className="loading-spinner"></div>
          <h3>Memuat promo...</h3>
          <p>Data promo sedang diambil dari server.</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="promotions-section">
        <div className="promotions-state error-state">
          <div className="state-icon">!</div>
          <h3>Gagal memuat promo</h3>
          <p>{error}</p>
          <button
            className="retry-button"
            onClick={fetchPromotions}
          >
            Coba Lagi
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="promotions-section">
      <div className="promotions-header">
        <div>
          <div className="page-label">OPERASIONAL</div>
          <h2>Promosi</h2>
          <p>
            Kelola kode promo untuk transaksi kasir.
          </p>
        </div>

        <button
          className="add-promotion-button"
          onClick={openAddModal}
        >
          <span>+</span>
          Tambah Promo
        </button>
      </div>

      <div className="promotions-table-card">
        <div className="table-top">
          <div>
            <h3>Daftar Promo</h3>
            <span>
              {promotions.length} promo aktif
            </span>
          </div>
        </div>

        <div className="table-wrapper">
          <table className="promotions-table">
            <thead>
              <tr>
                <th>Kode</th>
                <th>Nilai</th>
                <th>Min. Belanja</th>
                <th>Kuota</th>
                <th>Periode</th>
                <th>Aksi</th>
              </tr>
            </thead>

            <tbody>
              {promotions.length === 0 && (
                <tr>
                  <td colSpan={6}>
                    Belum ada promo.
                  </td>
                </tr>
              )}

              {promotions.map((promo) => (
                <tr key={promo.id}>
                  <td>
                    <span className="promo-code">
                      {promo.code}
                    </span>
                  </td>

                  <td>
                    <strong className="promo-value">
                      {formatValue(promo)}
                    </strong>
                  </td>

                  <td>
                    {formatRupiah(promo.min_purchase)}
                  </td>

                  <td>
                    {promo.quota === null
                      ? "Tanpa batas"
                      : `${promo.used}/${promo.quota}`}
                  </td>

                  <td>
                    <span className="promo-period">
                      {promo.starts_at
                        ? new Date(
                            promo.starts_at
                          ).toLocaleDateString("id-ID")
                        : "—"}{" "}
                      s/d{" "}
                      {promo.ends_at
                        ? new Date(
                            promo.ends_at
                          ).toLocaleDateString("id-ID")
                        : "—"}
                    </span>
                  </td>

                  <td>
                    <div className="promotion-actions">
                      <button
                        className="edit-promotion-button"
                        onClick={() =>
                          openEditModal(promo)
                        }
                      >
                        Edit
                      </button>

                      <button
                        className="delete-promotion-button"
                        onClick={() =>
                          handleDelete(promo.id)
                        }
                        disabled={
                          deletingId === promo.id
                        }
                      >
                        {deletingId === promo.id
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

      {showModal && (
        <div
          className="promotion-modal-overlay"
          onClick={closeModal}
        >
          <div
            className="promotion-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <span className="modal-label">
                  {editingId ? "EDIT DATA" : "OPERASIONAL"}
                </span>
                <h3>
                  {editingId
                    ? "Edit Promo"
                    : "Tambah Promo"}
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

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="promo-code">
                    Kode <span>*</span>
                  </label>
                  <input
                    id="promo-code"
                    name="code"
                    type="text"
                    placeholder="HEMAT10"
                    value={form.code}
                    onChange={handleChange}
                    disabled={saving}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="promo-type">
                    Tipe <span>*</span>
                  </label>
                  <select
                    id="promo-type"
                    name="type"
                    value={form.type}
                    onChange={handleChange}
                    disabled={saving}
                  >
                    <option value="percent">
                      Persen (%)
                    </option>
                    <option value="nominal">
                      Nominal (Rp)
                    </option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="promo-value">
                    Nilai <span>*</span>
                  </label>
                  <input
                    id="promo-value"
                    name="value"
                    type="number"
                    min="0"
                    placeholder="10"
                    value={form.value}
                    onChange={handleChange}
                    disabled={saving}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="promo-min">
                    Min. Belanja (Rp)
                  </label>
                  <input
                    id="promo-min"
                    name="min_purchase"
                    type="number"
                    min="0"
                    placeholder="0"
                    value={form.min_purchase}
                    onChange={handleChange}
                    disabled={saving}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="promo-quota">
                  Kuota (kosongkan = tanpa batas)
                </label>
                <input
                  id="promo-quota"
                  name="quota"
                  type="number"
                  min="0"
                  placeholder="Tanpa batas"
                  value={form.quota}
                  onChange={handleChange}
                  disabled={saving}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="promo-start">
                    Mulai
                  </label>
                  <input
                    id="promo-start"
                    name="starts_at"
                    type="datetime-local"
                    value={form.starts_at}
                    onChange={handleChange}
                    disabled={saving}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="promo-end">
                    Berakhir
                  </label>
                  <input
                    id="promo-end"
                    name="ends_at"
                    type="datetime-local"
                    value={form.ends_at}
                    onChange={handleChange}
                    disabled={saving}
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel-promotion-button"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Batal
                </button>

                <button
                  type="submit"
                  className="save-promotion-button"
                  disabled={saving}
                >
                  {saving
                    ? "Menyimpan..."
                    : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

export default Promotions;
