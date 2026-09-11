import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authenticatedApi, getStoredUser } from '../services/api';

type Challan = {
  id: number;
  challan_number: string;
  customer_id: number;
  customer_name?: string;
  status: 'DRAFT' | 'CONFIRMED' | 'CANCELLED';
  created_by?: string;
  notes?: string | null;
  challan_date?: string;
  created_at?: string;
};

type CustomerOption = {
  id: number;
  name: string;
  mobile: string;
  business_name?: string | null;
};

type ProductOption = {
  id: number;
  product_name: string;
  sku: string;
  price: number;
};

type InventoryRow = {
  product_id: number;
  quantity: number;
};

type ChallanDetailItem = {
  id: number;
  challan_id: number;
  product_id: number;
  product_name_snapshot: string;
  sku_snapshot: string;
  quantity: number;
  unit_price_snapshot: number;
};

type ChallanDetail = {
  challan: Challan;
  items: ChallanDetailItem[];
};

type DraftItem = {
  product_id: string;
  quantity: string;
};

const buildEmptyDraft = (): DraftItem[] => [{ product_id: '', quantity: '1' }];

const Challans = () => {
  const navigate = useNavigate();
  const user = getStoredUser();
  const canCreateChallan = user?.role === 'ADMIN' || user?.role === 'SALES';

  const [challans, setChallans] = useState<Challan[]>([]);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [inventory, setInventory] = useState<InventoryRow[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [notes, setNotes] = useState('');
  const [draftItems, setDraftItems] = useState<DraftItem[]>(buildEmptyDraft());
  const [activeChallan, setActiveChallan] = useState<ChallanDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const inventoryMap = useMemo(
    () => Object.fromEntries(inventory.map((item) => [String(item.product_id), item.quantity])),
    [inventory]
  );

  const loadChallans = async () => {
    setLoading(true);
    try {
      const data = await authenticatedApi<Challan[]>('/api/challans');
      setChallans(data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load challans');
    } finally {
      setLoading(false);
    }
  };

  const loadCustomers = async () => {
    try {
      const data = await authenticatedApi<CustomerOption[]>('/api/customers');
      setCustomers(data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load customers');
    }
  };

  const loadProducts = async () => {
    try {
      const data = await authenticatedApi<ProductOption[]>('/api/products');
      setProducts(data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load products');
    }
  };

  const loadInventory = async () => {
    try {
      const data = await authenticatedApi<Array<{ product_id: number; quantity: number }>>('/api/inventory');
      setInventory(data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load inventory snapshot');
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true });
      return;
    }

    loadChallans();
    loadCustomers();
    loadProducts();
    loadInventory();
  }, [navigate, user]);

  const handleLogout = () => {
    localStorage.removeItem('opsflow_token');
    localStorage.removeItem('opsflow_user');
    navigate('/login', { replace: true });
  };

  const handleDraftItemChange = (index: number, field: 'product_id' | 'quantity', value: string) => {
    setDraftItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const addDraftItem = () => {
    setDraftItems((prev) => [...prev, { product_id: '', quantity: '1' }]);
  };

  const removeDraftItem = (index: number) => {
    setDraftItems((prev) => {
      if (prev.length === 1) {
        return [{ product_id: '', quantity: '1' }];
      }
      return prev.filter((_, itemIndex) => itemIndex !== index);
    });
  };

  const resetDraft = () => {
    setSelectedCustomerId('');
    setNotes('');
    setDraftItems(buildEmptyDraft());
    setError('');
    setSuccess('');
  };

  const handleCreateChallan = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedCustomerId) {
      setError('Please select a customer.');
      return;
    }

    const items = draftItems
      .map((item) => ({ product_id: Number(item.product_id), quantity: Number(item.quantity) }))
      .filter((item) => item.product_id > 0);

    if (items.length === 0) {
      setError('Add at least one product item.');
      return;
    }

    const invalidItem = items.find((item) => !Number.isFinite(item.quantity) || item.quantity <= 0);
    if (invalidItem) {
      setError('Each product quantity must be greater than zero.');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        customer_id: Number(selectedCustomerId),
        notes: notes.trim() || null,
        products: items,
      };

      await authenticatedApi('/api/challans', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      setSuccess('Challan saved successfully.');
      resetDraft();
      await loadChallans();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to save challan');
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewChallan = async (challanId: number) => {
    try {
      const data = await authenticatedApi<ChallanDetail>(`/api/challans/${challanId}`);
      setActiveChallan(data);
    } catch (viewError) {
      setError(viewError instanceof Error ? viewError.message : 'Unable to open challan details');
    }
  };

  const handleConfirmChallan = async (challanId: number) => {
    try {
      setError('');
      setSuccess('');
      await authenticatedApi(`/api/challans/${challanId}/confirm`, { method: 'POST' });
      setSuccess('Challan confirmed successfully.');
      await loadChallans();
      if (activeChallan?.challan.id === challanId) {
        await handleViewChallan(challanId);
      }
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Unable to confirm challan');
    }
  };

  const handleCancelChallan = async (challanId: number) => {
    try {
      setError('');
      setSuccess('');
      await authenticatedApi(`/api/challans/${challanId}/cancel`, { method: 'POST' });
      setSuccess('Challan cancelled successfully.');
      await loadChallans();
      if (activeChallan?.challan.id === challanId) {
        await handleViewChallan(challanId);
      }
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Unable to cancel challan');
    }
  };

  return (
    <div className="dashboard-shell">
      <aside className="sidebar">
        <div className="brand-mark">O</div>
        <div className="sidebar-title">OpsFlow</div>
        <nav className="sidebar-nav">
          <button className="nav-item" onClick={() => navigate('/dashboard')}>Dashboard</button>
          {(user?.role === 'ADMIN' || user?.role === 'SALES' || user?.role === 'ACCOUNTS') && <button className="nav-item" onClick={() => navigate('/customers')}>Customers</button>}
          <button className="nav-item" onClick={() => navigate('/products')}>Products</button>
          {(user?.role === 'ADMIN' || user?.role === 'SALES' || user?.role === 'WAREHOUSE') && <button className="nav-item" onClick={() => navigate('/inventory')}>Inventory</button>}
          <button className="nav-item active" onClick={() => navigate('/challans')}>Challans</button>
        </nav>
        <button className="logout-button" onClick={handleLogout}>Logout</button>
      </aside>

      <main className="dashboard-main customer-page">
        <header className="topbar customer-topbar">
          <div>
            <p className="eyebrow">Sales</p>
            <h1>Challans</h1>
          </div>
        </header>

        {canCreateChallan && (
          <section className="customer-panel">
            <div className="customer-form-header">
              <h2>Create Challan</h2>
            </div>

            <form className="customer-form" onSubmit={handleCreateChallan}>
              <div className="field-grid">
                <div className="field">
                  <label>Customer</label>
                  <select value={selectedCustomerId} onChange={(event) => setSelectedCustomerId(event.target.value)}>
                    <option value="">Select customer</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name} {customer.business_name ? `(${customer.business_name})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="field full-width">
                  <label>Notes</label>
                  <textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Optional notes for this challan" />
                </div>
              </div>

              <div className="challan-items-block">
                {draftItems.map((item, index) => {
                  const availableQty = inventoryMap[item.product_id] ?? 0;

                  return (
                    <div key={`${index}-${item.product_id}`} className="challan-item-row">
                      <div className="field">
                        <label>Product</label>
                        <select value={item.product_id} onChange={(event) => handleDraftItemChange(index, 'product_id', event.target.value)}>
                          <option value="">Select product</option>
                          {products.map((product) => (
                            <option key={product.id} value={product.id}>{product.product_name} ({product.sku})</option>
                          ))}
                        </select>
                      </div>
                      <div className="field">
                        <label>Quantity</label>
                        <input type="number" min="1" value={item.quantity} onChange={(event) => handleDraftItemChange(index, 'quantity', event.target.value)} />
                      </div>
                      <div className="field">
                        <label>Available</label>
                        <div className="availability-display">{item.product_id ? `${availableQty} units` : '-'}</div>
                      </div>
                      <div className="item-actions">
                        <button type="button" className="secondary-button" onClick={() => addDraftItem()}>Add</button>
                        {draftItems.length > 1 && (
                          <button type="button" className="delete-button table-button" onClick={() => removeDraftItem(index)}>Remove</button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {error && <div className="message error-message">{error}</div>}
              {success && <div className="message success-message">{success}</div>}

              <div className="form-actions">
                <button className="primary-button" type="submit" disabled={submitting}>{submitting ? 'Saving...' : 'Save Draft Challan'}</button>
                <button className="secondary-button" type="button" onClick={resetDraft}>Reset</button>
              </div>
            </form>
          </section>
        )}

        <section className="customer-list-panel">
          <div className="list-header">
            <h2>Challan List</h2>
          </div>

          {loading ? <div className="loading-box">Loading challans...</div> : challans.length === 0 ? <div className="empty-box">No challans found.</div> : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr><th>Challan</th><th>Customer</th><th>Status</th><th>Created By</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {challans.map((challan) => (
                    <tr key={challan.id}>
                      <td>{challan.challan_number}</td>
                      <td>{challan.customer_name || challan.customer_id}</td>
                      <td><span className={`status-pill ${challan.status === 'CONFIRMED' ? 'status-in' : challan.status === 'CANCELLED' ? 'status-out' : 'status-low'}`}>{challan.status}</span></td>
                      <td>{challan.created_by || '-'}</td>
                      <td className="action-buttons">
                        <button className="table-button edit-button" onClick={() => handleViewChallan(challan.id)}>View</button>
                        {canCreateChallan && challan.status === 'DRAFT' && (
                          <>
                            <button className="table-button edit-button" onClick={() => handleConfirmChallan(challan.id)}>Confirm</button>
                            <button className="table-button delete-button" onClick={() => handleCancelChallan(challan.id)}>Cancel</button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {activeChallan && (
          <section className="customer-panel">
            <div className="customer-form-header">
              <h2>{activeChallan.challan.challan_number}</h2>
              <span className={`status-pill ${activeChallan.challan.status === 'CONFIRMED' ? 'status-in' : activeChallan.challan.status === 'CANCELLED' ? 'status-out' : 'status-low'}`}>{activeChallan.challan.status}</span>
            </div>

            <div className="detail-grid">
              <div className="detail-card">
                <p><strong>Customer:</strong> {activeChallan.challan.customer_name || activeChallan.challan.customer_id}</p>
                <p><strong>Created by:</strong> {activeChallan.challan.created_by || '-'}</p>
                <p><strong>Notes:</strong> {activeChallan.challan.notes || '-'}</p>
              </div>

              <div className="detail-card">
                <p><strong>Line items:</strong> {activeChallan.items.length}</p>
                <p><strong>Total quantity:</strong> {activeChallan.items.reduce((sum, item) => sum + item.quantity, 0)}</p>
                <p><strong>Value:</strong> ₹{activeChallan.items.reduce((sum, item) => sum + (item.unit_price_snapshot * item.quantity), 0).toFixed(2)}</p>
              </div>
            </div>

            <div className="table-wrapper">
              <table>
                <thead>
                  <tr><th>Product</th><th>SKU</th><th>Qty</th><th>Unit Price</th><th>Amount</th></tr>
                </thead>
                <tbody>
                  {activeChallan.items.map((item) => (
                    <tr key={item.id}>
                      <td>{item.product_name_snapshot}</td>
                      <td>{item.sku_snapshot}</td>
                      <td>{item.quantity}</td>
                      <td>₹{Number(item.unit_price_snapshot).toFixed(2)}</td>
                      <td>₹{(Number(item.unit_price_snapshot) * item.quantity).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default Challans;
