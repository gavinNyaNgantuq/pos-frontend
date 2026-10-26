import { useEffect, useState } from "react";
import "./Payment.css";
import Footer from "../components/Footer";
import ThemeToggle from "../components/ThemeToggle";

interface Product {
  id: number;
  name: string;
  price: number | string;
  stock: number;
  image?: string | null;
}

interface SelectedProduct {
  product: Product;
  quantity: number;
}

interface PaymentProps {
  selectedProducts: SelectedProduct[];
  onBack: () => void;
  onSuccess: (transactionId: number) => void;
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

function Payment({
  selectedProducts,
  onBack,
  onSuccess,
}: PaymentProps) {
  const token = localStorage.getItem("token");

  const [paymentMethod, setPaymentMethod] =
    useState("cash");

  const [paymentAmount, setPaymentAmount] =
    useState("");

  const [discountRate, setDiscountRate] =
    useState(0);

  const [paymentRef, setPaymentRef] =
    useState("");

  const [promoCode, setPromoCode] =
    useState("");

  const [shiftId, setShiftId] = useState<
    number | null
  >(null);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const userData =
    localStorage.getItem("user");

  let user: any = null;

  try {
    user = userData
      ? JSON.parse(userData)
      : null;
  } catch {
    user = null;
  }

  const canManageDiscount =
    user?.role === "admin";

  useEffect(() => {
    const fetchShiftStatus = async () => {
      try {
        const response = await fetch(
          `${API_URL}/api/shifts/status`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (response.ok && data?.data?.id) {
          setShiftId(Number(data.data.id));
        }
      } catch {
        // shift opsional — kasir tetap bisa bayar
      }
    };

    fetchShiftStatus();
  }, []);

  const formatRupiah = (
    value: number
  ) => {
    return new Intl.NumberFormat(
      "id-ID",
      {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
      }
    ).format(value);
  };

  const subtotal = selectedProducts.reduce(
    (total, item) => {
      const price = Number(item.product.price);

      return (
        total +
        price * item.quantity
      );
    },
    0
  );

  const discountAmount =
    canManageDiscount
      ? (subtotal * discountRate) / 100
      : 0;

  const totalBeforeTax =
    subtotal - discountAmount;

  const taxRate = 11;

  const taxAmount =
    (totalBeforeTax * taxRate) / 100;

  const total =
    totalBeforeTax + taxAmount;

  const paidAmount =
    Number(paymentAmount) || 0;

  const change =
    paidAmount - total;

  const handlePayment = async () => {
    setError("");

    if (selectedProducts.length === 0) {
      setError(
        "Tidak ada produk yang dipilih."
      );
      return;
    }

    if (paidAmount < total) {
      setError(
        "Jumlah pembayaran kurang."
      );
      return;
    }

    if (
      paymentMethod !== "cash" &&
      paymentRef.trim() === ""
    ) {
      setError(
        "Nomor referensi wajib diisi untuk pembayaran non-tunai."
      );
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${API_URL}/api/checkout`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${token}`,
          },

          body: JSON.stringify({
            products:
              selectedProducts.map(
                (item) => ({
                  product_id:
                    item.product.id,

                  quantity:
                    item.quantity,
                })
              ),

            discount:
              canManageDiscount
                ? discountRate
                : 0,

            payment:
              paidAmount,

            payment_method:
              paymentMethod,

            payment_ref:
              paymentMethod === "cash"
                ? null
                : paymentRef.trim() || null,

            promotion_code:
              promoCode.trim() === ""
                ? null
                : promoCode.trim().toUpperCase(),

            shift_id: shiftId,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Pembayaran gagal."
        );
      }

      const transactionId = Number(
        data?.data?.transaction_id
      );

      if (!transactionId) {
        throw new Error(
          "Transaction ID tidak ditemukan dari response checkout."
        );
      }

      onSuccess(transactionId);
    } catch (err) {
      console.error(
        "CHECKOUT ERROR:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Pembayaran gagal."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="payment-page">
      <div className="payment-container">

        <div className="payment-header">
          <button
            type="button"
            className="payment-back-button"
            onClick={onBack}
            disabled={loading}
          >
            Kembali
          </button>

          <div>
            <span className="payment-label">
              TRANSAKSI
            </span>

            <h1>
              Pembayaran
            </h1>
          </div>

          <ThemeToggle className="payment-theme" />
        </div>

        <div className="payment-content">

          <div className="payment-card">

            <div className="payment-card-header">
              <h2>
                Detail Pesanan
              </h2>

              <span>
                {selectedProducts.length} produk
              </span>
            </div>

            <div className="payment-products">
              {selectedProducts.map(
                (item) => {
                  const price =
                    Number(
                      item.product.price
                    );

                  const subtotalItem =
                    price *
                    item.quantity;

                  return (
                    <div
                      className="payment-product"
                      key={
                        item.product.id
                      }
                    >
                      <div>
                        <h3>
                          {item.product.name}
                        </h3>

                        <p>
                          {item.quantity} x{" "}
                          {formatRupiah(
                            price
                          )}
                        </p>
                      </div>

                      <strong>
                        {formatRupiah(
                          subtotalItem
                        )}
                      </strong>
                    </div>
                  );
                }
              )}
            </div>

          </div>

          <div className="payment-card">

            <h2>
              Metode Pembayaran
            </h2>

            <div className="payment-methods">

              <button
                type="button"
                className={
                  paymentMethod === "cash"
                    ? "payment-method active"
                    : "payment-method"
                }
                onClick={() =>
                  setPaymentMethod(
                    "cash"
                  )
                }
              >
                Cash
              </button>

              <button
                type="button"
                className={
                  paymentMethod === "qris"
                    ? "payment-method active"
                    : "payment-method"
                }
                onClick={() =>
                  setPaymentMethod(
                    "qris"
                  )
                }
              >
                QRIS
              </button>

              <button
                type="button"
                className={
                  paymentMethod === "transfer"
                    ? "payment-method active"
                    : "payment-method"
                }
                onClick={() =>
                  setPaymentMethod(
                    "transfer"
                  )
                }
              >
                Transfer
              </button>

              <button
                type="button"
                className={
                  paymentMethod === "debit"
                    ? "payment-method active"
                    : "payment-method"
                }
                onClick={() =>
                  setPaymentMethod(
                    "debit"
                  )
                }
              >
                Debit
              </button>

              <button
                type="button"
                className={
                  paymentMethod === "credit"
                    ? "payment-method active"
                    : "payment-method"
                }
                onClick={() =>
                  setPaymentMethod(
                    "credit"
                  )
                }
              >
                Kredit
              </button>

            </div>

            {paymentMethod !== "cash" && (
              <div className="payment-field">
                <label>
                  Nomor Referensi
                </label>

                <input
                  type="text"
                  placeholder="No. referensi transfer/debit/kredit"
                  value={paymentRef}
                  onChange={(e) =>
                    setPaymentRef(e.target.value)
                  }
                  disabled={loading}
                />
              </div>
            )}

            <div className="payment-field">
              <label>
                Kode Promo (opsional)
              </label>

              <input
                type="text"
                placeholder="Contoh: HEMAT10"
                value={promoCode}
                onChange={(e) =>
                  setPromoCode(e.target.value)
                }
                disabled={loading}
              />
            </div>

            <div className="payment-field">
              <label>
                Jumlah Pembayaran
              </label>

              <input
                type="number"
                min="0"
                value={paymentAmount}
                onChange={(e) =>
                  setPaymentAmount(
                    e.target.value
                  )
                }
                placeholder="Masukkan jumlah pembayaran"
              />
            </div>

            {canManageDiscount && (
              <div className="payment-field">
                <label>
                  Diskon (%)
                </label>

                <input
                  type="number"
                  min="0"
                  max="100"
                  value={discountRate}
                  onChange={(e) =>
                    setDiscountRate(
                      Number(
                        e.target.value
                      )
                    )
                  }
                />
              </div>
            )}

          </div>

          <div className="payment-summary">

            <div className="summary-row">
              <span>
                Subtotal
              </span>

              <strong>
                {formatRupiah(
                  subtotal
                )}
              </strong>
            </div>

            <div className="summary-row">
              <span>
                Diskon
              </span>

              <strong>
                -{" "}
                {formatRupiah(
                  discountAmount
                )}
              </strong>
            </div>

            <div className="summary-row">
              <span>
                Pajak ({taxRate}%)
              </span>

              <strong>
                {formatRupiah(
                  taxAmount
                )}
              </strong>
            </div>

            <div className="summary-total">
              <span>
                Total
              </span>

              <strong>
                {formatRupiah(total)}
              </strong>
            </div>

            <div className="summary-row">
              <span>
                Dibayar
              </span>

              <strong>
                {formatRupiah(
                  paidAmount
                )}
              </strong>
            </div>

            <div className="summary-row">
              <span>
                Kembalian
              </span>

              <strong>
                {formatRupiah(
                  Math.max(change, 0)
                )}
              </strong>
            </div>

          </div>

          {error && (
            <div className="payment-error">
              {error}
            </div>
          )}

          <div className="payment-actions">

            <button
              type="button"
              className="payment-cancel-button"
              onClick={onBack}
              disabled={loading}
            >
              Batal
            </button>

            <button
              type="button"
              className="payment-confirm-button"
              onClick={handlePayment}
              disabled={loading}
            >
              {loading
                ? "Memproses..."
                : "Bayar Sekarang"}
            </button>

          </div>

        </div>

      </div>

      <Footer />
    </div>
  );
}

export default Payment;