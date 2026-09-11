import { useNavigate } from 'react-router-dom';
import { getStoredUser } from '../services/api';

const Dashboard = () => {
  const navigate = useNavigate();
  const user = getStoredUser();

  const handleLogout = () => {
    localStorage.removeItem('opsflow_token');
    localStorage.removeItem('opsflow_user');
    navigate('/login', { replace: true });
  };

  if (!user) {
    return (
      <div className="empty-state">
        <h2>Session expired</h2>
        <p>Please log in again to access the dashboard.</p>
        <button className="primary-button" onClick={() => navigate('/login', { replace: true })}>
          Go to Login
        </button>
      </div>
    );
  }

  const summaryCards = [
    { label: 'Customers', value: 0 },
    { label: 'Products', value: 0 },
    { label: 'Inventory', value: 0 },
    { label: 'Sales Challans', value: 0 },
  ];

  return (
    <div className="dashboard-shell">
      <aside className="sidebar">
        <div className="brand-mark">O</div>
        <div className="sidebar-title">OpsFlow</div>

        <nav className="sidebar-nav">
          <button className="nav-item active" onClick={() => navigate('/dashboard')}>Dashboard</button>
          <button className="nav-item" onClick={() => navigate('/customers')}>Customers</button>
          <button className="nav-item">Products</button>
          <button className="nav-item">Inventory</button>
          <button className="nav-item">Challans</button>
        </nav>

        <button className="logout-button" onClick={handleLogout}>Logout</button>
      </aside>

      <main className="dashboard-main">
        <header className="topbar">
          <div>
            <p className="eyebrow">Operations overview</p>
            <h1>OpsFlow</h1>
          </div>
        </header>

        <section className="welcome-panel">
          <div>
            <p className="welcome-label">Welcome, {user.name}</p>
            <p className="role-label">Role: {user.role}</p>
          </div>
        </section>

        <section className="stats-grid">
          {summaryCards.map((card) => (
            <article key={card.label} className="stat-card">
              <p>{card.label}</p>
              <h3>{card.value}</h3>
            </article>
          ))}
        </section>

        <section className="actions-panel">
          <h2>Quick Actions</h2>
          <div className="action-list">
            <button className="action-button">Add Customer</button>
            <button className="action-button">Add Product</button>
            <button className="action-button">Create Sales Challan</button>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
