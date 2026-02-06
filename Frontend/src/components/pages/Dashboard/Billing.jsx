import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from '../../../context/AuthContext';
import api from '../../../services/api';
import "./customerDashboard.css";
import TopNav from "./TopNav";

export default function Billing() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cart, paymentType = "cash", cartTotal, appliedScheme = null } = location.state || {};

  const items = useMemo(() => {
    return (
      cart || [
        { name: "Paracetamol 500mg", qty: 10, price: 200 },
        { name: "Azithromycin 500mg", qty: 5, price: 500 },
        { name: "ORS Pack", qty: 8, price: 150 },
      ]
    );
  }, [cart]);

  const subtotal = useMemo(() => {
    return cartTotal ?? items.reduce((a, it) => a + Number(it.qty) * Number(it.price), 0);
  }, [cartTotal, items]);


  const discount = useMemo(() => {
    // Base discount calculation
    let baseDiscount = Math.round(subtotal * 0.05);
    
    // Add scheme discount if applicable
    if (appliedScheme && appliedScheme.totalValue) {
      baseDiscount += appliedScheme.totalValue;
    }
    
    return baseDiscount;
  }, [subtotal, appliedScheme]);

  const TAX_RATE = 0.05;

  const computed = useMemo(() => {
    const totalQty = items.reduce((a, it) => a + Number(it.qty || 0), 0);

    const taxTotal = items.reduce((a, it) => {
      const price = Number(it.price || 0);
      const qty = Number(it.qty || 0);
      return a + price * TAX_RATE * qty;
    }, 0);

    const grandTotal = subtotal + taxTotal - discount;

    const received = paymentType === "cash" ? grandTotal : 0;
    const due = paymentType === "credit" ? grandTotal : 0;

    return { totalQty, taxTotal, grandTotal, received, due };
  }, [items, subtotal, discount, paymentType]);


  const invoiceNo = useMemo(() => {
    const d = new Date();
    return `INV-${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}${String(
      d.getDate()
    ).padStart(2, "0")}${Math.floor(1000 + Math.random() * 9000)}`;
  }, []);

  const date = useMemo(() => new Date().toISOString().split("T")[0], []);

  const formattedDueDate = useMemo(() => {
    const dueDate = new Date();
    dueDate.setMonth(dueDate.getMonth() + 2);
    return dueDate.toISOString().split("T")[0];
  }, []);

  const saveBill = async () => {
    try {
      // Prepare bill data with properly formatted items
      const formattedItems = items.map(item => ({
        name: item.name,
        qty: item.qty,
        price: item.price,
      }));
      
      const billData = {
        invoice_number: invoiceNo,
        customer: user.id,
        items: formattedItems,
        subtotal: parseFloat(subtotal.toFixed(2)),
        discount: parseFloat(discount.toFixed(2)),
        tax_total: parseFloat(computed.taxTotal.toFixed(2)),
        total_amount: parseFloat(computed.grandTotal.toFixed(2)),
        payment_type: paymentType,
        payment_status: paymentType === 'cash' ? 'paid' : 'pending',
      };
      
      // Send the bill data to the backend
      const response = await api.post('/api/billing/create/', billData);
      
      // If a scheme was applied, save the applied scheme data
      if (appliedScheme && response.data && response.data.id) {
        try {
          // Apply the scheme to the created bill
          const schemeResponse = await api.post('/api/bonus-schemes/bill-schemes/apply_scheme/', {
            bill_id: response.data.id,
            scheme_id: appliedScheme.scheme.id,
            selected_gift_ids: appliedScheme.selectedGifts.map(gift => gift.id)
          });
          
          console.log('Scheme applied to bill:', schemeResponse.data);
        } catch (schemeError) {
          console.error('Error applying scheme to bill:', schemeError);
          // Don't fail the whole process if scheme application fails
        }
      }
      
      console.log('Bill saved successfully:', response.data);
      
      // Save the bill first
      console.log('Bill saved successfully:', response.data);
      console.log('Payment type:', paymentType);
      console.log('Grand total:', computed.grandTotal.toFixed(2));
      
      if (paymentType === 'credit') {
        // For credit purchases, go back to dashboard
        navigate('/customerDashboard');
      } else {
        // For cash purchases, go to payment page
        navigate('/payment', { state: { totalAmount: computed.grandTotal.toFixed(2) } });
      }
      
    } catch (error) {
      console.error('Error saving bill:', error);
      
      // Check if there's a response with specific error details
      if (error.response) {
        console.error('Server Error:', error.response.data);
        alert(`Error processing payment: ${JSON.stringify(error.response.data)}`);
      } else if (error.request) {
        console.error('Request Error:', error.request);
        alert('Network error. Please check your connection and try again.');
      } else {
        console.error('General Error:', error.message);
        alert('Error processing payment. Please try again.');
      }
    }
  };


  const company = {
    name: "Medistock Pro",
    address: "Inaruwa",
    phone: "025-561152",
    pan: "PAN-674364646",
  };

  const billTo = {
    name: "Customer",
    address: "Customer Address Here",
    phone: "+91 98XXXXXXXX",
    pan: "PAN-XXXXX",
    placeOfSupply: "Inaruwa",
  };

  return (
    <div className="mdp">
      <TopNav showSearch={false} />

      <div className="ti-page">
        <div className="ti-headbar">
          <h1 className="ti-title">TAX INVOICE</h1>

          <button className="ti-print" onClick={() => window.print()}>
            Print
          </button>
        </div>

        <div className="ti-sheet">
          {/* Company Header */}
          <div className="ti-company">
            <div className="ti-company__name">{company.name}</div>
            <div className="ti-company__addr">{company.address}</div>

            <div className="ti-company__meta">
              <div>
                <b>Phone:</b> {company.phone}
              </div>
              <div>
                <b>PAN Number:</b> {company.pan}
              </div>
            </div>
          </div>

          
          <div className="ti-two">
            <div className="ti-box">
              <div className="ti-box__heading">BILL TO</div>

              <div className="ti-billto">
                <div className="ti-billto__name">{billTo.name}</div>
                <div className="ti-billto__line">{billTo.address}</div>
                <div className="ti-billto__line">Phone: {billTo.phone}</div>
                <div className="ti-billto__line">PAN Number: {billTo.pan}</div>
                <div className="ti-billto__line">Place of Supply: {billTo.placeOfSupply}</div>
              </div>
            </div>

            <div className="ti-box ti-box--meta">
              <div className="ti-metaGrid">
                <div className="ti-metaItem">
                  <div className="ti-metaLabel">Invoice No</div>
                  <div className="ti-metaValue">{invoiceNo}</div>
                </div>

                <div className="ti-metaItem">
                  <div className="ti-metaLabel">Invoice Date</div>
                  <div className="ti-metaValue">{date}</div>
                </div>

                <div className="ti-metaItem">
                  <div className="ti-metaLabel">Payment</div>
                  <div className="ti-metaValue">
                    {paymentType.charAt(0).toUpperCase() + paymentType.slice(1)}
                    {paymentType === "credit" ? (
                      <span className="due-pill">Due: {formattedDueDate}</span>
                    ) : null}
                  </div>
                </div>

                <div className="ti-metaItem">
                  <div className="ti-metaLabel">Customer</div>
                  <div className="ti-metaValue">{billTo.name}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="ti-tableWrap">
            <table className="ti-table">
              <thead>
                <tr>
                  <th className="ti-th-sr">Sr. No.</th>
                  <th className="ti-th-item">Items</th>
                  <th className="ti-th-qty">Quantity</th>
                  <th className="ti-th-price">Price / Unit</th>
                  <th className="ti-th-tax">Discount</th>
                  <th className="ti-th-amt">Amount</th>
                </tr>
              </thead>

              <tbody>
                {items.map((it, idx) => {
                  const qty = Number(it.qty || 0);
                  const price = Number(it.price || 0);
                  const taxPerUnit = price * TAX_RATE;
                  const amount = qty * (price + taxPerUnit);

                  return (
                    <tr key={it.id || idx}>
                      <td className="ti-td-sr">{idx + 1}</td>
                      <td className="ti-td-item">{it.name}</td>
                      <td className="ti-td-qty">{qty}</td>
                      <td className="ti-td-price">Rs. {price.toFixed(2)}</td>
                      <td className="ti-td-tax">
                        Rs. {taxPerUnit.toFixed(2)} ({Math.round(TAX_RATE * 100)}%)
                      </td>
                      <td className="ti-td-amt">Rs. {amount.toFixed(2)}</td>
                    </tr>
                  );
                })}

                {/* Discount */}
                <tr className="ti-discountRow">
                  <td />
                  <td className="ti-rightLabel" colSpan={4}>
                    Discount
                  </td>
                  <td className="ti-td-amt">Rs. {discount.toFixed(2)}</td>
                </tr>

                
                <tr className="ti-totalRow">
                  <td />
                  <td className="ti-totalLabel">Total</td>
                  <td className="ti-totalQty">{computed.totalQty}</td>
                  <td />
                  <td className="ti-totalTax">Rs. {computed.taxTotal.toFixed(2)}</td>
                  <td className="ti-totalAmt">Rs. {computed.grandTotal.toFixed(2)}</td>
                </tr>

                
                <tr>
                  <td />
                  <td className="ti-rightLabel" colSpan={4}>
                    Received Amount
                  </td>
                  <td className="ti-td-amt">Rs. {computed.received.toFixed(2)}</td>
                </tr>

                <tr>
                  <td />
                  <td className="ti-rightLabel ti-dueLabel" colSpan={4}>
                    Due Balance
                  </td>
                  <td className="ti-td-amt ti-dueAmt">Rs. {computed.due.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          
          <div className="ti-bottom">
            <div className="ti-bottomBox">
              <div className="ti-bottomTitle">Notes</div>
              <ol className="ti-list">
                <li>No return deal</li>
              </ol>
            </div>

            <div className="ti-bottomBox">
              <div className="ti-bottomTitle">Terms &amp; Conditions</div>
              <ol className="ti-list">
                {paymentType === "cash" && <li>Customer will pay the Delivery charges</li>}
                <li>Pay due amount within 60 days</li>
              </ol>
            </div>

            <div className="ti-bottomBox ti-sign">
              <div className="ti-signText">Authorised Signatory For</div>
              <div className="ti-signName">{company.name}</div>
            </div>
          </div>

          
          {paymentType === "credit" ? (
            <div className="credit-note" style={{ margin: "16px" }}>
              Credit: You have 2 months to settle the bill. Late payment reduces discounts/bonuses and may restrict purchases.
            </div>
          ) : null}
        </div>
      </div>
      <div style={{ margin: "20px", textAlign: "center" }}>
        <button type="button" className="proceed-payment-btn" onClick={saveBill}>
          {paymentType === 'credit' ? 'Continue to Dashboard' : 'Proceed to Payment'}
        </button>

      </div>

      
      
    </div>
  );
}