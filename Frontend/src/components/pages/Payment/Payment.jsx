import CryptoJS from "crypto-js";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";

const Payment = () => {
  const location = useLocation();
  const totalAmount = location.state?.totalAmount || "10";
  const appliedScheme = location.state?.appliedScheme;

  const [hover, setHover] = useState(false);

  const [formData, setformData] = useState({
    amount: totalAmount,
    tax_amount: "0",
    total_amount: totalAmount,
    transaction_uuid: uuidv4(),
    product_service_charge: "0",
    product_delivery_charge: "0",
    product_code: "EPAYTEST",
    success_url: "http://localhost:5173/paymentsuccess",
    failure_url: "http://localhost:5173/paymentfailure",
    signed_field_names: "total_amount,transaction_uuid,product_code",
    signature: "",
    secret: "8gBm/:&EnhH.1/q",
  });


  useEffect(() => {
    setformData((prev) => ({
      ...prev,
      amount: totalAmount,
      total_amount: totalAmount,
    }));
  }, [totalAmount]);

  const generateSignature = (total_amount, transaction_uuid, product_code, secret) => {
    const hashString = `total_amount=${total_amount},transaction_uuid=${transaction_uuid},product_code=${product_code}`;
    const hash = CryptoJS.HmacSHA256(hashString, secret);
    return CryptoJS.enc.Base64.stringify(hash);
  };

  useEffect(() => {
    const { total_amount, transaction_uuid, product_code, secret } = formData;
    const signature = generateSignature(total_amount, transaction_uuid, product_code, secret);

    setformData((prev) => ({
      ...prev,
      signature,
    }));
  }, [formData.total_amount, formData.transaction_uuid, formData.product_code]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        padding: "40px 16px",
        background: "#f5f6f8",
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
      }}
    >
      <form
        action="https://rc-epay.esewa.com.np/api/epay/main/v2/form"
        method="POST"
        style={{
          width: "100%",
          maxWidth: "420px",
          padding: "24px",
          borderRadius: "10px",
          background: "#ffffff",
          boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
        }}
      >
        <h2 style={{ margin: "0 0 16px 0" }}>Pay with eSewa</h2>

        {/* Display applied scheme information */}
        {appliedScheme && (
          <div style={{ marginBottom: "14px", padding: "12px", backgroundColor: "#e8f5e8", border: "1px solid #4caf50", borderRadius: "6px" }}>
            <div style={{ fontWeight: "bold", color: "#2e7d32", marginBottom: "4px" }}>Scheme Applied: {appliedScheme.name}</div>
            <div style={{ fontSize: "14px", color: "#388e3c" }}>Congratulations! Your scheme has been applied to this purchase.</div>
          </div>
        )}
        {!appliedScheme && (
          <div style={{ marginBottom: "14px", padding: "12px", backgroundColor: "#e3f2fd", border: "1px solid #2196f3", borderRadius: "6px" }}>
            <div style={{ fontWeight: "bold", color: "#1976d2", marginBottom: "4px" }}>Schemes Available</div>
            <div style={{ fontSize: "14px", color: "#1565c0" }}>Remember to check Bonus & Schemes page to apply eligible schemes for discounts!</div>
          </div>
        )}

        <div style={{ marginBottom: "14px" }}>
          <label style={{ display: "block", marginBottom: "6px", fontWeight: 600 }}>
            Amount
          </label>
          <input
            type="text"
            id="amount"
            name="amount"
            value={formData.amount}
            onChange={({ target }) =>
              setformData((prev) => ({
                ...prev,
                amount: target.value,
                total_amount: target.value,
              }))
            }
            required
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: "6px",
              border: "1px solid #d0d5dd",
              outline: "none",
              fontSize: "14px",
            }}
          />
        </div>

        {/* Required hidden fields */}
        <input type="hidden" id="tax_amount" name="tax_amount" value={formData.tax_amount} />
        <input type="hidden" id="total_amount" name="total_amount" value={formData.total_amount} />
        <input type="hidden" id="transaction_uuid" name="transaction_uuid" value={formData.transaction_uuid} />
        <input type="hidden" id="product_code" name="product_code" value={formData.product_code} />
        <input type="hidden" id="product_service_charge" name="product_service_charge" value={formData.product_service_charge} />
        <input type="hidden" id="product_delivery_charge" name="product_delivery_charge" value={formData.product_delivery_charge} />
        <input type="hidden" id="signed_field_names" name="signed_field_names" value={formData.signed_field_names} />
        <input type="hidden" id="signature" name="signature" value={formData.signature} />

        {/* success / failure URLs*/}
        <input type="hidden" id="success_url" name="success_url" value={formData.success_url} />
        <input type="hidden" id="failure_url" name="failure_url" value={formData.failure_url} />

        <div style={{ display: "flex", gap: "10px", marginBottom: "14px" }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: "block", marginBottom: "6px", fontWeight: 600 }}>
              First Name
            </label>
            <input
              type="text"
              placeholder="First Name"
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: "6px",
                border: "1px solid #d0d5dd",
                outline: "none",
                fontSize: "14px",
              }}
            />
          </div>

          <div style={{ flex: 1 }}>
            <label style={{ display: "block", marginBottom: "6px", fontWeight: 600 }}>
              Last Name
            </label>
            <input
              type="text"
              placeholder="Last Name"
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: "6px",
                border: "1px solid #d0d5dd",
                outline: "none",
                fontSize: "14px",
              }}
            />
          </div>
        </div>

        <input
          value="Pay with eSewa"
          type="submit"
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
          style={{
            backgroundColor: hover ? "#4ea63a" : "#60bb46",
            color: "#ffffff",
            border: "none",
            padding: "12px 18px",
            fontSize: "16px",
            fontWeight: "700",
            borderRadius: "8px",
            cursor: "pointer",
            width: "100%",
            transition: "background-color 0.2s ease, transform 0.1s ease",
          }}
        />

        <p style={{ marginTop: "12px", fontSize: "12px", color: "#667085" }}>
          Note: This is the eSewa sandbox endpoint (rc-epay). Use production URL when going live.
        </p>
      </form>
    </div>
  );
};

export default Payment;
