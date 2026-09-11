import type { Request, Response } from 'express';
import { pool } from '../config/database';

export type StockMovementRecord = {
  id: number;
  product_id: number;
  movement_type: 'IN' | 'OUT';
  quantity: number;
  reason: string | null;
  created_by: string | null;
  created_at: string;
};

const ensureStockMovementTable = async (): Promise<void> => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS stock_movements (
      id SERIAL PRIMARY KEY,
      product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      movement_type VARCHAR(10) NOT NULL CHECK (movement_type IN ('IN', 'OUT')),
      quantity INT NOT NULL CHECK (quantity > 0),
      reason VARCHAR(255),
      created_by INT REFERENCES users(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
};

export const listStockMovements = async (_req: Request, res: Response): Promise<Response> => {
  try {
    await ensureStockMovementTable();
    const result = await pool.query(`
      SELECT sm.*, p.product_name, p.sku
      FROM stock_movements sm
      LEFT JOIN products p ON p.id = sm.product_id
      ORDER BY sm.created_at DESC
    `);

    return res.status(200).json(result.rows);
  } catch (error) {
    console.error('List stock movements error:', error);
    return res.status(500).json({ message: 'Failed to fetch stock movements', status: 'error' });
  }
};

export const createStockMovement = async (req: Request, res: Response): Promise<Response> => {
  try {
    await ensureStockMovementTable();
    const { product_id, movement_type, quantity, reason } = req.body || {};

    if (!product_id || !movement_type || !quantity) {
      return res.status(400).json({ message: 'Product, movement type, and quantity are required', status: 'error' });
    }

    const productId = Number(product_id);
    const qty = Number(quantity);
    const type = String(movement_type).toUpperCase();

    if (!['IN', 'OUT'].includes(type)) {
      return res.status(400).json({ message: 'Movement type must be IN or OUT', status: 'error' });
    }

    if (!Number.isFinite(qty) || qty <= 0) {
      return res.status(400).json({ message: 'Quantity must be a positive number', status: 'error' });
    }

    const productResult = await pool.query('SELECT id, product_name FROM products WHERE id = $1', [productId]);
    if (productResult.rows.length === 0) {
      return res.status(404).json({ message: 'Product not found', status: 'error' });
    }

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const stockResult = await client.query(
        'SELECT quantity FROM inventory WHERE product_id = $1 FOR UPDATE',
        [productId]
      );

      if (stockResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ message: 'Inventory record not found for this product', status: 'error' });
      }

      const currentStock = Number(stockResult.rows[0].quantity);

      if (type === 'OUT' && currentStock < qty) {
        await client.query('ROLLBACK');
        return res.status(400).json({ message: `Insufficient stock. Available quantity: ${currentStock}` });
      }

      const updatedStock = type === 'IN' ? currentStock + qty : currentStock - qty;

      await client.query(
        'UPDATE inventory SET quantity = $1, updated_at = NOW() WHERE product_id = $2',
        [updatedStock, productId]
      );

      const movement = await client.query(
        `INSERT INTO stock_movements (product_id, movement_type, quantity, reason, created_by)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [productId, type, qty, reason || null, req.user?.id ?? null]
      );

      await client.query('COMMIT');
      return res.status(201).json({ message: 'Stock movement created successfully', movement: movement.rows[0] });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Create stock movement error:', error);
    return res.status(500).json({ message: 'Failed to create stock movement', status: 'error' });
  }
};
