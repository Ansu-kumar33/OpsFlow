"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCustomer = exports.updateCustomer = exports.createCustomer = exports.getCustomerById = exports.listCustomers = void 0;
const database_1 = require("../config/database");
const CUSTOMER_STATUS_VALUES = ['LEAD', 'ACTIVE', 'INACTIVE'];
const CUSTOMER_TYPE_VALUES = ['RETAIL', 'WHOLESALE', 'DISTRIBUTOR'];
const ensureCustomerTable = async () => {
    await database_1.pool.query(`
    CREATE TABLE IF NOT EXISTS customers (
      id SERIAL PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      mobile VARCHAR(20) NOT NULL,
      email VARCHAR(150),
      business_name VARCHAR(150),
      gst_number VARCHAR(30),
      customer_type VARCHAR(20) NOT NULL CHECK (customer_type IN ('RETAIL', 'WHOLESALE', 'DISTRIBUTOR')),
      address TEXT,
      status VARCHAR(20) NOT NULL DEFAULT 'LEAD' CHECK (status IN ('LEAD', 'ACTIVE', 'INACTIVE')),
      follow_up_date DATE,
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
};
const sanitizeCustomerPayload = (body) => {
    const name = String(body.name || '').trim();
    const mobile = String(body.mobile || '').trim();
    const email = body.email ? String(body.email).trim() : null;
    const business_name = body.business_name ? String(body.business_name).trim() : null;
    const gst_number = body.gst_number ? String(body.gst_number).trim() : null;
    const customer_type = String(body.customer_type || '').trim().toUpperCase();
    const address = body.address ? String(body.address).trim() : null;
    const status = String(body.status || 'LEAD').trim().toUpperCase();
    const follow_up_date = body.follow_up_date ? String(body.follow_up_date).trim() : null;
    const notes = body.notes ? String(body.notes).trim() : null;
    if (!name || !mobile || !customer_type) {
        throw new Error('Name, mobile, and customer type are required');
    }
    if (!CUSTOMER_TYPE_VALUES.includes(customer_type)) {
        throw new Error('Customer type must be RETAIL, WHOLESALE, or DISTRIBUTOR');
    }
    if (status && !CUSTOMER_STATUS_VALUES.includes(status)) {
        throw new Error('Status must be LEAD, ACTIVE, or INACTIVE');
    }
    return {
        name,
        mobile,
        email: email || null,
        business_name: business_name || null,
        gst_number: gst_number || null,
        customer_type: customer_type,
        address: address || null,
        status: (status || 'LEAD'),
        follow_up_date: follow_up_date || null,
        notes: notes || null,
    };
};
const listCustomers = async (req, res) => {
    try {
        await ensureCustomerTable();
        const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
        let query = 'SELECT * FROM customers';
        const params = [];
        if (search) {
            query += ` WHERE LOWER(name) LIKE $1 OR LOWER(mobile) LIKE $1 OR LOWER(COALESCE(email, '')) LIKE $1 OR LOWER(COALESCE(business_name, '')) LIKE $1`;
            params.push(`%${search.toLowerCase()}%`);
        }
        query += ' ORDER BY created_at DESC';
        const result = await database_1.pool.query(query, params);
        return res.status(200).json(result.rows);
    }
    catch (error) {
        console.error('List customers error:', error);
        return res.status(500).json({
            message: 'Failed to fetch customers',
            status: 'error',
        });
    }
};
exports.listCustomers = listCustomers;
const getCustomerById = async (req, res) => {
    try {
        await ensureCustomerTable();
        const { id } = req.params;
        const result = await database_1.pool.query('SELECT * FROM customers WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({
                message: 'Customer not found',
                status: 'error',
            });
        }
        return res.status(200).json(result.rows[0]);
    }
    catch (error) {
        console.error('Get customer error:', error);
        return res.status(500).json({
            message: 'Failed to fetch customer',
            status: 'error',
        });
    }
};
exports.getCustomerById = getCustomerById;
const createCustomer = async (req, res) => {
    try {
        await ensureCustomerTable();
        const payload = sanitizeCustomerPayload(req.body || {});
        const result = await database_1.pool.query(`INSERT INTO customers (
        name,
        mobile,
        email,
        business_name,
        gst_number,
        customer_type,
        address,
        status,
        follow_up_date,
        notes,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW()) RETURNING *`, [
            payload.name,
            payload.mobile,
            payload.email,
            payload.business_name,
            payload.gst_number,
            payload.customer_type,
            payload.address,
            payload.status,
            payload.follow_up_date,
            payload.notes,
        ]);
        return res.status(201).json({
            message: 'Customer created successfully',
            customer: result.rows[0],
        });
    }
    catch (error) {
        console.error('Create customer error:', error);
        const message = error instanceof Error ? error.message : 'Failed to create customer';
        return res.status(400).json({
            message,
            status: 'error',
        });
    }
};
exports.createCustomer = createCustomer;
const updateCustomer = async (req, res) => {
    try {
        await ensureCustomerTable();
        const { id } = req.params;
        const payload = sanitizeCustomerPayload(req.body || {});
        const result = await database_1.pool.query(`UPDATE customers
       SET name = $1,
           mobile = $2,
           email = $3,
           business_name = $4,
           gst_number = $5,
           customer_type = $6,
           address = $7,
           status = $8,
           follow_up_date = $9,
           notes = $10,
           updated_at = NOW()
       WHERE id = $11
       RETURNING *`, [
            payload.name,
            payload.mobile,
            payload.email,
            payload.business_name,
            payload.gst_number,
            payload.customer_type,
            payload.address,
            payload.status,
            payload.follow_up_date,
            payload.notes,
            id,
        ]);
        if (result.rows.length === 0) {
            return res.status(404).json({
                message: 'Customer not found',
                status: 'error',
            });
        }
        return res.status(200).json({
            message: 'Customer updated successfully',
            customer: result.rows[0],
        });
    }
    catch (error) {
        console.error('Update customer error:', error);
        const message = error instanceof Error ? error.message : 'Failed to update customer';
        return res.status(400).json({
            message,
            status: 'error',
        });
    }
};
exports.updateCustomer = updateCustomer;
const deleteCustomer = async (req, res) => {
    try {
        await ensureCustomerTable();
        const { id } = req.params;
        const result = await database_1.pool.query('DELETE FROM customers WHERE id = $1 RETURNING id', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({
                message: 'Customer not found',
                status: 'error',
            });
        }
        return res.status(200).json({
            message: 'Customer deleted successfully',
            status: 'success',
        });
    }
    catch (error) {
        console.error('Delete customer error:', error);
        return res.status(500).json({
            message: 'Failed to delete customer',
            status: 'error',
        });
    }
};
exports.deleteCustomer = deleteCustomer;
