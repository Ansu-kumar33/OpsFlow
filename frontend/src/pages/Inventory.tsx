import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authenticatedApi, getStoredUser } from '../services/api';

type InventoryItem = {
  id: number;
  product_id: number;
  product_name: string;
  sku: string;
  quantity: number;
  reorder_level: number;
  location: string | null;
  stock_status: 'In Stock' | 'Low Stock' | 'Out of Stock';
};

type ProductOption = {
  id: number;
  product_name: string;
  sku: string;
  price: number;
};

type StockMovement = {
  id: number;
  product_name?: string;
  sku?: string;
  movement_type: 'IN' | 'OUT';
  quantity: number;
  reason: string | null;
  created_by: string | null;
  created_at: string;
};

const Inventory = () => {
  const navigate = useNavigate();
  const user = getStoredUser();
  const canManageStock = user?.role === 'ADMIN' || user?.role === 'WAREHOUSE';

  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [movementLoading, setMovementLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({
    product_id: '',
    movement_type: 'IN',
    quantity: '1',
    reason: '',
  });

  const currentInventory = inventory.find((item) => String(item.product_id) === String(form.product_id));

  const loadInventory = async (query = '') => {
    setLoading(true);
    try {
      const data = await authenticatedApi<InventoryItem[]>(query ? `/api/inventory?search=${encodeURIComponent(query)}` : '/api/inventory');
      setInventory(data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to fetch inventory');
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const data = await authenticatedApi<ProductOption[]>('/api/products');
      setProducts(data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to fetch products');
    }
  };

  const loadStockMovements = async () => {
    try {
      const data = await authenticatedApi<StockMovement[]>('/api/stock-movements');
      setStockMovements(data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to fetch stock movements');
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true });
      return;
    }

    loadInventory();
    loadProducts();
    loadStockMovements();
  }, [navigate, user]);

  const handleLogout = () => {
    localStorage.removeItem('opsflow_token');
    localStorage.removeItem('opsflow_user');
    navigate('/login', { replace: true });
  };

  const handleFormChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleMovementSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.product_id) {
      setError('Please select a product.');
      return;
    }

    const quantity = Number(form.quantity);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      setError('Quantity must be greater than 0.');
      return;
    }

    setMovementLoading(true);
    setError('');
    setSuccess('');

    try {
      await authenticatedApi('/api/stock-movements', {
        method: 'POST',
        body: JSON.stringify({
          product_id: Number(form.product_id),
          movement_type: form.movement_type,
          quantity,
          reason: form.reason.trim() || 'Stock movement',
        }),
      });

      setSuccess('Stock movement recorded successfully.');
      setForm({ product_id: '', movement_type: 'IN', quantity: '1', reason: '' });
      await loadInventory(search);
      await loadStockMovements();
    } catch (movementError) {
      const message = movementError instanceof Error ? movementError.message : 'Unable to submit stock movement';
      setError(message);
    } finally {
      setMovementLoading(false);
    }
  };

  const filtered = inventory.filter((item) => `${item.product_name} ${item.sku} ${item.location || ''}`.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="dashboard-shell">
      <aside className="sidebar">
        <div className="brand-mark">O</div>
        <div className="sidebar-title">OpsFlow</div>
        <nav className="sidebar-nav">
          <button className="nav-item" onClick={() => navigate('/dashboard')}>Dashboard</button>
          {(user?.role === 'ADMIN' || user?.role === 'SALES' || user?.role === 'ACCOUNTS') && <button className="nav-item" onClick={() => navigate('/customers')}>Customers</button>}
          <button className="nav-item" onClick={() => navigate('/products')}>Products</button>
          <button className="nav-item active" onClick={() => navigate('/inventory')}>Inventory</button>
          {(user?.role === 'ADMIN' || user?.role === 'SALES' || user?.role === 'WAREHOUSE' || user?.role === 'ACCOUNTS') && <button className="nav-item" onClick={() => navigate('/challans')}>Challans</button>}
        </nav>
        <button className="logout-button" onClick={handleLogout}>Logout</button>
      </aside>

      <main className="dashboard-main customer-page">
        <header className="topbar customer-topbar">
          <div>
            <p className="eyebrow">Warehouse</p>
            <h1>Inventory</h1>
          </div>
        </header>

        {canManageStock && (
          <section className="customer-panel">
            <div className="customer-form-header">
              <h2>Stock Movement</h2>
            </div>

            <form className="customer-form" onSubmit={handleMovementSubmit}>
              <div className="field-grid">
                <div className="field">
                  <label>Product</label>
                  <select name="product_id" value={form.product_id} onChange={handleFormChange}>
                    <option value="">Select a product</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>{product.product_name} ({product.sku})</option>
                    ))}
                  </select>
                </div>

                <div className="field">
                  <label>Movement type</label>
                  <select name="movement_type" value={form.movement_type} onChange={handleFormChange}>
                    <option value="IN">IN</option>
                    <option value="OUT">OUT</option>
                  </select>
                </div>

                <div className="field">
                  <label>Quantity</label>
                  <input type="number" name="quantity" min="1" value={form.quantity} onChange={handleFormChange} />
                </div>

                <div className="field full-width">
                  <label>Reason</label>
                  <input name="reason" value={form.reason} onChange={handleFormChange} placeholder="e.g. Purchase receipt, stock correction, sales issue" />
                </div>
              </div>

              {currentInventory && (
                <div className="stock-summary-box">
                  <strong>Current stock:</strong> {currentInventory.quantity} units
                  <span className={`status-pill ${currentInventory.stock_status === 'Low Stock' ? 'status-low' : currentInventory.stock_status === 'Out of Stock' ? 'status-out' : 'status-in'}`}>
                    {currentInventory.stock_status}
                  </span>
                </div>
              )}

              {error && <div className="message error-message">{error}</div>}
              {success && <div className="message success-message">{success}</div>}

              <div className="form-actions">
                <button className="primary-button" type="submit" disabled={movementLoading}>
                  {movementLoading ? 'Submitting...' : 'Submit Movement'}
                </button>
              </div>
            </form>
          </section>
        )}

        <section className="customer-list-panel">
          <div className="list-header">
            <h2>Stock Overview</h2>
            <div className="search-box"><input value={search} onChange={(event) => { setSearch(event.target.value); loadInventory(event.target.value); }} placeholder="Search inventory" /></div>
          </div>

          {error && <div className="message error-message">{error}</div>}
          {loading ? <div className="loading-box">Loading inventory...</div> : filtered.length === 0 ? <div className="empty-box">No inventory records.</div> : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr><th>Product</th><th>SKU</th><th>Current Stock</th><th>Reorder</th><th>Location</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {filtered.map((item) => (
                    <tr key={item.id}>
                      <td>{item.product_name}</td>
                      <td>{item.sku}</td>
                      <td>{item.quantity}</td>
                      <td>{item.reorder_level}</td>
                      <td>{item.location || '-'}</td>
                      <td><span className={`status-pill ${item.stock_status === 'Low Stock' ? 'status-low' : item.stock_status === 'Out of Stock' ? 'status-out' : 'status-in'}`}>{item.stock_status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {canManageStock && (
          <section className="customer-list-panel">
            <div className="list-header">
              <h2>Stock Movement History</h2>
            </div>

            {stockMovements.length === 0 ? (
              <div className="empty-box">No stock movements recorded.</div>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr><th>Product</th><th>Type</th><th>Quantity</th><th>Reason</th><th>Created by</th><th>Date/time</th></tr>
                  </thead>
                  <tbody>
                    {stockMovements.map((movement) => (
                      <tr key={movement.id}>
                        <td>{movement.product_name || movement.sku || 'Product'}</td>
                        <td><span className={`status-pill ${movement.movement_type === 'OUT' ? 'status-out' : 'status-in'}`}>{movement.movement_type}</span></td>
                        <td>{movement.quantity}</td>
                        <td>{movement.reason || '-'}</td>
                        <td>{movement.created_by || '-'}</td>
                        <td>{new Date(movement.created_at).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
};

export default Inventory;
