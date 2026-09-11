import type { Request, Response } from 'express';
import { pool } from '../config/database';

export type InventoryRecord = {
  id: number;
  product_id: number;
  quantity: number;
  reorder_level: number;
  location: string | null;
  updated_at: string | null;
  product_name?: string;
  sku?: string;
};

const ensureInventoryTable = async (): Promise<void> => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS inventory (
      id SERIAL PRIMARY KEY,
      product_id INT UNIQUE NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      quantity INT NOT NULL DEFAULT 0 CHECK (quantity >= 0),
      reorder_level INT NOT NULL DEFAULT 0 CHECK (reorder_level >= 0),
      location VARCHAR(150),
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
};

const getStockStatus = (quantity: number, reorderLevel: number): string => {
  if (quantity <= 0) return 'Out of Stock';
  if (quantity <= reorderLevel) return 'Low Stock';
  return 'In Stock';
};

export const listInventory = async (req: Request, res: Response): Promise<Response> => {
  try {
    await ensureInventoryTable();
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';

    let query = `
      SELECT i.*, p.product_name, p.sku
      FROM inventory i
      LEFT JOIN products p ON p.id = i.product_id
    `;
    const params: string[] = [];

    if (search) {
      query += ' WHERE LOWER(p.product_name) LIKE $1 OR LOWER(p.sku) LIKE $1 OR LOWER(COALESCE(i.location, \'\')) LIKE $1';
      params.push(`%${search.toLowerCase()}%`);
    }

    query += ' ORDER BY p.product_name ASC';

    const result = await pool.query<InventoryRecord>(query, params);
    const rows = result.rows.map((item) => ({
      ...item,
      stock_status: getStockStatus(Number(item.quantity), Number(item.reorder_level)),
    }));

    return res.status(200).json(rows);
  } catch (error) {
    console.error('List inventory error:', error);
    return res.status(500).json({ message: 'Failed to fetch inventory', status: 'error' });
  }
};

export const upsertInventory = async (req: Request, res: Response): Promise<Response> => {
  try {
    await ensureInventoryTable();
    const { product_id, quantity, reorder_level, location } = req.body || {};

    if (!product_id || !Number.isFinite(Number(quantity)) || !Number.isFinite(Number(reorder_level))) {
      return res.status(400).json({ message: 'Product ID, quantity, and reorder level are required', status: 'error' });
    }

    const productId = Number(product_id);
    const qty = Number(quantity);
    const reorderLevel = Number(reorder_level);

    if (qty < 0 || reorderLevel < 0) {
      return res.status(400).json({ message: 'Quantity and reorder level cannot be negative', status: 'error' });
    }

    const existing = await pool.query('SELECT id FROM inventory WHERE product_id = $1', [productId]);

    if (existing.rows.length > 0) {
      const result = await pool.query<InventoryRecord>(
        `UPDATE inventory
         SET quantity = $1,
             reorder_level = $2,
             location = $3,
             updated_at = NOW()
         WHERE product_id = $4
         RETURNING *`,
        [qty, reorderLevel, location || null, productId]
      );

      return res.status(200).json({
        message: 'Inventory updated successfully',
        inventory: { ...result.rows[0], stock_status: getStockStatus(qty, reorderLevel) },
      });
    }

    const result = await pool.query<InventoryRecord>(
      `INSERT INTO inventory (product_id, quantity, reorder_level, location)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [productId, qty, reorderLevel, location || null]
    );

    return res.status(201).json({
      message: 'Inventory created successfully',
      inventory: { ...result.rows[0], stock_status: getStockStatus(qty, reorderLevel) },
    });
  } catch (error) {
    console.error('Inventory upsert error:', error);
    return res.status(500).json({ message: 'Failed to save inventory', status: 'error' });
  }
};
