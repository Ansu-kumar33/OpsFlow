"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteProduct = exports.updateProduct = exports.createProduct = exports.getProductById = exports.listProducts = void 0;
const database_1 = require("../config/database");
const ensureProductTable = async () => {
    await database_1.pool.query(`
    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      product_name VARCHAR(150) NOT NULL,
      sku VARCHAR(100) UNIQUE NOT NULL,
      category VARCHAR(100),
      unit VARCHAR(50),
      price NUMERIC(12,2) NOT NULL CHECK (price >= 0),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
};
const sanitizeProductPayload = (body) => {
    const product_name = String(body.product_name || '').trim();
    const sku = String(body.sku || '').trim();
    const category = body.category ? String(body.category).trim() : null;
    const unit = body.unit ? String(body.unit).trim() : null;
    const price = Number(body.price);
    if (!product_name || !sku) {
        throw new Error('Product name and SKU are required');
    }
    if (!Number.isFinite(price) || price < 0) {
        throw new Error('Price must be a valid non-negative number');
    }
    return {
        product_name,
        sku: sku.toUpperCase(),
        category: category || null,
        unit: unit || null,
        price,
    };
};
const listProducts = async (req, res) => {
    try {
        await ensureProductTable();
        const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
        let query = 'SELECT * FROM products';
        const params = [];
        if (search) {
            query += ' WHERE LOWER(product_name) LIKE $1 OR LOWER(sku) LIKE $1 OR LOWER(COALESCE(category, \'\')) LIKE $1';
            params.push(`%${search.toLowerCase()}%`);
        }
        query += ' ORDER BY created_at DESC';
        const result = await database_1.pool.query(query, params);
        return res.status(200).json(result.rows);
    }
    catch (error) {
        console.error('List products error:', error);
        return res.status(500).json({ message: 'Failed to fetch products', status: 'error' });
    }
};
exports.listProducts = listProducts;
const getProductById = async (req, res) => {
    try {
        await ensureProductTable();
        const result = await database_1.pool.query('SELECT * FROM products WHERE id = $1', [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Product not found', status: 'error' });
        }
        return res.status(200).json(result.rows[0]);
    }
    catch (error) {
        console.error('Get product error:', error);
        return res.status(500).json({ message: 'Failed to fetch product', status: 'error' });
    }
};
exports.getProductById = getProductById;
const createProduct = async (req, res) => {
    try {
        await ensureProductTable();
        const payload = sanitizeProductPayload(req.body || {});
        const existing = await database_1.pool.query('SELECT id FROM products WHERE LOWER(sku) = LOWER($1)', [payload.sku]);
        if (existing.rows.length > 0) {
            return res.status(400).json({ message: 'SKU already exists', status: 'error' });
        }
        const result = await database_1.pool.query('INSERT INTO products (product_name, sku, category, unit, price) VALUES ($1, $2, $3, $4, $5) RETURNING *', [payload.product_name, payload.sku, payload.category, payload.unit, payload.price]);
        return res.status(201).json({ message: 'Product created successfully', product: result.rows[0] });
    }
    catch (error) {
        console.error('Create product error:', error);
        const message = error instanceof Error ? error.message : 'Failed to create product';
        return res.status(400).json({ message, status: 'error' });
    }
};
exports.createProduct = createProduct;
const updateProduct = async (req, res) => {
    try {
        await ensureProductTable();
        const payload = sanitizeProductPayload(req.body || {});
        const existing = await database_1.pool.query('SELECT id FROM products WHERE LOWER(sku) = LOWER($1) AND id != $2', [payload.sku, req.params.id]);
        if (existing.rows.length > 0) {
            return res.status(400).json({ message: 'SKU already exists', status: 'error' });
        }
        const result = await database_1.pool.query('UPDATE products SET product_name = $1, sku = $2, category = $3, unit = $4, price = $5 WHERE id = $6 RETURNING *', [payload.product_name, payload.sku, payload.category, payload.unit, payload.price, req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Product not found', status: 'error' });
        }
        return res.status(200).json({ message: 'Product updated successfully', product: result.rows[0] });
    }
    catch (error) {
        console.error('Update product error:', error);
        const message = error instanceof Error ? error.message : 'Failed to update product';
        return res.status(400).json({ message, status: 'error' });
    }
};
exports.updateProduct = updateProduct;
const deleteProduct = async (req, res) => {
    try {
        await ensureProductTable();
        const result = await database_1.pool.query('DELETE FROM products WHERE id = $1 RETURNING id', [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Product not found', status: 'error' });
        }
        return res.status(200).json({ message: 'Product deleted successfully', status: 'success' });
    }
    catch (error) {
        console.error('Delete product error:', error);
        return res.status(500).json({ message: 'Failed to delete product', status: 'error' });
    }
};
exports.deleteProduct = deleteProduct;
