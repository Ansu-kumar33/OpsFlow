import { useNavigate } from 'react-router-dom';

const AccessDenied = () => {
  const navigate = useNavigate();

  return (
    <div className="dashboard-shell">
      <aside className="sidebar">
        <div className="brand-mark">O</div>
        <div className="sidebar-title">OpsFlow</div>
      </aside>

      <main className="dashboard-main empty-state-panel">
        <div className="empty-state">
          <h2>Access denied</h2>
          <p>You do not have permission to view this page.</p>
          <button className="primary-button" onClick={() => navigate('/dashboard', { replace: true })}>
            Return to dashboard
          </button>
        </div>
      </main>
    </div>
  );
};

export default AccessDenied;
