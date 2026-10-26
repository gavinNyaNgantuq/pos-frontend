import { useState } from "react";

import Login from "./pages/Login";
import Home from "./pages/Home";
import AdminHome from "./pages/AdminHome";
import Payment from "./pages/Payment";
import Bill from "./pages/Bill";
import History from "./pages/History";

interface SelectedProduct {
  product: any;
  quantity: number;
}

interface Transaction {
  id: number;
  user_id: number;
  username: string;
  total_before_discount: number | string | null;
  discount: number | string | null;
  total_after_discount: number | string | null;
  total_before_tax: number | string | null;
  tax_id: number | null;
  tax_name: string | null;
  tax_rate: number | string | null;
  tax_amount: number | string | null;
  total_after_tax: number | string | null;
  payment: number | string | null;
  payment_method: string | null;
  change: number | string | null;
  status: number;
  created_at: string;
}

interface TransactionProduct {
  id: number;
  transaction_id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  price: number | string;
  subtotal: number | string;
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

function App() {
  const token = localStorage.getItem("token");
  const userData = localStorage.getItem("user");

  const [page, setPage] = useState<
    "home" | "payment" | "bill" | "history"
  >("home");

  const [selectedProducts, setSelectedProducts] =
    useState<SelectedProduct[]>([]);

  const [transaction, setTransaction] =
    useState<Transaction | null>(null);

  const [transactionProducts, setTransactionProducts] =
    useState<TransactionProduct[]>([]);

  const [billLoading, setBillLoading] =
    useState(false);

  const [billError, setBillError] =
    useState("");

  if (!token || !userData) {
    return <Login />;
  }

  let user;

  try {
    user = JSON.parse(userData);
  } catch {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    return <Login />;
  }

  const handlePaymentSuccess = async (
    transactionId: number
  ) => {
    try {
      setBillLoading(true);
      setBillError("");

      const [
        transactionResponse,
        transactionProductsResponse,
      ] = await Promise.all([
        fetch(
          `${API_URL}/api/transactions/${transactionId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        ),

        fetch(
          `${API_URL}/api/transaction-products`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        ),
      ]);

      const transactionData =
        await transactionResponse.json();

      const transactionProductsData =
        await transactionProductsResponse.json();

      if (!transactionResponse.ok) {
        throw new Error(
          transactionData.message ||
            "Gagal mengambil data transaksi"
        );
      }

      if (!transactionProductsResponse.ok) {
        throw new Error(
          transactionProductsData.message ||
            "Gagal mengambil detail produk transaksi"
        );
      }

      const transactionDetail =
        transactionData.data;

      const allTransactionProducts =
        Array.isArray(
          transactionProductsData.data
        )
          ? transactionProductsData.data
          : [];

      const productsForTransaction =
        allTransactionProducts.filter(
          (item: TransactionProduct) =>
            Number(item.transaction_id) ===
            Number(transactionId)
        );

      setTransaction(transactionDetail);

      setTransactionProducts(
        productsForTransaction
      );

      setSelectedProducts([]);

      setPage("bill");
    } catch (error) {
      console.error(
        "GET BILL DATA ERROR:",
        error
      );

      setBillError(
        error instanceof Error
          ? error.message
          : "Gagal mengambil data bill"
      );
    } finally {
      setBillLoading(false);
    }
  };

  const handleViewBill = async (
    transactionId: number
  ) => {
    await handlePaymentSuccess(transactionId);
  };

  // ADMIN
  if (user.role === "admin") {
    return <AdminHome />;
  }

  // STAFF
  if (user.role === "staff") {
    if (billLoading) {
      return (
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "var(--bg)",
          }}
        >
          <p>Memuat bill transaksi...</p>
        </div>
      );
    }

    if (billError) {
      return (
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "16px",
            background: "var(--bg)",
          }}
        >
          <h2>Gagal memuat bill</h2>

          <p>{billError}</p>

          <button
            type="button"
            onClick={() => {
              setBillError("");
              setPage("history");
            }}
          >
            Kembali
          </button>
        </div>
      );
    }

    if (
      page === "bill" &&
      transaction
    ) {
      return (
        <Bill
          transaction={transaction}
          products={transactionProducts}
          onBack={() => {
            setTransaction(null);
            setTransactionProducts([]);
            setSelectedProducts([]);
            setPage("home");
          }}
        />
      );
    }

    if (page === "history") {
      return (
        <History
          onBack={() => {
            setPage("home");
          }}
          onViewBill={handleViewBill}
        />
      );
    }

    if (page === "payment") {
      return (
        <Payment
          selectedProducts={
            selectedProducts
          }
          onBack={() => {
            setSelectedProducts([]);
            setPage("home");
          }}
          onSuccess={
            handlePaymentSuccess
          }
        />
      );
    }

    return (
      <Home
        onPay={(products) => {
          setSelectedProducts(products);
          setPage("payment");
        }}
        onHistory={() => {
          setPage("history");
        }}
      />
    );
  }

  // Customer tidak ikut sistem POS
  localStorage.removeItem("token");
  localStorage.removeItem("user");

  return <Login />;
}

export default App;