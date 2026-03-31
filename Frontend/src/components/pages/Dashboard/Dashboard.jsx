import React, { useState } from 'react';
import { 
  Menu, 
  ShoppingBag, 
  Package, 
  Users, 
  Settings, 
  Bell, 
  Search,
  Plus,
  TrendingUp,
  ArrowDownRight,
  MoreVertical
} from 'lucide-react';
import './Dasboard.css';

// Mock Data
const stats = [
  { title: 'Total Orders', value: '1,245', trend: '+12%', isUp: true },
  { title: 'Pending Invoices', value: '$4,250', trend: '+2 overdue', isUp: false },
  { title: 'Inventory Value', value: '$32,500', trend: '+5%', isUp: true },
];

const recentOrders = [
  { id: '#ORD-7782', date: 'Oct 24, 2023', customer: 'Green Grocers', total: '$1,200.00', status: 'Completed' },
  { id: '#ORD-7783', date: 'Oct 24, 2023', customer: 'Fresh Market', total: '$850.00', status: 'Pending' },
  { id: '#ORD-7784', date: 'Oct 23, 2023', customer: 'City Organics', total: '$2,340.00', status: 'Completed' },
  { id: '#ORD-7785', date: 'Oct 22, 2023', customer: 'Valley Foods', total: '$120.00', status: 'Cancelled' },
];

const navItems = [
  { icon: <Package size={20} />, label: 'Dashboard', id: 'dashboard' },
  { icon: <ShoppingBag size={20} />, label: 'Orders', id: 'orders' },
  { icon: <Users size={20} />, label: 'Suppliers', id: 'suppliers' },
  { icon: <Settings size={20} />, label: 'Settings', id: 'settings' },
];

function App() {
  const [activeNav, setActiveNav] = useState('dashboard');
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="logo-area">
          <div className="logo-icon">
            <Package size={24} />
          </div>
          <span>EcoWholesale</span>
        </div>

        <nav className="nav-menu">
          {navItems.map((item) => (
            <div
              key={item.id}
              className={`nav-item ${activeNav === item.id ? 'active' : ''}`}
              onClick={() => {
                setActiveNav(item.id);
                setSidebarOpen(false);
              }}
            >
              {item.icon}
              <span>{item.label}</span>
            </div>
          ))}
        </nav>

        <div style={{ marginTop: 'auto', padding: '24px' }}>
          <div style={{ 
            backgroundColor: 'rgba(255,255,255,0.1)', 
            padding: '16px', 
            borderRadius: '8px',
            fontSize: '0.85rem'
          }}>
            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Need help?</div>
            <div style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '12px' }}>Contact support for bulk ordering issues.</div>
            <button className="btn btn-orange" style={{ width: '100%', fontSize: '0.8rem', padding: '6px' }}>
              Contact Us
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {/* Header */}
        <header className="header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button className="mobile-toggle" onClick={() => setSidebarOpen(!isSidebarOpen)}>
              <Menu size={24} />
            </button>
            <div className="page-title">
              <h2>Dashboard Overview</h2>
              <p>Welcome back, here is what's happening with your store today.</p>
            </div>
          </div>

          <div className="user-info">
            <div style={{ position: 'relative' }}>
               <Bell size={20} className="text-muted" style={{ color: '#64748b', cursor: 'pointer' }} />
               <span style={{
                 position: 'absolute', top: '-2px', right: '-2px', 
                 width: '8px', height: '8px', backgroundColor: 'var(--orange)', 
                 borderRadius: '50%'
               }}></span>
            </div>
            <div style={{ textAlign: 'right', display: { xs: 'none', md: 'block' } }}>
              <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>Alex Morgan</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Store Manager</div>
            </div>
            <img 
              src="https://picsum.photos/seed/manager/40/40" 
              alt="User" 
              className="user-avatar" 
            />
          </div>
        </header>

        {/* Stats Section */}
        <div className="stats-grid">
          {stats.map((stat, index) => (
            <div key={index} className={`stat-card ${stat.title.includes('Pending') ? 'alert' : ''}`}>
              <div className="stat-label">{stat.title}</div>
              <div className="stat-value">{stat.value}</div>
              <div className={`stat-trend ${stat.isUp ? 'trend-up' : 'trend-down'}`}>
                {stat.isUp ? <TrendingUp size={14} /> : <ArrowDownRight size={14} />}
                <span>{stat.trend} <span style={{ color: '#94a3b8', marginLeft: '4px' }}>vs last month</span></span>
              </div>
            </div>
          ))}
        </div>

        {/* Recent Orders Section */}
        <div className="content-card">
          <div className="card-header">
            <h3 className="card-title">Recent Wholesale Orders</h3>
            <button className="btn btn-secondary">
              View All Orders
            </button>
          </div>

          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Date</th>
                  <th>Customer</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id}>
                    <td style={{ fontWeight: '600' }}>{order.id}</td>
                    <td>{order.date}</td>
                    <td>{order.customer}</td>
                    <td style={{ fontWeight: '500' }}>{order.total}</td>
                    <td>
                      <span className={`status-badge status-${order.status.toLowerCase()}`}>
                        {order.status}
                      </span>
                    </td>
                    <td>
                      <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                        <MoreVertical size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Action */}
        <div className="content-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 className="card-title" style={{ marginBottom: '4px' }}>Low Stock Alert</h3>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              12 products are running low on inventory. Reorder now to avoid delays.
            </p>
          </div>
          <button className="btn btn-orange">
            <Plus size={18} /> Create Purchase Order
          </button>
        </div>

      </main>
    </div>
  );
}

export default App;