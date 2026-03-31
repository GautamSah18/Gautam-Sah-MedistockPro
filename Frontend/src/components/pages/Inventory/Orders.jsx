import { useEffect, useState } from "react";
import api from '../../../services/api';
import "../Dashboard/customerDashboard.css";



export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await api.get('/api/billing/');
        const bills = response.data;

        // Transform bills data to match the orders format
        const transformedOrders = bills.map(bill => ({
          id: bill.invoice_number,
          date: new Date(bill.created_at).toISOString().split('T')[0],
          amount: bill.total_amount,
          status: bill.payment_status.charAt(0).toUpperCase() + bill.payment_status.slice(1),
          items: bill.items ? bill.items.length : 0,
          customer: bill.customer,
          payment_type: bill.payment_type,
          created_at: bill.created_at,
          updated_at: bill.updated_at,
          transaction_id: bill.transaction_id,
          subtotal: bill.subtotal,
          discount: bill.discount,
          tax_total: bill.tax_total
        }));

        setOrders(transformedOrders);
        if (transformedOrders.length > 0) {
          setSelected(transformedOrders[0]);
        }
      } catch (error) {
        console.error('Error fetching orders:', error);
        // Fallback to empty array
        setOrders([]);
        setSelected(null);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);



  // Function to download a bill
  const downloadBill = async (billId) => {
    try {
      const token = localStorage.getItem('access_token');
      // Open the bill in a new window/tab for printing/download with auth token
      window.open(`${api.defaults.baseURL}/api/billing/admin/${billId}/print/?token=${token}`, '_blank');
    } catch (error) {
      console.error('Error downloading bill:', error);
      alert('Error downloading bill');
    }
  };

  return (
    <div className="mdp">
      <div className="page-wrap">
        <div className="page-card">
          <h2>All Bills</h2>
          <p className="page-sub">View all bills generated after customer checkout.</p>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-6 h-6 border-2 border-gray-300 border-t-green-500 rounded-full animate-spin mb-3"></div>
              <p>Loading orders...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center text-gray-500">
              <p>No orders found.</p>
            </div>
          ) : (
            <div className="orders-layout">
              <div className="orders-list">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Invoice #</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Date</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Customer</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Items</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Amount</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Payment Type</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Status</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {orders.map((bill) => (
                        <tr key={bill.id}>
                          <td className="px-3 py-2 whitespace-nowrap text-sm">{bill.id}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm">{bill.date}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm">{typeof bill.customer === 'object' ? bill.customer.id || bill.customer.email || 'N/A' : bill.customer}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm">{bill.items}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm">Rs {bill.amount}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm">{bill.payment_type}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bill.status.toLowerCase() === 'paid' ? 'bg-green-100 text-green-800' : bill.status.toLowerCase() === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                              {bill.status}
                            </span>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm">
                            <button
                              className="!bg-green-500 !text-white border-none rounded-md px-2.5 py-1.5 cursor-pointer text-sm transition-colors hover:!bg-green-600 hover:shadow-md"
                              onClick={() => downloadBill(bill.id)}
                              title="Download Bill"
                            >
                              📄
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}