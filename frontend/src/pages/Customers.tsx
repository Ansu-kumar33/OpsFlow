import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authenticatedApi, getStoredUser } from '../services/api';

type CustomerStatus = 'LEAD' | 'ACTIVE' | 'INACTIVE';
type CustomerType = 'RETAIL' | 'WHOLESALE' | 'DISTRIBUTOR';

type Customer = {
  id: number;
  name: string;
  mobile: string;
  email: string | null;
  business_name: string | null;
  gst_number: string | null;
  customer_type: CustomerType;
  address: string | null;
  status: CustomerStatus;
  follow_up_date: string | null;
  notes: string | null;
  created_at?: string;
  updated_at?: string | null;
};

type CustomerFormState = {
  name: string;
  mobile: string;
  email: string;
  business_name: string;
  gst_number: string;
  customer_type: CustomerType;
  address: string;
  status: CustomerStatus;
  follow_up_date: string;
  notes: string;
};

const emptyForm: CustomerFormState = {
  name: '',
  mobile: '',
  email: '',
  business_name: '',
  gst_number: '',
  customer_type: 'RETAIL',
  address: '',
  status: 'LEAD',
  follow_up_date: '',
  notes: '',
};

const Customers = () => {
  const navigate = useNavigate();
  const user = getStoredUser();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState<CustomerFormState>(emptyForm);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadCustomers = async (query = '') => {
    setIsLoading(true);
    setError('');

    try {
      const url = query ? `/api/customers?search=${encodeURIComponent(query)}` : '/api/customers';
      const data = await authenticatedApi<Customer[]>(url);
      setCustomers(data);
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : 'Unable to load customers';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true });
      return;
    }

    loadCustomers();
  }, [navigate, user]);

  const filteredCustomers = useMemo(() => {
    if (!search.trim()) return customers;
    const value = search.toLowerCase();
    return customers.filter((customer) =>
      [customer.name, customer.mobile, customer.email || '', customer.business_name || '']
        .join(' ')
        .toLowerCase()
        .includes(value)
    );
  }, [customers, search]);

  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.name.trim() || !form.mobile.trim() || !form.customer_type.trim()) {
      setError('Name, mobile, and customer type are required.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        ...form,
        email: form.email.trim() || null,
        business_name: form.business_name.trim() || null,
        gst_number: form.gst_number.trim() || null,
        address: form.address.trim() || null,
        notes: form.notes.trim() || null,
        follow_up_date: form.follow_up_date || null,
      };

      if (editingId) {
        const response = await authenticatedApi<{ message: string; customer: Customer }>(`/api/customers/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        setSuccess(response.message || 'Customer updated successfully');
      } else {
        const response = await authenticatedApi<{ message: string; customer: Customer }>('/api/customers', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        setSuccess(response.message || 'Customer created successfully');
      }

      resetForm();
      await loadCustomers(search);
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : 'Unable to save customer';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (customer: Customer) => {
    setEditingId(customer.id);
    setForm({
      name: customer.name,
      mobile: customer.mobile,
      email: customer.email || '',
      business_name: customer.business_name || '',
      gst_number: customer.gst_number || '',
      customer_type: customer.customer_type,
      address: customer.address || '',
      status: customer.status,
      follow_up_date: customer.follow_up_date || '',
      notes: customer.notes || '',
    });
    setSuccess('');
    setError('');
  };

  const handleDelete = async (customerId: number) => {
    const confirmed = window.confirm('Delete this customer?');
    if (!confirmed) return;

    setError('');
    setSuccess('');

    try {
      await authenticatedApi(`/api/customers/${customerId}`, {
        method: 'DELETE',
      });
      setSuccess('Customer deleted successfully');
      await loadCustomers(search);
      if (editingId === customerId) {
        resetForm();
      }
    } catch (deleteError) {
      const message = deleteError instanceof Error ? deleteError.message : 'Unable to delete customer';
      setError(message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('opsflow_token');
    localStorage.removeItem('opsflow_user');
    navigate('/login', { replace: true });
  };

  if (!user) {
    return null;
  }

  return (
    <div className="dashboard-shell">
      <aside className="sidebar">
        <div className="brand-mark">O</div>
        <div className="sidebar-title">OpsFlow</div>

        <nav className="sidebar-nav">
          <button className="nav-item" onClick={() => navigate('/dashboard')}>Dashboard</button>
          <button className="nav-item active" onClick={() => navigate('/customers')}>Customers</button>
          <button className="nav-item">Products</button>
          <button className="nav-item">Inventory</button>
          <button className="nav-item">Challans</button>
        </nav>

        <button className="logout-button" onClick={handleLogout}>Logout</button>
      </aside>

      <main className="dashboard-main customer-page">
        <header className="topbar customer-topbar">
          <div>
            <p className="eyebrow">CRM module</p>
            <h1>Customers</h1>
          </div>
          <button className="primary-button compact-button" onClick={() => resetForm()}>
            New Customer
          </button>
        </header>

        <section className="customer-panel">
          <div className="customer-form-header">
            <h2>{editingId ? 'Edit Customer' : 'Add Customer'}</h2>
          </div>

          <form className="customer-form" onSubmit={handleSubmit}>
            <div className="field-grid">
              <div className="field">
                <label>Name</label>
                <input name="name" value={form.name} onChange={handleInputChange} required />
              </div>

              <div className="field">
                <label>Mobile</label>
                <input name="mobile" value={form.mobile} onChange={handleInputChange} required />
              </div>

              <div className="field">
                <label>Email</label>
                <input name="email" type="email" value={form.email} onChange={handleInputChange} />
              </div>

              <div className="field">
                <label>Business Name</label>
                <input name="business_name" value={form.business_name} onChange={handleInputChange} />
              </div>

              <div className="field">
                <label>GST Number</label>
                <input name="gst_number" value={form.gst_number} onChange={handleInputChange} />
              </div>

              <div className="field">
                <label>Customer Type</label>
                <select name="customer_type" value={form.customer_type} onChange={handleInputChange}>
                  <option value="RETAIL">RETAIL</option>
                  <option value="WHOLESALE">WHOLESALE</option>
                  <option value="DISTRIBUTOR">DISTRIBUTOR</option>
                </select>
              </div>

              <div className="field full-width">
                <label>Address</label>
                <input name="address" value={form.address} onChange={handleInputChange} />
              </div>

              <div className="field">
                <label>Status</label>
                <select name="status" value={form.status} onChange={handleInputChange}>
                  <option value="LEAD">LEAD</option>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </div>

              <div className="field">
                <label>Follow-up Date</label>
                <input name="follow_up_date" type="date" value={form.follow_up_date} onChange={handleInputChange} />
              </div>

              <div className="field full-width">
                <label>Notes</label>
                <textarea name="notes" value={form.notes} onChange={handleInputChange} rows={3} />
              </div>
            </div>

            {error && <div className="message error-message">{error}</div>}
            {success && <div className="message success-message">{success}</div>}

            <div className="form-actions">
              <button type="submit" className="primary-button" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : editingId ? 'Update Customer' : 'Add Customer'}
              </button>
              {editingId && (
                <button type="button" className="secondary-button" onClick={resetForm}>
                  Cancel
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="customer-list-panel">
          <div className="list-header">
            <h2>Customer List</h2>
            <div className="search-box">
              <input
                type="text"
                value={search}
                onChange={(event) => {
                  const nextSearch = event.target.value;
                  setSearch(nextSearch);
                  loadCustomers(nextSearch);
                }}
                placeholder="Search by name, mobile, email, business name"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="loading-box">Loading customers...</div>
          ) : filteredCustomers.length === 0 ? (
            <div className="empty-box">No customers found.</div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Mobile</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Follow-up</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map((customer) => (
                    <tr key={customer.id}>
                      <td>
                        <div className="customer-name">{customer.name}</div>
                        <small>{customer.business_name || 'No business name'}</small>
                      </td>
                      <td>{customer.mobile}</td>
                      <td>{customer.customer_type}</td>
                      <td>
                        <span className={`status-pill status-${customer.status.toLowerCase()}`}>
                          {customer.status}
                        </span>
                      </td>
                      <td>{customer.follow_up_date || '-'}</td>
                      <td>
                        <div className="action-buttons">
                          <button type="button" className="table-button edit-button" onClick={() => handleEdit(customer)}>
                            Edit
                          </button>
                          <button type="button" className="table-button delete-button" onClick={() => handleDelete(customer.id)}>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default Customers;
