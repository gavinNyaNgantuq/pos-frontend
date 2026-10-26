import { jsPDF } from "jspdf";
import "./Bill.css";
import Footer from "../components/Footer";
import ThemeToggle from "../components/ThemeToggle";
import image1 from "../assets/image1.png";

interface Transaction {
  id: number;
  invoice_no?: string | null;
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
  payment_ref?: string | null;
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

interface BillProps {
  transaction: Transaction;
  products: TransactionProduct[];
  onBack: () => void;
}

function Bill({
  transaction,
  products,
  onBack,
}: BillProps) {
  const formatRupiah = (
    value: number | string | null
  ) => {
    const numberValue = Number(value) || 0;

    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(numberValue);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString("id-ID", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handlePrint = () => {
    const productHeight = products.reduce(
      (total, product) => {
        const nameLength = product.product_name?.length || 0;
        const nameLines = Math.max(
          1,
          Math.ceil(nameLength / 32)
        );

        return total + 10 + nameLines * 4;
      },
      0
    );

    const pdfHeight = Math.max(
      155,
      130 + productHeight
    );

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: [80, pdfHeight],
      compress: true,
    });

    const pageWidth =
      pdf.internal.pageSize.getWidth();

    const margin = 5;
    const left = margin;
    const right = pageWidth - margin;
    const center = pageWidth / 2;

    const contentWidth = right - left;
    const lineGap = 4;

    // Satu baris label (kiri) + nilai (kanan).
    // Nilai dibatasi agar tidak menimpa label; auto-wrap.
    const drawRow = (
      label: string,
      value: string | number,
      boldValue = false
    ) => {
      pdf.setFont("helvetica", "normal");

      const labelWidth = pdf.getTextWidth(label);

      pdf.text(label, left, y);

      pdf.setFont(
        "helvetica",
        boldValue ? "bold" : "normal"
      );

      const valueWidth = Math.max(
        contentWidth - labelWidth - 2,
        20
      );

      const lines = pdf.splitTextToSize(
        String(value),
        valueWidth
      );

      pdf.text(lines, right, y, {
        align: "right",
      });

      return Math.max(1, lines.length);
    };

    let y = 7;

    // LOGO
    try {
      pdf.addImage(
        image1,
        "PNG",
        center - 7.5,
        y,
        15,
        15
      );

      y += 19;
    } catch {
      y += 2;
    }

    // HEADER
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(13);

    pdf.text(
      "STRUK PEMBAYARAN",
      center,
      y,
      {
        align: "center",
      }
    );

    y += 6;

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);

    pdf.text(
      "Terima kasih sudah berbelanja",
      center,
      y,
      {
        align: "center",
      }
    );

    y += 5;

    pdf.line(left, y, right, y);

    y += 5;

    // INFORMASI TRANSAKSI
    pdf.setFontSize(8);

    let infoLines = drawRow(
      "No. Transaksi",
      transaction.invoice_no ||
        `#${transaction.id}`,
      true
    );

    y += 5 + (infoLines - 1) * lineGap;

    infoLines = drawRow(
      "Tanggal",
      formatDate(transaction.created_at)
    );

    y += 5 + (infoLines - 1) * lineGap;

    infoLines = drawRow(
      "Kasir",
      transaction.username || "-"
    );

    y += 5 + (infoLines - 1) * lineGap;

    pdf.line(left, y, right, y);

    y += 5;

    // PRODUK
    pdf.setFont("helvetica", "bold");

    pdf.text(
      "Produk",
      left,
      y
    );

    y += 5;

    if (products.length === 0) {
      pdf.setFont("helvetica", "normal");

      pdf.text(
        "Tidak ada produk",
        center,
        y,
        {
          align: "center",
        }
      );

      y += 6;
    } else {
      products.forEach((product) => {
        const productName =
          product.product_name || "-";

        const productLines =
          pdf.splitTextToSize(
            productName,
            contentWidth
          );

        pdf.setFont(
          "helvetica",
          "bold"
        );

        pdf.text(
          productLines,
          left,
          y
        );

        y +=
          productLines.length * lineGap;

        const detailText =
          `${product.quantity} x ${formatRupiah(
            product.price
          )}`;

        pdf.setFont(
          "helvetica",
          "normal"
        );

        const detailWidth =
          pdf.getTextWidth(detailText);

        pdf.text(
          detailText,
          left,
          y
        );

        pdf.setFont(
          "helvetica",
          "bold"
        );

        const subtotalWidth = Math.max(
          contentWidth - detailWidth - 2,
          20
        );

        const subtotalLines =
          pdf.splitTextToSize(
            formatRupiah(
              product.subtotal
            ),
            subtotalWidth
          );

        pdf.text(subtotalLines, right, y, {
          align: "right",
        });

        y +=
          6 +
          (subtotalLines.length - 1) *
            lineGap;
      });
    }

    pdf.line(left, y, right, y);

    y += 5;

    // SUMMARY
    let summaryLines = drawRow(
      "Subtotal",
      formatRupiah(
        transaction.total_before_discount
      )
    );

    y += 5 + (summaryLines - 1) * lineGap;

    summaryLines = drawRow(
      "Diskon",
      `- ${formatRupiah(
        transaction.discount
      )}`
    );

    y += 5 + (summaryLines - 1) * lineGap;

    summaryLines = drawRow(
      transaction.tax_rate
        ? `Pajak (${transaction.tax_rate}%)`
        : "Pajak",
      formatRupiah(
        transaction.tax_amount
      )
    );

    y += 5 + (summaryLines - 1) * lineGap;

    pdf.line(left, y, right, y);

    y += 6;

    // TOTAL
    pdf.setFont(
      "helvetica",
      "bold"
    );

    pdf.setFontSize(10);

    const totalLabelWidth =
      pdf.getTextWidth("TOTAL");

    const totalValueWidth = Math.max(
      contentWidth - totalLabelWidth - 2,
      20
    );

    const totalValueLines =
      pdf.splitTextToSize(
        formatRupiah(
          transaction.total_after_tax
        ),
        totalValueWidth
      );

    pdf.text("TOTAL", left, y);

    pdf.text(totalValueLines, right, y, {
      align: "right",
    });

    y +=
      7 +
      (totalValueLines.length - 1) * lineGap;

    pdf.line(left, y, right, y);

    y += 5;

    // PEMBAYARAN
    pdf.setFontSize(8);

    let payLines = drawRow(
      "Metode",
      transaction.payment_method || "-"
    );

    y += 5 + (payLines - 1) * lineGap;

    if (transaction.payment_ref) {
      payLines = drawRow(
        "Referensi",
        transaction.payment_ref
      );

      y += 5 + (payLines - 1) * lineGap;
    }

    payLines = drawRow(
      "Dibayar",
      formatRupiah(
        transaction.payment
      )
    );

    y += 5 + (payLines - 1) * lineGap;

    payLines = drawRow(
      "Kembalian",
      formatRupiah(
        transaction.change
      )
    );

    y += 8 + (payLines - 1) * lineGap;

    // FOOTER
    pdf.text(
      "Terima kasih",
      center,
      y,
      {
        align: "center",
      }
    );

    y += 4;

    pdf.text(
      "Silakan datang kembali",
      center,
      y,
      {
        align: "center",
      }
    );

    // SAVE PDF
    pdf.save(
      `struk-${
        transaction.invoice_no ||
        transaction.id
      }.pdf`
    );
  };

