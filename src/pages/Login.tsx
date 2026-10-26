import { useEffect, useState } from "react";
import "./Login.css";
import Footer from "../components/Footer";
import ThemeToggle from "../components/ThemeToggle";
import { getFirebaseAuth } from "../lib/firebase";
import googleLogo from "../assets/google-g.svg";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

type LoginStep =
  | "login"
  | "request"
  | "verify"
  | "reset"
  | "done";

type OtpChannel = "whatsapp" | "sms" | "email";

type LoginRole = "admin" | "staff";

const matchesLoginRole = (
  selected: LoginRole,
  actual: string
) => {
  if (selected === "admin") {
    return actual === "admin";
  }

  // Pilihan Staff/Kasir menerima role staff maupun kasir.
  return actual === "staff" || actual === "kasir";
};

function Login() {
  const [role, setRole] =
    useState<LoginRole | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] =
    useState(false);

  const [step, setStep] =
    useState<LoginStep>("login");
  const [identifier, setIdentifier] =
    useState("");
  const [channel, setChannel] =
    useState<OtpChannel>("whatsapp");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] =
    useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");
  const [resetToken, setResetToken] =
    useState("");
  const [fpError, setFpError] = useState("");
  const [fpInfo, setFpInfo] = useState("");
  const [fpLoading, setFpLoading] =
    useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    try {
      if (
        sessionStorage.getItem(
          "session_expired"
        ) === "1"
      ) {
        sessionStorage.removeItem(
          "session_expired"
        );
        setMessage(
          "Sesi telah berakhir. Silakan login kembali."
        );
      }
    } catch {
      // abaikan jika sessionStorage tidak tersedia
    }
  }, []);

  useEffect(() => {
    if (cooldown <= 0) {
      return;
    }

    const timer = setTimeout(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    setMessage("");

    if (!role) {
      setMessage("Pilih role Admin atau Staff/Kasir terlebih dahulu.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/api/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            login: email,
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Login gagal");
        return;
      }

      const actualRole = String(
        data.user?.role || ""
      );

      // Pilihan UI bukan pengaman akses. Backend tetap
      // penentu role; di sini hanya mencegah sesi masuk
      // dengan role yang tidak sesuai pilihan pengguna.
      if (!matchesLoginRole(role, actualRole)) {
        setMessage(
          "Role akun tidak cocok dengan pilihan. Silakan pilih role yang sesuai."
        );
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      window.location.reload();
    } catch (error) {
      console.error(error);
      setMessage("Tidak dapat terhubung ke server");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setMessage("");
    setGoogleLoading(true);

    try {
      const auth = getFirebaseAuth();

      if (!auth) {
        setMessage(
          "Login Google belum dikonfigurasi."
        );
        return;
      }

      const {
        GoogleAuthProvider,
        signInWithPopup,
      } = await import("firebase/auth");

      const result = await signInWithPopup(
        auth,
        new GoogleAuthProvider()
      );

      const idToken = await result.user.getIdToken();

      const response = await fetch(
        `${API_URL}/api/auth/google`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(
          data.message || "Login Google gagal"
        );
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem(
        "user",
        JSON.stringify(data.user)
      );

      window.location.reload();
    } catch (error) {
      console.error(error);

      const code =
        typeof error === "object" &&
        error !== null &&
        "code" in error
          ? String(
              (error as { code: unknown }).code
            )
          : "";

      if (
        code === "auth/popup-closed-by-user" ||
        code === "auth/cancelled-popup-request"
      ) {
        return;
      }

      setMessage("Login Google gagal");
    } finally {
      setGoogleLoading(false);
    }
  };

  const resetForgotState = () => {
    setIdentifier("");
    setChannel("whatsapp");
    setOtp("");
    setNewPassword("");
    setConfirmPassword("");
    setResetToken("");
    setFpError("");
    setFpInfo("");
    setFpLoading(false);
    setCooldown(0);
  };

  const backToLogin = () => {
    resetForgotState();
    setStep("login");
  };

  const goToForgot = () => {
    resetForgotState();
    setIdentifier(email);
    setStep("request");
  };

  const handleRequestOtp = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    setFpError("");
    setFpInfo("");
    setFpLoading(true);

    const trimmedIdentifier = identifier.trim();

    if (channel === "email") {
      if (!trimmedIdentifier.includes("@")) {
        setFpError("Masukkan alamat email yang valid");
        setFpLoading(false);
        return;
      }

      try {
        const emailResponse = await fetch(
          `${API_URL}/api/auth/forgot-password`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: trimmedIdentifier,
            }),
          }
        );

        const emailData = await emailResponse.json();

        if (!emailResponse.ok) {
          setFpError(
            emailData.message || "Gagal mengirim OTP"
          );
          return;
        }

        setFpInfo(
          emailData.message || "OTP telah dikirim."
        );
        setCooldown(60);
        setStep("verify");
      } catch (error) {
        console.error(error);
        setFpError(
          "Tidak dapat terhubung ke server"
        );
      } finally {
        setFpLoading(false);
      }

      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/api/auth/forgot-password/request`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            identifier: identifier.trim(),
            channel,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setFpError(
          data.message || "Gagal mengirim OTP"
        );
        return;
      }

      setFpInfo(
        data.message || "OTP telah dikirim."
      );
      setCooldown(60);
      setStep("verify");
    } catch (error) {
      console.error(error);
      setFpError("Tidak dapat terhubung ke server");
    } finally {
      setFpLoading(false);
    }
  };

  const handleVerifyOtp = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    setFpError("");
    setFpInfo("");
    setFpLoading(true);

    const trimmedIdentifier = identifier.trim();
    const trimmedOtp = otp.trim();

    if (channel === "email") {
      try {
        const emailResponse = await fetch(
          `${API_URL}/api/auth/verify-otp`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: trimmedIdentifier,
              otp: trimmedOtp,
            }),
          }
        );

        const emailData = await emailResponse.json();

        if (!emailResponse.ok) {
          setFpError(
            emailData.message || "OTP tidak valid"
          );
          return;
        }

        setFpInfo("");
        setStep("reset");
      } catch (error) {
        console.error(error);
        setFpError(
          "Tidak dapat terhubung ke server"
        );
      } finally {
        setFpLoading(false);
      }

      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/api/auth/forgot-password/verify`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            identifier: identifier.trim(),
            otp: otp.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setFpError(
          data.message || "OTP tidak valid"
        );
        return;
      }

      setResetToken(data.reset_token || "");
      setFpInfo("");
      setStep("reset");
    } catch (error) {
      console.error(error);
      setFpError("Tidak dapat terhubung ke server");
    } finally {
      setFpLoading(false);
    }
  };

  const handleResetPassword = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    setFpError("");
    setFpInfo("");

    if (newPassword !== confirmPassword) {
      setFpError("Konfirmasi password tidak sama");
      return;
    }

    if (newPassword.length < 6) {
      setFpError("Password minimal 6 karakter");
      return;
    }

    if (channel === "email") {
      setFpLoading(true);

      try {
        const emailResponse = await fetch(
          `${API_URL}/api/auth/reset-password`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: identifier.trim(),
              otp: otp.trim(),
              password: newPassword,
            }),
          }
        );

        const emailData = await emailResponse.json();

        if (!emailResponse.ok) {
          setFpError(
            emailData.message ||
              "Gagal mereset password"
          );
          return;
        }

        setFpInfo(
          emailData.message ||
            "Password berhasil direset. Silakan login kembali."
        );
        setStep("done");
      } catch (error) {
        console.error(error);
        setFpError(
          "Tidak dapat terhubung ke server"
        );
      } finally {
        setFpLoading(false);
      }

      return;
    }

    setFpLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/api/auth/forgot-password/reset`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            reset_token: resetToken,
            password: newPassword,
            password_confirmation: confirmPassword,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setFpError(
          data.message || "Gagal mereset password"
        );
        return;
      }

      setFpInfo(
        data.message ||
          "Password berhasil direset. Silakan login kembali."
      );
      setStep("done");
    } catch (error) {
      console.error(error);
      setFpError("Tidak dapat terhubung ke server");
    } finally {
      setFpLoading(false);
    }
  };

  const renderHeader = () => {
    switch (step) {
      case "request":
        return {
          label: "RESET PASSWORD",
          title: "Lupa Password",
          description:
            "Masukkan email atau nomor telepon akun Anda. Kami akan mengirim kode OTP.",
        };

      case "verify":
        return {
          label: "VERIFIKASI OTP",
          title: "Cek Kode OTP",
          description:
            channel === "email"
              ? "Masukkan kode OTP yang dikirim ke email Anda."
              : channel === "whatsapp"
                ? "Masukkan kode OTP yang dikirim ke WhatsApp Anda."
                : "Masukkan kode OTP yang dikirim melalui SMS.",
        };

      case "reset":
        return {
          label: "PASSWORD BARU",
          title: "Buat Password Baru",
          description:
            "Masukkan password baru untuk akun Anda.",
        };

      case "done":
        return {
          label: "BERHASIL",
          title: "Password Direset",
          description:
            "Password Anda sudah diperbarui. Silakan masuk kembali.",
        };

      default:
        return {
          label: "MASUK",
          title: "Masuk",
          description:
            "Masuk untuk mengakses sistem POS.",
        };
    }
  };

  const header = renderHeader();

  return (
    <div className="login-page">
      <div className="login-theme">
        <ThemeToggle />
      </div>

      <div className="login-brand">
        <div className="login-brand-mark">P</div>

        <div>
          <h1>POS Kasir</h1>
          <p>Penjualan</p>
        </div>
      </div>

      <div className="login-card">
        <div className="login-card-header">
          <span className="page-label">
            {header.label}
          </span>

          <h2>{header.title}</h2>

          <p>{header.description}</p>
        </div>

        {step === "login" && (
          <form
            className="login-form"
            onSubmit={handleLogin}
          >
            <div className="login-role">
              <span className="login-role-label">
                Masuk sebagai
              </span>

              <div
                className="login-role-options"
                role="group"
                aria-label="Pilih role"
              >
                <button
                  type="button"
                  className={
                    role === "admin"
                      ? "login-role-option active"
                      : "login-role-option"
                  }
                  aria-pressed={role === "admin"}
                  onClick={() => setRole("admin")}
                  disabled={loading || googleLoading}
                >
                  <svg
                    className="login-role-icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M12 3l7 3v5c0 4.4-2.9 8.2-7 9.5-4.1-1.3-7-5.1-7-9.5V6l7-3z" />
                    <path d="M9 12l2 2 4-4" />
                  </svg>

                  <span className="login-role-text">
                    <span className="login-role-name">
                      Admin
                    </span>
                    <span className="login-role-desc">
                      Kelola toko
                    </span>
                  </span>
                </button>

                <button
                  type="button"
                  className={
                    role === "staff"
                      ? "login-role-option active"
                      : "login-role-option"
                  }
                  aria-pressed={role === "staff"}
                  onClick={() => setRole("staff")}
                  disabled={loading || googleLoading}
                >
                  <svg
                    className="login-role-icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3z" />
                    <path d="M9 8h6M9 12h6" />
                  </svg>

                  <span className="login-role-text">
                    <span className="login-role-name">
                      Staff / Kasir
                    </span>
                    <span className="login-role-desc">
                      Proses transaksi
                    </span>
                  </span>
                </button>
              </div>

              <p className="login-role-hint">
                Login Google mengikuti role akun.
              </p>
            </div>

            <div className="login-field">
              <label htmlFor="login-email">
                Email
              </label>

              <input
                id="login-email"
                type="email"
                placeholder="nama@pos.com"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                disabled={loading}
                required
              />
            </div>

            <div className="login-field">
              <label htmlFor="login-password">
                Password
              </label>

              <input
                id="login-password"
                type="password"
                placeholder="Masukkan password"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                disabled={loading || googleLoading}
                required
              />
            </div>

            {message && (
              <div
                className="login-error"
                role="alert"
              >
                <span>!</span>
                {message}
              </div>
            )}

            <button
              type="submit"
              className="login-submit"
              disabled={loading || googleLoading}
            >
              {loading ? "Memuat..." : "Masuk"}
            </button>

            <button
              type="button"
              className="login-link login-link-below"
              onClick={goToForgot}
            >
              Lupa Password?
            </button>

            <div className="login-divider">
              <span>atau</span>
            </div>

            <button
              type="button"
              className="login-google"
              onClick={handleGoogleLogin}
              disabled={loading || googleLoading}
            >
              <img
                src={googleLogo}
                alt="Logo Google"
                className="login-google-logo"
              />
              {googleLoading
                ? "Menghubungkan..."
                : "Login dengan Google"}
            </button>
          </form>
        )}

        {step === "request" && (
          <form
            className="login-form"
            onSubmit={handleRequestOtp}
          >
            <div className="login-field">
              <label htmlFor="forgot-identifier">
                {channel === "email"
                  ? "Email"
                  : "Email atau Nomor Telepon"}
              </label>

              <input
                id="forgot-identifier"
                type="text"
                placeholder={
                  channel === "email"
                    ? "nama@email.com"
                    : "nama@pos.com atau 08xx"
                }
                value={identifier}
                onChange={(e) =>
                  setIdentifier(e.target.value)
                }
                disabled={fpLoading}
                required
              />
            </div>

            <div className="login-field">
              <label>Kirim OTP via</label>

              <div className="login-channel-group">
                <button
                  type="button"
                  className={
                    channel === "whatsapp"
                      ? "login-channel active"
                      : "login-channel"
                  }
                  onClick={() =>
                    setChannel("whatsapp")
                  }
                  disabled={fpLoading}
                >
                  WhatsApp
                </button>

                <button
                  type="button"
                  className={
                    channel === "sms"
                      ? "login-channel active"
                      : "login-channel"
                  }
                  onClick={() =>
                    setChannel("sms")
                  }
                  disabled={fpLoading}
                >
                  SMS
                </button>

                <button
                  type="button"
                  className={
                    channel === "email"
                      ? "login-channel active"
                      : "login-channel"
                  }
                  onClick={() =>
                    setChannel("email")
                  }
                  disabled={fpLoading}
                >
                  Email
                </button>
              </div>
            </div>

            {fpError && (
              <div
                className="login-error"
                role="alert"
              >
                <span>!</span>
                {fpError}
              </div>
            )}

            <button
              type="submit"
              className="login-submit"
              disabled={fpLoading}
            >
              {fpLoading
                ? "Mengirim..."
                : "Kirim OTP"}
            </button>

            <button
              type="button"
              className="login-back"
              onClick={backToLogin}
              disabled={fpLoading}
            >
              Kembali ke Masuk
            </button>
          </form>
        )}

        {step === "verify" && (
          <form
            className="login-form"
            onSubmit={handleVerifyOtp}
          >
            {fpInfo && (
              <div className="login-success">
                {fpInfo}
              </div>
            )}

            <div className="login-field">
              <label htmlFor="forgot-otp">
                Kode OTP
              </label>

              <input
                id="forgot-otp"
                type="text"
                inputMode="numeric"
                placeholder="Masukkan kode OTP"
                value={otp}
                onChange={(e) =>
                  setOtp(e.target.value)
                }
                disabled={fpLoading}
                required
              />

              <p className="login-hint">
                {channel === "email"
                  ? "Kode berlaku 10 menit."
                  : "Kode berlaku 5 menit."}
              </p>
            </div>

            {fpError && (
              <div
                className="login-error"
                role="alert"
              >
                <span>!</span>
                {fpError}
              </div>
            )}

            <button
              type="submit"
              className="login-submit"
              disabled={fpLoading}
            >
              {fpLoading
                ? "Memverifikasi..."
                : "Verifikasi"}
            </button>

            <button
              type="button"
              className="login-back"
              onClick={handleRequestOtp}
              disabled={fpLoading || cooldown > 0}
            >
              {cooldown > 0
                ? `Kirim ulang (${cooldown} dtk)`
                : "Kirim ulang OTP"}
            </button>

            <button
              type="button"
              className="login-back"
              onClick={backToLogin}
              disabled={fpLoading}
            >
              Kembali ke Masuk
            </button>
          </form>
        )}

        {step === "reset" && (
          <form
            className="login-form"
            onSubmit={handleResetPassword}
          >
            <div className="login-field">
              <label htmlFor="forgot-new-password">
                Password Baru
              </label>

              <input
                id="forgot-new-password"
                type="password"
                placeholder="Minimal 6 karakter"
                value={newPassword}
                onChange={(e) =>
                  setNewPassword(e.target.value)
                }
                disabled={fpLoading}
                required
              />
            </div>

            <div className="login-field">
              <label htmlFor="forgot-confirm-password">
                Konfirmasi Password
              </label>

              <input
                id="forgot-confirm-password"
                type="password"
                placeholder="Ulangi password baru"
                value={confirmPassword}
                onChange={(e) =>
                  setConfirmPassword(e.target.value)
                }
                disabled={fpLoading}
                required
              />
            </div>

            {fpError && (
              <div
                className="login-error"
                role="alert"
              >
                <span>!</span>
                {fpError}
              </div>
            )}

            <button
              type="submit"
              className="login-submit"
              disabled={fpLoading}
            >
              {fpLoading
                ? "Menyimpan..."
                : "Simpan Password"}
            </button>

            <button
              type="button"
              className="login-back"
              onClick={backToLogin}
              disabled={fpLoading}
            >
              Kembali ke Masuk
            </button>
          </form>
        )}

        {step === "done" && (
          <div className="login-form">
            {fpInfo && (
              <div className="login-success">
                {fpInfo}
              </div>
            )}

            <button
              type="button"
              className="login-submit"
              onClick={backToLogin}
            >
              Kembali ke Masuk
            </button>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}

export default Login;
