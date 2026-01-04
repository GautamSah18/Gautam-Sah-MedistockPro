import "./CustomerDashboard.css";
import TopNav from "./TopNav";

const invoice = {
  no: "INV-2025-1228",
  date: "2025-12-28",
  customer: "Retailer Customer",
  paymentType: "Credit",
  dueDate: "2026-02-28",
  items: [
    { name: "Paracetamol 500mg", qty: 10, price: 200 },
    { name: "Azithromycin 500mg", qty: 5, price: 500 },
    { name: "ORS Pack", qty: 8, price: 150 },
  ],
};

export default function Billing() {
  const subtotal = invoice.items.reduce((a, it) => a + it.qty * it.price, 0);
  const discount = Math.round(subtotal * 0.05);
  const total = subtotal - discount;

  return (
    <div className="mdp">
      <TopNav showSearch={false} />
      <div className="page-wrap">
        <div className="page-card">
          <div className="bill-head">
            <div>
              <h2>Billing / Invoice</h2>
              <p className="page-sub">Invoice generated instantly after purchase.</p>
            </div>
            <button className="print-btn" onClick={() => window.print()}>Print</button>
          </div>

          <div className="invoice">
            <div className="inv-top">
              <div>
                <div className="inv-label">Invoice No</div>
                <div className="inv-value">{invoice.no}</div>
              </div>
              <div>
                <div className="inv-label">Date</div>
                <div className="inv-value">{invoice.date}</div>
              </div>
              <div>
                <div className="inv-label">Customer</div>
                <div className="inv-value">{invoice.customer}</div>
              </div>
              <div>
                <div className="inv-label">Payment</div>
                <div className="inv-value">
                  {invoice.paymentType}
                  {invoice.paymentType === "Credit" ? (
                    <span className="due-pill">Due: {invoice.dueDate}</span>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="inv-table">
              <div className="inv-row inv-headrow">
                <div>Item</div>
                <div className="right">Qty</div>
                <div className="right">Price</div>
                <div className="right">Total</div>
              </div>

              {invoice.items.map((it, idx) => (
                <div className="inv-row" key={idx}>
                  <div>{it.name}</div>
                  <div className="right">{it.qty}</div>
                  <div className="right">Rs {it.price}</div>
                  <div className="right"><b>Rs {it.qty * it.price}</b></div>
                </div>
              ))}
            </div>

            <div className="inv-summary">
              <div className="sum-row"><span>Subtotal</span><b>Rs {subtotal}</b></div>
              <div className="sum-row"><span>Discount</span><b>- Rs {discount}</b></div>
              <div className="sum-row total"><span>Grand Total</span><b>Rs {total}</b></div>

              {invoice.paymentType === "Credit" ? (
                <div className="credit-note">
                  Credit: You have 2 months to settle the bill. Late payment reduces discounts/bonuses and may restrict purchases.
                </div>
              ) : null}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
