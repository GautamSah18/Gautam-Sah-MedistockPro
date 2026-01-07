import { useLocation } from "react-router-dom";
import "./CustomerDashboard.css";
import TopNav from "./TopNav";

export default function Billing() {
  const location = useLocation();
  const { cart, paymentType = 'cash', cartTotal } = location.state || {};
  
  // If no cart data is passed, use default values
  const items = cart || [
    { name: "Paracetamol 500mg", qty: 10, price: 200 },
    { name: "Azithromycin 500mg", qty: 5, price: 500 },
    { name: "ORS Pack", qty: 8, price: 150 },
  ];
  
  const subtotal = cartTotal || items.reduce((a, it) => a + it.qty * it.price, 0);
  const discount = Math.round(subtotal * 0.05);
  const total = subtotal - discount;
  
  // Generate invoice number and date
  const invoiceNo = `INV-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}${Math.floor(1000 + Math.random() * 9000)}`;
  const date = new Date().toISOString().split('T')[0];
  const customer = "Customer"; // This could be retrieved from user context
  const dueDate = new Date();
  dueDate.setMonth(dueDate.getMonth() + 2);
  const formattedDueDate = dueDate.toISOString().split('T')[0];

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
                <div className="inv-value">{invoiceNo}</div>
              </div>
              <div>
                <div className="inv-label">Date</div>
                <div className="inv-value">{date}</div>
              </div>
              <div>
                <div className="inv-label">Customer</div>
                <div className="inv-value">{customer}</div>
              </div>
              <div>
                <div className="inv-label">Payment</div>
                <div className="inv-value">
                  {paymentType.charAt(0).toUpperCase() + paymentType.slice(1)}
                  {paymentType === "credit" ? (
                    <span className="due-pill">Due: {formattedDueDate}</span>
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

              {items.map((it, idx) => (
                <div className="inv-row" key={it.id || idx}>
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

              {paymentType === "credit" ? (
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
