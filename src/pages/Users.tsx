import { useEffect, useState } from "react";
import "./Users.css";

type User = {
  id: number;
  username: string;
  email: string;
  phone: string | null;
  profile_photo: string | null;
  role_id: number | null;
  role: string | null;
  status: number;
  created_at: string | null;
  created_by: number | null;
  updated_at: string | null;
  updated_by: number | null;
};

type FormData = {
  username: string;
  email: string;
  phone: string;
  password: string;
  role_id: string;
};

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

function Users() {
  const [users, setUsers] = useState<User[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] =
    useState<number | null>(null);

  const [form, setForm] = useState<FormData>({
    username: "",
    email: "",
    phone: "",
    password: "",
    role_id: "2",
  });

  const token = localStorage.getItem("token");

  // =========================
  // GET USERS
  // =========================

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/api/users`,
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
            "Gagal mengambil data user"
        );
      }

      const incoming: User[] = Array.isArray(
        data.data
      )
        ? data.data
        : [];

      const seen = new Set<number>();
      const unique = incoming.filter((user) => {
        if (seen.has(user.id)) {
          return false;
        }

        seen.add(user.id);
        return true;
      });

      setUsers(unique);
    } catch (err: any) {
      setError(
        err.message ||
          "Terjadi kesalahan saat mengambil user"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // =========================
  // RESET FORM
  // =========================

  const resetForm = () => {
    setForm({
      username: "",
      email: "",
      phone: "",
      password: "",
      role_id: "2",
    });

    setEditingId(null);
    setShowModal(false);
  };

  // =========================
  // OPEN ADD
  // =========================

  const handleAdd = () => {
    setEditingId(null);

    setForm({
      username: "",
      email: "",
      phone: "",
      password: "",
      role_id: "2",
    });

    setShowModal(true);
  };

  // =========================
  // OPEN EDIT
  // =========================

  const handleEdit = (user: User) => {
    setEditingId(user.id);

    setForm({
      username: user.username,
      email: user.email,
      phone: user.phone || "",
      password: "",
      role_id:
        user.role_id === 1 || user.role_id === 2
          ? String(user.role_id)
          : "2",
    });

    setShowModal(true);
  };

  // =========================
  // FORM CHANGE
  // =========================

  const handleChange = (
    e:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLSelectElement>
  ) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  // =========================
  // CREATE / UPDATE
  // =========================

  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (!form.username.trim()) {
      alert("Username wajib diisi");
      return;
    }

    if (!form.email.trim()) {
      alert("Email wajib diisi");
      return;
    }

    if (!form.phone.trim()) {
      alert("Nomor telepon wajib diisi");
      return;
    }

    if (!form.role_id) {
      alert("Role wajib dipilih");
      return;
    }

    if (
      form.role_id !== "1" &&
      form.role_id !== "2"
    ) {
      alert("Role hanya Admin atau Staff");
      return;
    }

    if (
      !editingId &&
      !form.password.trim()
    ) {
      alert("Password wajib diisi");
      return;
    }

    try {
      const url = editingId
        ? `${API_URL}/api/users/${editingId}`
        : `${API_URL}/api/users`;

      const method = editingId
        ? "PUT"
        : "POST";

      const body: {
        username: string;
        email: string;
        phone: string;
        password?: string;
        role_id: number;
      } = {
        username:
          form.username.trim(),

        email:
          form.email.trim(),

        phone:
          form.phone.trim(),

        role_id:
          Number(form.role_id),
      };

      if (form.password.trim()) {
        body.password =
          form.password;
      }

      const response = await fetch(
        url,
        {
          method,
          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${token}`,
          },

          body: JSON.stringify(body),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Gagal menyimpan user"
        );
      }

      alert(data.message);

      if (editingId) {
        const updatedId = editingId;

        setUsers((prev) =>
          prev.map((user) =>
            user.id === updatedId
              ? {
                  ...user,
                  username:
                    form.username.trim(),
                  email: form.email.trim(),
                  phone: form.phone.trim(),
                  role_id: Number(form.role_id),
                }
              : user
          )
        );
      }

      resetForm();
      fetchUsers();
    } catch (err: any) {
      alert(
        err.message ||
          "Terjadi kesalahan saat menyimpan user"
      );
    }
  };

  // =========================
  // DELETE
  // =========================

  const handleDelete = async (
    id: number
  ) => {
    const confirmed =
      window.confirm(
        "Yakin ingin menghapus user ini?"
      );

    if (!confirmed) return;

    try {
      const response =
        await fetch(
          `${API_URL}/api/users/${id}`,
          {
            method: "DELETE",

            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Gagal menghapus user"
        );
      }

      alert(data.message);

      fetchUsers();
    } catch (err: any) {
      alert(
        err.message ||
          "Terjadi kesalahan saat menghapus user"
      );
    }
  };

  // =========================
  // SEARCH
  // =========================

  const filteredUsers =
    users.filter((user) => {
      const keyword =
        search.toLowerCase();

      return (
        user.username
          .toLowerCase()
          .includes(keyword) ||
        user.email
          .toLowerCase()
          .includes(keyword) ||
        (user.phone || "")
          .toLowerCase()
          .includes(keyword)
      );
    });

  // =========================
  // DATE FORMAT
  // =========================

  const formatDate = (
    date: string | null
  ) => {
    if (!date) return "-";

    return new Date(
      date
    ).toLocaleDateString(
      "id-ID",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  // =========================
  // ROLE LABEL
  // =========================

  const getRoleLabel = (
    role: string | null
  ) => {
    if (!role) return "-";

    return (
      role.charAt(0).toUpperCase() +
      role.slice(1)
    );
  };

  return (
    <section className="users-page">

      {/* HEADER */}

      <div className="users-page-header">

        <div>
          <div className="breadcrumb">
            Master Data / User
          </div>

          <h2>Users</h2>

          <p>
            Kelola akun pengguna yang
            dapat mengakses sistem POS.
          </p>
        </div>

        <button
          className="users-add-button"
          onClick={handleAdd}
        >
          <span>+</span>
          Tambah User
        </button>

      </div>

      {/* STATISTICS */}

      <div className="users-statistics">

        <div className="user-stat-card">

          <div className="user-stat-icon">
            User
          </div>

          <div>
            <span>Total User</span>
            <strong>
              {users.length}
            </strong>
          </div>

        </div>

        <div className="user-stat-card">

          <div className="user-stat-icon active">
            Aktif
          </div>

          <div>
            <span>User Aktif</span>

            <strong>
              {
                users.filter(
                  (user) =>
                    user.status === 1
                ).length
              }
            </strong>
          </div>

        </div>

      </div>

      {/* TABLE CARD */}

      <div className="users-table-card">

        <div className="users-toolbar">

          <div>
            <h3>Daftar User</h3>

            <span>
              {filteredUsers.length} user
              ditemukan
            </span>
          </div>

          <div className="users-search">

            <span>⌕</span>

            <input
              type="text"
              placeholder="Cari username atau email..."
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
            />

          </div>

        </div>

        {/* LOADING */}

        {loading && (
          <div className="users-empty">

            <div className="loading-spinner"></div>

            <p>
              Memuat data user...
            </p>

          </div>
        )}

        {/* ERROR */}

        {!loading && error && (
          <div className="users-error">

            <div className="error-icon">
              !
            </div>

            <h3>
              Gagal memuat data
            </h3>

            <p>{error}</p>

            <button
              onClick={fetchUsers}
            >
              Coba Lagi
            </button>

          </div>
        )}

        {/* EMPTY */}

        {!loading &&
          !error &&
          filteredUsers.length === 0 && (
            <div className="users-empty">

              <div className="empty-icon">
                User
              </div>

              <h3>
                {search
                  ? "User tidak ditemukan"
                  : "Belum ada user"}
              </h3>

              <p>
                {search
                  ? "Coba gunakan kata pencarian lain."
                  : "Tambahkan user pertama untuk memulai."}
              </p>

              {!search && (
                <button
                  onClick={handleAdd}
                >
                  + Tambah User
                </button>
              )}

            </div>
          )}

        {/* TABLE */}

        {!loading &&
          !error &&
          filteredUsers.length > 0 && (
            <div className="users-table-wrapper">

              <table className="users-table">

                <thead>

                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Dibuat</th>
                    <th className="action-column">
                      Aksi
                    </th>
                  </tr>

                </thead>

                <tbody>

                  {filteredUsers.map(
                    (user) => (
                      <tr
                        key={user.id}
                      >

                        <td>

                          <div className="user-profile">

                            <div className="user-avatar">
                              {user.username
                                .charAt(0)
                                .toUpperCase()}
                            </div>

                            <div>

                              <strong>
                                {
                                  user.username
                                }
                              </strong>

                              <small>
                                ID #
                                {user.id}
                              </small>

                            </div>

                          </div>

                        </td>

                        <td>

                          <span className="user-email">
                            {user.email}
                          </span>

                          {user.phone && (
                            <small className="user-phone">
                              {user.phone}
                            </small>
                          )}

                        </td>

                        <td>

                          <span>
                            {getRoleLabel(
                              user.role
                            )}
                          </span>

                        </td>

                        <td>

                          <span
                            className={
                              user.status ===
                              1
                                ? "status-badge active"
                                : "status-badge inactive"
                            }
                          >

                            <span></span>

                            {user.status ===
                            1
                              ? "Aktif"
                              : "Tidak Aktif"}

                          </span>

                        </td>

                        <td>

                          <span className="date-text">
                            {formatDate(
                              user.created_at
                            )}
                          </span>

                        </td>

                        <td>

                          <div className="user-actions">

                            <button
                              className="action-edit"
                              onClick={() =>
                                handleEdit(
                                  user
                                )
                              }
                            >
                              Edit
                            </button>

                            <button
                              className="action-delete"
                              onClick={() =>
                                handleDelete(
                                  user.id
                                )
                              }
                            >
                              Hapus
                            </button>

                          </div>

                        </td>

                      </tr>
                    )
                  )}

                </tbody>

              </table>

            </div>
          )}

      </div>

      {/* MODAL */}

      {showModal && (
        <div
          className="user-modal-overlay"
          onClick={(e) => {
            if (
              e.target ===
              e.currentTarget
            ) {
              resetForm();
            }
          }}
        >

          <div className="user-modal">

            <div className="user-modal-header">

              <div>

                <h3>
                  {editingId
                    ? "Edit User"
                    : "Tambah User"}
                </h3>

                <p>
                  {editingId
                    ? "Perbarui informasi akun user."
                    : "Buat akun user baru."}
                </p>

              </div>

              <button
                className="modal-close"
                onClick={
                  resetForm
                }
              >
                ×
              </button>

            </div>

            <form
              className="user-modal-form"
              onSubmit={
                handleSubmit
              }
            >

              {/* USERNAME */}

              <div className="form-field">

                <label>
                  Username
                  <span>*</span>
                </label>

                <input
                  type="text"
                  name="username"
                  value={
                    form.username
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Masukkan username"
                />

              </div>

              {/* EMAIL */}

              <div className="form-field">

                <label>
                  Email
                  <span>*</span>
                </label>

                <input
                  type="email"
                  name="email"
                  value={
                    form.email
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Masukkan email"
                />

              </div>

              {/* PHONE */}

              <div className="form-field">

                <label>
                  Nomor Telepon
                  <span>*</span>
                </label>

                <input
                  type="tel"
                  name="phone"
                  value={
                    form.phone
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Masukkan nomor telepon"
                />

              </div>

              {/* ROLE */}

              <div className="form-field">

                <label>
                  Role
                  <span>*</span>
                </label>

                <select
                  name="role_id"
                  value={
                    form.role_id
                  }
                  onChange={
                    handleChange
                  }
                >
                  <option value="1">
                    Admin
                  </option>

                  <option value="2">
                    Staff
                  </option>
                </select>

              </div>

              {/* PASSWORD */}

              <div className="form-field">

                <label>
                  Password
                  {!editingId && (
                    <span>*</span>
                  )}
                </label>

                <input
                  type="password"
                  name="password"
                  value={
                    form.password
                  }
                  onChange={
                    handleChange
                  }
                  placeholder={
                    editingId
                      ? "Kosongkan jika tidak diubah"
                      : "Masukkan password"
                  }
                />

                {editingId && (
                  <small>
                    Kosongkan jika password
                    tidak ingin diubah.
                  </small>
                )}

              </div>

              {/* FOOTER */}

              <div className="user-modal-footer">

                <button
                  type="button"
                  className="modal-cancel"
                  onClick={
                    resetForm
                  }
                >
                  Batal
                </button>

                <button
                  type="submit"
                  className="modal-save"
                >
                  {editingId
                    ? "Simpan Perubahan"
                    : "Tambah User"}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

    </section>
  );
}

export default Users;