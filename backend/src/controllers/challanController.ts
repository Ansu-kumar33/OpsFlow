import type { Request, Response } from 'express';
import { pool } from '../config/database';

export type ChallanStatus = 'DRAFT' | 'CONFIRMED' | 'CANCELLED';

export type ChallanItem = {
  id?: number;
  challan_id?: number;
  product_id: number;
  product_name_snapshot: string;
  sku_snapshot: string;
  quantity: number;
  unit_price_snapshot: number;
};

const ensureChallanTables = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS sales_challans (
      id SERIAL PRIMARY KEY,
      challan_number VARCHAR(50) UNIQUE NOT NULL,
      customer_id INT NOT NULL REFERENCES customers(id),
      challan_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      status VARCHAR(20) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'CONFIRMED', 'CANCELLED')),
      created_by VARCHAR(150),
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS challan_items (
      id SERIAL PRIMARY KEY,
      challan_id INT NOT NULL REFERENCES sales_challans(id) ON DELETE CASCADE,
      product_id INT NOT NULL REFERENCES products(id),
      product_name_snapshot VARCHAR(150) NOT NULL,
      sku_snapshot VARCHAR(100) NOT NULL,
      quantity INT NOT NULL CHECK (quantity > 0),
      unit_price_snapshot NUMERIC(12,2) NOT NULL
    )
  `);
};

const buildChallanNumber = (): string => {
  const date = new Date();
  const stamp = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
  const random = Math.floor(Math.random() * 9000 + 1000);
  return `CH-${stamp}-${random}`;
};

const getStatusFromChallan = (status: string): ChallanStatus => {
  const value = String(status || 'DRAFT').toUpperCase();
  if (value === 'CONFIRMED' || value === 'CANCELLED') return value as ChallanStatus;
  return 'DRAFT';
};

export const listChallans = async (_req: Request, res: Response): Promise<Response> => {
  try {
    await ensureChallanTables();
    const result = await pool.query(`
      SELECT c.*, cu.name as customer_name
      FROM sales_challans c
      LEFT JOIN customers cu ON cu.id = c.customer_id
      ORDER BY c.created_at DESC
    `);
    return res.status(200).json(result.rows);
  } catch (error) {
    console.error('List challans error:', error);
    return res.status(500).json({ message: 'Failed to fetch challans', status: 'error' });
  }
};

export const getChallanById = async (req: Request, res: Response): Promise<Response> => {
  try {
    await ensureChallanTables();
    const challanResult = await pool.query('SELECT * FROM sales_challans WHERE id = $1', [req.params.id]);
    if (challanResult.rows.length === 0) {
      return res.status(404).json({ message: 'Challan not found', status: 'error' });
    }

    const itemsResult = await pool.query('SELECT * FROM challan_items WHERE challan_id = $1 ORDER BY id ASC', [req.params.id]);
    return res.status(200).json({ challan: challanResult.rows[0], items: itemsResult.rows });
  } catch (error) {
    console.error('Get challan error:', error);
    return res.status(500).json({ message: 'Failed to fetch challan', status: 'error' });
  }
};

export const createChallan = async (req: Request, res: Response): Promise<Response> => {
  try {
    await ensureChallanTables();
    const { customer_id, products, notes, status } = req.body || {};

    if (!customer_id || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ message: 'Customer and at least one product are required', status: 'error' });
    }

    const challanNumber = buildChallanNumber();
    const challanStatus = getStatusFromChallan(status || 'DRAFT');

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const challanResult = await client.query(
        `INSERT INTO sales_challans (challan_number, customer_id, status, created_by, notes)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [challanNumber, Number(customer_id), challanStatus, req.user?.email || 'system', notes || null]
      );

      const challanId = challanResult.rows[0].id;
      const items: ChallanItem[] = [];

      for (const item of products) {
        const productId = Number(item.product_id);
        const quantity = Number(item.quantity);

        if (!productId || !Number.isFinite(quantity) || quantity <= 0) {
          throw new Error('Each challan item must include a valid product and quantity');
        }

        const productResult = await client.query('SELECT product_name, sku, price FROM products WHERE id = $1', [productId]);
        if (productResult.rows.length === 0) {
          throw new Error(`Product not found for id ${productId}`);
        }

        const product = productResult.rows[0];

        items.push({
          challan_id: challanId,
          product_id: productId,
          product_name_snapshot: product.product_name,
          sku_snapshot: product.sku,
          quantity,
          unit_price_snapshot: Number(product.price),
        });
      }

      for (const item of items) {
        await client.query(
          `INSERT INTO challan_items (challan_id, product_id, product_name_snapshot, sku_snapshot, quantity, unit_price_snapshot)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [item.challan_id, item.product_id, item.product_name_snapshot, item.sku_snapshot, item.quantity, item.unit_price_snapshot]
        );
      }

      await client.query('COMMIT');
      return res.status(201).json({ message: 'Challan created successfully', challan: challanResult.rows[0], items });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Create challan error:', error);
    const message = error instanceof Error ? error.message : 'Failed to create challan';
    return res.status(400).json({ message, status: 'error' });
  }
};

export const confirmChallan = async (req: Request, res: Response): Promise<Response> => {
  try {
    await ensureChallanTables();
    const { id } = req.params;

    const challanResult = await pool.query('SELECT * FROM sales_challans WHERE id = $1', [id]);
    if (challanResult.rows.length === 0) {
      return res.status(404).json({ message: 'Challan not found', status: 'error' });
    }

    const challan = challanResult.rows[0];
    if (challan.status === 'CONFIRMED') {
      return res.status(400).json({ message: 'Challan is already confirmed', status: 'error' });
    }

    const itemsResult = await pool.query('SELECT * FROM challan_items WHERE challan_id = $1', [id]);
    if (itemsResult.rows.length === 0) {
      return res.status(400).json({ message: 'Challan has no items to confirm', status: 'error' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const inventoryChecks: Array<{ product_id: number; quantity: number; available: number }> = [];

      for (const item of itemsResult.rows) {
        const inventoryRow = await client.query('SELECT quantity FROM inventory WHERE product_id = $1 FOR UPDATE', [item.product_id]);
        const current = inventoryRow.rows[0] ? Number(inventoryRow.rows[0].quantity) : 0;

        if (current < Number(item.quantity)) {
          await client.query('ROLLBACK');
          return res.status(400).json({
            message: `Insufficient stock for product ${item.product_id}. Available quantity: ${current}`,
            status: 'error',
          });
        }

        inventoryChecks.push({ product_id: item.product_id, quantity: Number(item.quantity), available: current });
      }

      for (const entry of inventoryChecks) {
        await client.query(
          'UPDATE inventory SET quantity = quantity - $1, updated_at = NOW() WHERE product_id = $2',
          [entry.quantity, entry.product_id]
        );

        await client.query(
          `INSERT INTO stock_movements (product_id, movement_type, quantity, reason, created_by)
           VALUES ($1, 'OUT', $2, 'Challan confirmation', $3)`,
          [entry.product_id, entry.quantity, req.user?.id ?? null]
        );
      }

      const updatedChallan = await client.query(
        'UPDATE sales_challans SET status = $1 WHERE id = $2 RETURNING *',
        ['CONFIRMED', id]
      );

      await client.query('COMMIT');
      return res.status(200).json({ message: 'Challan confirmed successfully', challan: updatedChallan.rows[0] });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Confirm challan error:', error);
    return res.status(500).json({ message: 'Failed to confirm challan', status: 'error' });
  }
};

export const cancelChallan = async (req: Request, res: Response): Promise<Response> => {
  try {
    await ensureChallanTables();
    const challanResult = await pool.query('SELECT * FROM sales_challans WHERE id = $1', [req.params.id]);
    if (challanResult.rows.length === 0) {
      return res.status(404).json({ message: 'Challan not found', status: 'error' });
    }

    const updated = await pool.query(
      'UPDATE sales_challans SET status = $1 WHERE id = $2 RETURNING *',
      ['CANCELLED', req.params.id]
    );

    return res.status(200).json({ message: 'Challan cancelled successfully', challan: updated.rows[0] });
  } catch (error) {
    console.error('Cancel challan error:', error);
    return res.status(500).json({ message: 'Failed to cancel challan', status: 'error' });
  }
};
