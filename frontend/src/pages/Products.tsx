import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authenticatedApi, getStoredUser } from '../services/api';

type Product = {
  id: number;
  product_name: string;
  sku: string;
  category: string | null;
  unit: string | null;
  price: number;
  created_at?: string;
};

type ProductForm = {
  product_name: string;
  sku: string;
  category: string;
  unit: string;
  price: string;
};

const emptyForm: ProductForm = {
  product_name: '',
  sku: '',
  category: '',
  unit: '',
  price: '',
};

const Products = () => {
  const navigate = useNavigate();
  const user = getStoredUser();
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadProducts = async (query = '') => {
    setLoading(true);
    try {
      const data = await authenticatedApi<Product[]>(query ? `/api/products?search=${encodeURIComponent(query)}` : '/api/products');
      setProducts(data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true });
      return;
    }
    loadProducts();
  }, [navigate, user]);

  const filteredProducts = useMemo(() => {
    if (!search.trim()) return products;
    const value = search.toLowerCase();
    return products.filter((product) => `${product.product_name} ${product.sku} ${product.category || ''}`.toLowerCase().includes(value));
  }, [products, search]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.product_name.trim() || !form.sku.trim()) {
      setError('Product name and SKU are required.');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        product_name: form.product_name.trim(),
        sku: form.sku.trim(),
        category: form.category.trim() || null,
        unit: form.unit.trim() || null,
        price: Number(form.price || 0),
      };

      if (editingId) {
        const response = await authenticatedApi<{ message: string; product: Product }>(`/api/products/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        setSuccess(response.message || 'Product updated');
      } else {
        const response = await authenticatedApi<{ message: string; product: Product }>('/api/products', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        setSuccess(response.message || 'Product created');
      }

      resetForm();
      await loadProducts(search);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to save product');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingId(product.id);
    setForm({
      product_name: product.product_name,
      sku: product.sku,
      category: product.category || '',
      unit: product.unit || '',
      price: String(product.price),
    });
    setError('');
    setSuccess('');
  };

  const handleDelete = async (id: number) => {
    const confirmDelete = window.confirm('Delete this product?');
    if (!confirmDelete) return;

    try {
      await authenticatedApi(`/api/products/${id}`, { method: 'DELETE' });
      setSuccess('Product deleted successfully');
      await loadProducts(search);
      if (editingId === id) resetForm();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Unable to delete product');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('opsflow_token');
    localStorage.removeItem('opsflow_user');
    navigate('/login', { replace: true });
  };

  return (
    <div className="dashboard-shell">
      <aside className="sidebar">
        <div className="brand-mark">O</div>
        <div className="sidebar-title">OpsFlow</div>
        <nav className="sidebar-nav">
          <button className="nav-item" onClick={() => navigate('/dashboard')}>Dashboard</button>
          {(user?.role === 'ADMIN' || user?.role === 'SALES' || user?.role === 'ACCOUNTS') && <button className="nav-item" onClick={() => navigate('/customers')}>Customers</button>}
          <button className="nav-item active" onClick={() => navigate('/products')}>Products</button>
          {(user?.role === 'ADMIN' || user?.role === 'SALES' || user?.role === 'WAREHOUSE') && <button className="nav-item" onClick={() => navigate('/inventory')}>Inventory</button>}
          {(user?.role === 'ADMIN' || user?.role === 'SALES' || user?.role === 'WAREHOUSE' || user?.role === 'ACCOUNTS') && <button className="nav-item" onClick={() => navigate('/challans')}>Challans</button>}
        </nav>
        <button className="logout-button" onClick={handleLogout}>Logout</button>
      </aside>

      <main className="dashboard-main customer-page">
        <header className="topbar customer-topbar">
          <div>
            <p className="eyebrow">Catalog</p>
            <h1>Products</h1>
          </div>
          <button className="primary-button compact-button" onClick={resetForm}>New Product</button>
        </header>

        <section className="customer-panel">
          <div className="customer-form-header"><h2>{editingId ? 'Edit Product' : 'Add Product'}</h2></div>
          <form className="customer-form" onSubmit={handleSubmit}>
            <div className="field-grid">
              <div className="field"><label>Product Name</label><input name="product_name" value={form.product_name} onChange={handleInputChange} required /></div>
              <div className="field"><label>SKU</label><input name="sku" value={form.sku} onChange={handleInputChange} required /></div>
              <div className="field"><label>Category</label><input name="category" value={form.category} onChange={handleInputChange} /></div>
              <div className="field"><label>Unit</label><input name="unit" value={form.unit} onChange={handleInputChange} /></div>
              <div className="field"><label>Price</label><input type="number" min="0" step="0.01" name="price" value={form.price} onChange={handleInputChange} required /></div>
            </div>

            {error && <div className="message error-message">{error}</div>}
            {success && <div className="message success-message">{success}</div>}

            <div className="form-actions">
              <button className="primary-button" type="submit" disabled={saving}>{saving ? 'Saving...' : editingId ? 'Update Product' : 'Add Product'}</button>
              {editingId && <button className="secondary-button" type="button" onClick={resetForm}>Cancel</button>}
            </div>
          </form>
        </section>

        <section className="customer-list-panel">
          <div className="list-header">
            <h2>Product List</h2>
            <div className="search-box"><input value={search} onChange={(event) => { const nextValue = event.target.value; setSearch(nextValue); loadProducts(nextValue); }} placeholder="Search products" /></div>
          </div>

          {loading ? <div className="loading-box">Loading products...</div> : filteredProducts.length === 0 ? <div className="empty-box">No products found.</div> : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr><th>Name</th><th>SKU</th><th>Category</th><th>Unit</th><th>Price</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => (
                    <tr key={product.id}>
                      <td>{product.product_name}</td>
                      <td>{product.sku}</td>
                      <td>{product.category || '-'}</td>
                      <td>{product.unit || '-'}</td>
                      <td>₹{Number(product.price).toFixed(2)}</td>
                      <td>
                        <div className="action-buttons">
                          <button className="table-button edit-button" type="button" onClick={() => handleEdit(product)}>Edit</button>
                          <button className="table-button delete-button" type="button" onClick={() => handleDelete(product.id)}>Delete</button>
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

export default Products;