  return (
    <div className="bill-page">

      <div className="bill">

        {/* LOGO */}
        <div className="bill-logo">
          <img
            src={image1}
            alt="Logo"
          />
        </div>

        {/* HEADER */}
        <div className="bill-header">
          <h1>
            STRUK PEMBAYARAN
          </h1>

          <p>
            Terima kasih sudah berbelanja
          </p>
        </div>

        <div className="bill-divider">
          --------------------------------
        </div>

        {/* INFORMASI TRANSAKSI */}
        <div className="bill-info">

          <div className="bill-info-row">
            <span>
              No. Transaksi
            </span>

            <strong>
              {transaction.invoice_no ||
                `#${transaction.id}`}
            </strong>
          </div>

          <div className="bill-info-row">
            <span>
              Tanggal
            </span>

            <span>
              {formatDate(
                transaction.created_at
              )}
            </span>
          </div>

          <div className="bill-info-row">
            <span>
              Kasir
            </span>

            <span>
              {transaction.username}
            </span>
          </div>

        </div>

        <div className="bill-divider">
          --------------------------------
        </div>

        {/* PRODUK */}
        <div className="bill-products">

          {products.length === 0 ? (
            <p className="bill-empty">
              Tidak ada produk
            </p>
          ) : (
            products.map((product) => (
              <div
                className="bill-product"
                key={product.id}
              >

                <div className="bill-product-name">
                  {product.product_name}
                </div>

                <div className="bill-product-detail">

                  <span>
                    {product.quantity} x{" "}
                    {formatRupiah(
                      product.price
                    )}
                  </span>

                  <strong>
                    {formatRupiah(
                      product.subtotal
                    )}
                  </strong>

                </div>

              </div>
            ))
          )}

        </div>

        <div className="bill-divider">
          --------------------------------
        </div>

        {/* TOTAL */}
        <div className="bill-summary">

          <div className="bill-summary-row">

            <span>
              Subtotal
            </span>

            <span>
              {formatRupiah(
                transaction.total_before_discount
              )}
            </span>

          </div>

          <div className="bill-summary-row">

            <span>
              Diskon
            </span>

            <span>
              -{" "}
              {formatRupiah(
                transaction.discount
              )}
            </span>

          </div>

          <div className="bill-summary-row">

            <span>
              Pajak
              {transaction.tax_rate
                ? ` (${transaction.tax_rate}%)`
                : ""}
            </span>

            <span>
              {formatRupiah(
                transaction.tax_amount
              )}
            </span>

          </div>

          <div className="bill-total-row">

            <strong>
              TOTAL
            </strong>

            <strong>
              {formatRupiah(
                transaction.total_after_tax
              )}
            </strong>

          </div>

        </div>

        <div className="bill-divider">
          --------------------------------
        </div>

        {/* PEMBAYARAN */}
        <div className="bill-payment">

          <div className="bill-summary-row">

            <span>
              Metode
            </span>

            <span>
              {transaction.payment_method ||
                "-"}
            </span>

          </div>

          {transaction.payment_ref && (
            <div className="bill-summary-row">

              <span>
                Referensi
              </span>

              <span>
                {transaction.payment_ref}
              </span>

            </div>
          )}

          <div className="bill-summary-row">

            <span>
              Dibayar
            </span>

            <span>
              {formatRupiah(
                transaction.payment
              )}
            </span>

          </div>

          <div className="bill-summary-row">

            <span>
              Kembalian
            </span>

            <span>
              {formatRupiah(
                transaction.change
              )}
            </span>

          </div>

        </div>

        {/* FOOTER */}
        <div className="bill-footer">
          <p>
            Terima kasih
          </p>

          <p>
            Silakan datang kembali
          </p>
        </div>

      </div>

      {/* BUTTON */}
      <div className="bill-actions no-print">

        <ThemeToggle />

        <button
          type="button"
          className="bill-back-button"
          onClick={onBack}
        >
          Kembali
        </button>

        <button
          type="button"
          className="bill-print-button"
          onClick={handlePrint}
        >
          Simpan PDF
        </button>

        <button
          type="button"
          className="bill-back-button"
          onClick={() => window.print()}
        >
          Cetak
        </button>

      </div>

      <Footer className="no-print" />
    </div>
  );
}

export default Bill;
